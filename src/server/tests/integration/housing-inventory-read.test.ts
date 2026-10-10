import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  applyPendingMigrations,
} from '../../src/db/migration-utils.js';

import {
  closeDatabasePool,
  pool,
} from '../../src/db/pool.js';

import {
  getInventoryHierarchy,
  getStudentHousingOptions,
} from '../../src/modules/housing-inventory/housing-inventory.service.js';

async function createBuilding(
  name = 'East Residence Hall',
  active = true,
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO buildings (
          name,
          address,
          description,
          active
        )
        VALUES (
          $1,
          '100 University Avenue',
          'Test residence hall',
          $2
        )
        RETURNING id
      `,
      [
        name,
        active,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (id === undefined) {
    throw new Error(
      'Building insert did not return an id.',
    );
  }

  return id;
}

async function createRoom(
  buildingId: string,
  roomNumber = '201',
  roomStyle:
    'SINGLE'
    | 'DOUBLE'
    | 'TRIPLE'
    | 'QUAD' = 'DOUBLE',
  active = true,
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO rooms (
          building_id,
          room_number,
          floor,
          room_style,
          active
        )
        VALUES (
          $1,
          $2,
          2,
          $3,
          $4
        )
        RETURNING id
      `,
      [
        buildingId,
        roomNumber,
        roomStyle,
        active,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (id === undefined) {
    throw new Error(
      'Room insert did not return an id.',
    );
  }

  return id;
}

async function createBed(
  roomId: string,
  bedLabel = 'A',
  active = true,
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO beds (
          room_id,
          bed_label,
          active
        )
        VALUES (
          $1,
          $2,
          $3
        )
        RETURNING id
      `,
      [
        roomId,
        bedLabel,
        active,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (id === undefined) {
    throw new Error(
      'Bed insert did not return an id.',
    );
  }

  return id;
}

async function createStudent(
  sequence: number,
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO users (
          auth_subject,
          email,
          role
        )
        VALUES (
          $1,
          $2,
          'STUDENT'
        )
        RETURNING id
      `,
      [
        `test|inventory-student-${sequence}`,
        `inventory-student-${sequence}@example.edu`,
      ],
    );

  const userId =
    result.rows[0]?.id;

  if (userId === undefined) {
    throw new Error(
      'User insert did not return an id.',
    );
  }

  await pool.query(
    `
      INSERT INTO student_profiles (
        user_id,
        student_number,
        first_name,
        last_name,
        gender,
        academic_status,
        major
      )
      VALUES (
        $1,
        $2,
        'Inventory',
        'Student',
        'UNSPECIFIED',
        'SENIOR',
        'Software Engineering'
      )
    `,
    [
      userId,
      `INV${sequence}`,
    ],
  );

  return userId;
}

async function createApplication(
  studentId: string,
  buildingId: string,
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO housing_applications (
          student_id,
          academic_year,
          preferred_building_id,
          preferred_room_style,
          status
        )
        VALUES (
          $1,
          '2026-2027',
          $2,
          'DOUBLE',
          'APPROVED'
        )
        RETURNING id
      `,
      [
        studentId,
        buildingId,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (id === undefined) {
    throw new Error(
      'Application insert did not return an id.',
    );
  }

  return id;
}

async function createAssignment(
  applicationId: string,
  bedId: string,
  status:
    'RESERVED'
    | 'CONFIRMED'
    | 'CANCELLED',
): Promise<void> {
  await pool.query(
    `
      INSERT INTO housing_assignments (
        application_id,
        bed_id,
        status,
        reserved_at
      )
      VALUES (
        $1,
        $2,
        $3,
        NOW()
      )
    `,
    [
      applicationId,
      bedId,
      status,
    ],
  );
}

describe(
  'housing inventory read model',
  () => {
    beforeAll(async () => {
      await applyPendingMigrations();
    });

    beforeEach(async () => {
      await pool.query(`
        TRUNCATE TABLE
          housing_assignments,
          housing_applications,
          beds,
          rooms,
          buildings,
          student_profiles,
          users
        RESTART IDENTITY CASCADE
      `);
    });

    afterAll(async () => {
      await closeDatabasePool();
    });

    it(
      'returns the Building Room Bed hierarchy for Housing Officers',
      async () => {
        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
          );

        const buildings =
          await getInventoryHierarchy();

        expect(buildings)
          .toHaveLength(1);

        expect(buildings[0])
          .toMatchObject({
            id: buildingId,
            name:
              'East Residence Hall',
            active: true,
          });

        expect(
          buildings[0]?.rooms[0],
        ).toMatchObject({
          id: roomId,
          buildingId,
          roomNumber: '201',
          roomStyle: 'DOUBLE',
          active: true,
        });

        expect(
          buildings[0]
            ?.rooms[0]
            ?.beds[0],
        ).toEqual({
          id: bedId,
          bedLabel: 'A',
          active: true,
          available: true,
        });
      },
    );

    it.each([
      'RESERVED',
      'CONFIRMED',
    ] as const)(
      'marks a bed unavailable when it has a %s assignment',
      async (status) => {
        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
          );

        const studentId =
          await createStudent(1);

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
          );

        await createAssignment(
          applicationId,
          bedId,
          status,
        );

        const buildings =
          await getInventoryHierarchy();

        expect(
          buildings[0]
            ?.rooms[0]
            ?.beds[0]
            ?.available,
        ).toBe(false);
      },
    );

    it(
      'does not let inactive inventory appear available',
      async () => {
        const buildingId =
          await createBuilding(
            'Inactive Residence Hall',
            false,
          );

        const roomId =
          await createRoom(
            buildingId,
          );

        await createBed(
          roomId,
        );

        const buildings =
          await getInventoryHierarchy();

        expect(
          buildings[0]
            ?.rooms[0]
            ?.beds[0]
            ?.available,
        ).toBe(false);
      },
    );

    it(
      'treats a bed with a cancelled assignment as available',
      async () => {
        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
          );

        const studentId =
          await createStudent(1);

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
          );

        await createAssignment(
          applicationId,
          bedId,
          'CANCELLED',
        );

        const buildings =
          await getInventoryHierarchy();

        expect(
          buildings[0]
            ?.rooms[0]
            ?.beds[0]
            ?.available,
        ).toBe(true);
      },
    );

    it(
      'summarizes active housing options by building and room style for students',
      async () => {
        const eastBuildingId =
          await createBuilding(
            'East Residence Hall',
          );

        const doubleRoomId =
          await createRoom(
            eastBuildingId,
            '201',
            'DOUBLE',
          );

        const singleRoomId =
          await createRoom(
            eastBuildingId,
            '101',
            'SINGLE',
          );

        const availableDoubleBed =
          await createBed(
            doubleRoomId,
            'A',
          );

        const reservedDoubleBed =
          await createBed(
            doubleRoomId,
            'B',
          );

        await createBed(
          singleRoomId,
          'A',
        );

        const inactiveRoomId =
          await createRoom(
            eastBuildingId,
            '301',
            'TRIPLE',
            false,
          );

        await createBed(
          inactiveRoomId,
          'A',
        );

        const inactiveBuildingId =
          await createBuilding(
            'Closed Residence Hall',
            false,
          );

        const inactiveBuildingRoomId =
          await createRoom(
            inactiveBuildingId,
            '401',
            'QUAD',
          );

        await createBed(
          inactiveBuildingRoomId,
          'A',
        );

        const studentId =
          await createStudent(1);

        const applicationId =
          await createApplication(
            studentId,
            eastBuildingId,
          );

        await createAssignment(
          applicationId,
          reservedDoubleBed,
          'RESERVED',
        );

        const options =
          await getStudentHousingOptions();

        expect(options)
          .toHaveLength(1);

        expect(options[0])
          .toMatchObject({
            id: eastBuildingId,
            name:
              'East Residence Hall',
            totalBeds: 3,
            availableBeds: 2,
          });

        expect(
          options[0]?.roomStyles,
        ).toEqual(
          expect.arrayContaining([
            {
              roomStyle: 'DOUBLE',
              totalBeds: 2,
              availableBeds: 1,
            },
            {
              roomStyle: 'SINGLE',
              totalBeds: 1,
              availableBeds: 1,
            },
          ]),
        );

        expect(
          options[0]?.roomStyles,
        ).not.toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              roomStyle: 'TRIPLE',
            }),
            expect.objectContaining({
              roomStyle: 'QUAD',
            }),
          ]),
        );

        expect(
          availableDoubleBed,
        ).toBeDefined();
      },
    );
  },
);