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
  getMigrationStatus,
} from '../../src/db/migration-utils.js';

import {
  closeDatabasePool,
  pool,
} from '../../src/db/pool.js';

async function createStudent(
  sequence: number,
): Promise<string> {
  const userResult =
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
        `auth0|student-${sequence}`,
        `student${sequence}@example.edu`,
      ],
    );

  const userId =
    userResult.rows[0]?.id;

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
        'Test',
        'Student',
        'UNSPECIFIED',
        'GRADUATE',
        'Software Engineering'
      )
    `,
    [
      userId,
      `PSU${String(sequence).padStart(4, '0')}`,
    ],
  );

  return userId;
}

async function createBuilding(): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO buildings (
          name,
          address
        )
        VALUES (
          'East Residence Hall',
          '100 Campus Drive'
        )
        RETURNING id
      `,
    );

  const buildingId =
    result.rows[0]?.id;

  if (buildingId === undefined) {
    throw new Error(
      'Building insert did not return an id.',
    );
  }

  return buildingId;
}

async function createBed(
  buildingId: string,
  roomNumber = '201',
  bedLabel = 'A',
): Promise<string> {
  const roomResult =
    await pool.query<{ id: string }>(
      `
        INSERT INTO rooms (
          building_id,
          room_number,
          floor,
          room_style
        )
        VALUES (
          $1,
          $2,
          2,
          'DOUBLE'
        )
        RETURNING id
      `,
      [
        buildingId,
        roomNumber,
      ],
    );

  const roomId =
    roomResult.rows[0]?.id;

  if (roomId === undefined) {
    throw new Error(
      'Room insert did not return an id.',
    );
  }

  const bedResult =
    await pool.query<{ id: string }>(
      `
        INSERT INTO beds (
          room_id,
          bed_label
        )
        VALUES (
          $1,
          $2
        )
        RETURNING id
      `,
      [
        roomId,
        bedLabel,
      ],
    );

  const bedId =
    bedResult.rows[0]?.id;

  if (bedId === undefined) {
    throw new Error(
      'Bed insert did not return an id.',
    );
  }

  return bedId;
}

async function createApplication(
  studentId: string,
  buildingId: string,
  status = 'DRAFT',
  academicYear = '2026-2027',
  preferredRoomStyle = 'DOUBLE',
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
          $2,
          $3,
          $4,
          $5
        )
        RETURNING id
      `,
      [
        studentId,
        academicYear,
        buildingId,
        preferredRoomStyle,
        status,
      ],
    );

  const applicationId =
    result.rows[0]?.id;

  if (applicationId === undefined) {
    throw new Error(
      'Housing application insert did not return an id.',
    );
  }

  return applicationId;
}

async function createAssignment(
  applicationId: string,
  bedId: string,
  status = 'RESERVED',
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
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
        RETURNING id
      `,
      [
        applicationId,
        bedId,
        status,
      ],
    );

  const assignmentId =
    result.rows[0]?.id;

  if (assignmentId === undefined) {
    throw new Error(
      'Housing assignment insert did not return an id.',
    );
  }

  return assignmentId;
}

async function createLease(
  assignmentId: string,
  status = 'PENDING',
  externalEnvelopeId:
    string | null = null,
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO leases (
          assignment_id,
          status,
          external_envelope_id
        )
        VALUES (
          $1,
          $2,
          $3
        )
        RETURNING id
      `,
      [
        assignmentId,
        status,
        externalEnvelopeId,
      ],
    );

  const leaseId =
    result.rows[0]?.id;

  if (leaseId === undefined) {
    throw new Error(
      'Lease insert did not return an id.',
    );
  }

  return leaseId;
}

describe(
  'housing workflow schema',
  () => {
    beforeAll(async () => {
      await applyPendingMigrations();
    });

    beforeEach(async () => {
      await pool.query(`
        TRUNCATE TABLE
          leases,
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
      'records migration 0003 as applied',
      async () => {
        const report =
          await getMigrationStatus();

        expect(
          report.migrations,
        ).toContainEqual({
          filename:
            '0003_create_housing_workflow.sql',
          status: 'applied',
        });
      },
    );

    it.each([
      'DRAFT',
      'SUBMITTED',
      'APPROVED',
      'HOUSING_ASSIGNED',
      'COMPLETED',
      'CANCELLED',
    ])(
      'accepts housing application status %s',
      async (status) => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            status,
          );

        expect(
          applicationId,
        ).toBeDefined();
      },
    );

    it(
      'rejects an unsupported housing application status',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        await expect(
          createApplication(
            studentId,
            buildingId,
            'INVALID',
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'requires the academic year format YYYY-YYYY',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        await expect(
          createApplication(
            studentId,
            buildingId,
            'DRAFT',
            '2026/2027',
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'rejects an unsupported preferred room style',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        await expect(
          createApplication(
            studentId,
            buildingId,
            'DRAFT',
            '2026-2027',
            'SUITE',
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it.each([
      'DRAFT',
      'SUBMITTED',
      'APPROVED',
    ])(
      'allows only one unsecured application while status is %s',
      async (status) => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        await createApplication(
          studentId,
          buildingId,
          status,
        );

        await expect(
          createApplication(
            studentId,
            buildingId,
            'DRAFT',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'allows another application after housing has been assigned',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        await createApplication(
          studentId,
          buildingId,
          'HOUSING_ASSIGNED',
        );

        await expect(
          createApplication(
            studentId,
            buildingId,
            'DRAFT',
          ),
        ).resolves.toBeDefined();
      },
    );

    it.each([
      'RESERVED',
      'CONFIRMED',
      'CANCELLED',
      'SUPERSEDED',
    ])(
      'accepts housing assignment status %s',
      async (status) => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        const bedId =
          await createBed(
            buildingId,
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const assignmentId =
          await createAssignment(
            applicationId,
            bedId,
            status,
          );

        expect(
          assignmentId,
        ).toBeDefined();
      },
    );

    it(
      'rejects an unsupported housing assignment status',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        const bedId =
          await createBed(
            buildingId,
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await expect(
          createAssignment(
            applicationId,
            bedId,
            'INVALID',
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'allows only one assignment per application',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        const firstBedId =
          await createBed(
            buildingId,
            '201',
            'A',
          );

        const secondBedId =
          await createBed(
            buildingId,
            '202',
            'A',
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createAssignment(
          applicationId,
          firstBedId,
        );

        await expect(
          createAssignment(
            applicationId,
            secondBedId,
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'prevents two active assignments from using the same bed',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const bedId =
          await createBed(
            buildingId,
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createAssignment(
          firstApplicationId,
          bedId,
          'RESERVED',
        );

        await expect(
          createAssignment(
            secondApplicationId,
            bedId,
            'CONFIRMED',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'allows a bed to be reused after an assignment is cancelled',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const bedId =
          await createBed(
            buildingId,
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createAssignment(
          firstApplicationId,
          bedId,
          'CANCELLED',
        );

        await expect(
          createAssignment(
            secondApplicationId,
            bedId,
            'RESERVED',
          ),
        ).resolves.toBeDefined();
      },
    );

    it.each([
      'PENDING',
      'GENERATED',
      'SENT_FOR_SIGNATURE',
      'SIGNED',
      'VOIDED',
    ])(
      'accepts lease status %s',
      async (status) => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        const bedId =
          await createBed(
            buildingId,
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const assignmentId =
          await createAssignment(
            applicationId,
            bedId,
          );

        const leaseId =
          await createLease(
            assignmentId,
            status,
          );

        expect(
          leaseId,
        ).toBeDefined();
      },
    );

    it(
      'rejects an unsupported lease status',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        const bedId =
          await createBed(
            buildingId,
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const assignmentId =
          await createAssignment(
            applicationId,
            bedId,
          );

        await expect(
          createLease(
            assignmentId,
            'INVALID',
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'allows only one lease per housing assignment',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        const bedId =
          await createBed(
            buildingId,
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const assignmentId =
          await createAssignment(
            applicationId,
            bedId,
          );

        await createLease(
          assignmentId,
        );

        await expect(
          createLease(
            assignmentId,
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'requires external envelope identifiers to be unique',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const firstBedId =
          await createBed(
            buildingId,
            '201',
            'A',
          );

        const secondBedId =
          await createBed(
            buildingId,
            '202',
            'A',
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const firstAssignmentId =
          await createAssignment(
            firstApplicationId,
            firstBedId,
          );

        const secondAssignmentId =
          await createAssignment(
            secondApplicationId,
            secondBedId,
          );

        await createLease(
          firstAssignmentId,
          'SENT_FOR_SIGNATURE',
          'envelope-123',
        );

        await expect(
          createLease(
            secondAssignmentId,
            'SENT_FOR_SIGNATURE',
            'envelope-123',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'allows multiple leases with no external envelope identifier',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const firstBedId =
          await createBed(
            buildingId,
            '201',
            'A',
          );

        const secondBedId =
          await createBed(
            buildingId,
            '202',
            'A',
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const firstAssignmentId =
          await createAssignment(
            firstApplicationId,
            firstBedId,
          );

        const secondAssignmentId =
          await createAssignment(
            secondApplicationId,
            secondBedId,
          );

        await createLease(
          firstAssignmentId,
        );

        await expect(
          createLease(
            secondAssignmentId,
          ),
        ).resolves.toBeDefined();
      },
    );

    it(
      'prevents deleting an application that has an assignment',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        const bedId =
          await createBed(
            buildingId,
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createAssignment(
          applicationId,
          bedId,
        );

        await expect(
          pool.query(
            `
              DELETE FROM housing_applications
              WHERE id = $1
            `,
            [
              applicationId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23001',
        });
      },
    );

    it(
      'prevents deleting an assignment that has a lease',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuilding();

        const bedId =
          await createBed(
            buildingId,
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const assignmentId =
          await createAssignment(
            applicationId,
            bedId,
          );

        await createLease(
          assignmentId,
        );

        await expect(
          pool.query(
            `
              DELETE FROM housing_assignments
              WHERE id = $1
            `,
            [
              assignmentId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23001',
        });
      },
    );

    it(
      'creates the planned housing workflow indexes',
      async () => {
        const result =
          await pool.query<{
            indexname: string;
          }>(
            `
              SELECT indexname
              FROM pg_indexes
              WHERE schemaname = 'public'
                AND indexname IN (
                  'housing_applications_unsecured_student_unique_idx',
                  'housing_applications_student_id_idx',
                  'housing_applications_status_idx',
                  'housing_assignments_active_bed_unique_idx',
                  'housing_assignments_bed_id_idx',
                  'housing_assignments_status_idx',
                  'leases_status_idx'
                )
              ORDER BY indexname
            `,
          );

        expect(
          result.rows.map(
            (row) => row.indexname,
          ),
        ).toEqual([
          'housing_applications_status_idx',
          'housing_applications_student_id_idx',
          'housing_applications_unsecured_student_unique_idx',
          'housing_assignments_active_bed_unique_idx',
          'housing_assignments_bed_id_idx',
          'housing_assignments_status_idx',
          'leases_status_idx',
        ]);
      },
    );
  },
);