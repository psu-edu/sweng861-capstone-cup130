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

async function createBuilding(
  name = 'East Residence Hall',
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO buildings (
          name,
          address,
          description
        )
        VALUES (
          $1,
          '100 Campus Drive',
          'Test residence hall'
        )
        RETURNING id
      `,
      [
        name,
      ],
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

async function createRoom(
  buildingId: string,
  roomNumber = '201',
  roomStyle = 'DOUBLE',
): Promise<string> {
  const result =
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
          $3
        )
        RETURNING id
      `,
      [
        buildingId,
        roomNumber,
        roomStyle,
      ],
    );

  const roomId =
    result.rows[0]?.id;

  if (roomId === undefined) {
    throw new Error(
      'Room insert did not return an id.',
    );
  }

  return roomId;
}

async function createBed(
  roomId: string,
  bedLabel = 'A',
): Promise<string> {
  const result =
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
    result.rows[0]?.id;

  if (bedId === undefined) {
    throw new Error(
      'Bed insert did not return an id.',
    );
  }

  return bedId;
}

describe(
  'housing inventory schema',
  () => {
    beforeAll(async () => {
      await applyPendingMigrations();
    });

    beforeEach(async () => {
      await pool.query(`
        TRUNCATE TABLE
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
      'records migration 0002 as applied',
      async () => {
        const report =
          await getMigrationStatus();

        expect(
          report.migrations,
        ).toContainEqual({
          filename:
            '0002_create_housing_inventory.sql',
          status: 'applied',
        });
      },
    );

    it(
      'creates a building, room, and bed hierarchy',
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

        const result =
          await pool.query<{
            building_name: string;
            room_number: string;
            room_style: string;
            bed_label: string;
          }>(
            `
              SELECT
                buildings.name
                  AS building_name,
                rooms.room_number,
                rooms.room_style,
                beds.bed_label
              FROM buildings
              JOIN rooms
                ON rooms.building_id =
                  buildings.id
              JOIN beds
                ON beds.room_id =
                  rooms.id
              WHERE beds.id = $1
            `,
            [
              bedId,
            ],
          );

        expect(
          result.rows[0],
        ).toMatchObject({
          building_name:
            'East Residence Hall',
          room_number: '201',
          room_style: 'DOUBLE',
          bed_label: 'A',
        });
      },
    );

    it(
      'defaults inventory records to active',
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

        const result =
          await pool.query<{
            building_active: boolean;
            room_active: boolean;
            bed_active: boolean;
          }>(
            `
              SELECT
                buildings.active
                  AS building_active,
                rooms.active
                  AS room_active,
                beds.active
                  AS bed_active
              FROM buildings
              JOIN rooms
                ON rooms.building_id =
                  buildings.id
              JOIN beds
                ON beds.room_id =
                  rooms.id
              WHERE beds.id = $1
            `,
            [
              bedId,
            ],
          );

        expect(
          result.rows[0],
        ).toMatchObject({
          building_active: true,
          room_active: true,
          bed_active: true,
        });
      },
    );

    it.each([
      'SINGLE',
      'DOUBLE',
      'TRIPLE',
      'QUAD',
    ])(
      'accepts the supported room style %s',
      async (roomStyle) => {
        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
            '201',
            roomStyle,
          );

        const result =
          await pool.query<{
            room_style: string;
          }>(
            `
              SELECT room_style
              FROM rooms
              WHERE id = $1
            `,
            [
              roomId,
            ],
          );

        expect(
          result.rows[0]?.room_style,
        ).toBe(roomStyle);
      },
    );

    it(
      'rejects an unsupported room style',
      async () => {
        const buildingId =
          await createBuilding();

        await expect(
          createRoom(
            buildingId,
            '201',
            'SUITE',
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'requires unique building names',
      async () => {
        await createBuilding();

        await expect(
          createBuilding(),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'requires a room to reference an existing building',
      async () => {
        await expect(
          createRoom(
            '999999',
          ),
        ).rejects.toMatchObject({
          code: '23503',
        });
      },
    );

    it(
      'prevents duplicate room numbers within a building',
      async () => {
        const buildingId =
          await createBuilding();

        await createRoom(
          buildingId,
          '201',
        );

        await expect(
          createRoom(
            buildingId,
            '201',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'allows the same room number in different buildings',
      async () => {
        const firstBuildingId =
          await createBuilding(
            'East Residence Hall',
          );

        const secondBuildingId =
          await createBuilding(
            'West Residence Hall',
          );

        await createRoom(
          firstBuildingId,
          '201',
        );

        await expect(
          createRoom(
            secondBuildingId,
            '201',
          ),
        ).resolves.toBeDefined();
      },
    );

    it(
      'requires a bed to reference an existing room',
      async () => {
        await expect(
          createBed(
            '999999',
          ),
        ).rejects.toMatchObject({
          code: '23503',
        });
      },
    );

    it(
      'prevents duplicate bed labels within a room',
      async () => {
        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        await createBed(
          roomId,
          'A',
        );

        await expect(
          createBed(
            roomId,
            'A',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'allows the same bed label in different rooms',
      async () => {
        const buildingId =
          await createBuilding();

        const firstRoomId =
          await createRoom(
            buildingId,
            '201',
          );

        const secondRoomId =
          await createRoom(
            buildingId,
            '202',
          );

        await createBed(
          firstRoomId,
          'A',
        );

        await expect(
          createBed(
            secondRoomId,
            'A',
          ),
        ).resolves.toBeDefined();
      },
    );

    it(
      'prevents deletion of a building that contains rooms',
      async () => {
        const buildingId =
          await createBuilding();

        await createRoom(
          buildingId,
        );

        await expect(
          pool.query(
            `
              DELETE FROM buildings
              WHERE id = $1
            `,
            [
              buildingId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23001',
        });
      },
    );

    it(
      'prevents deletion of a room that contains beds',
      async () => {
        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        await createBed(
          roomId,
        );

        await expect(
          pool.query(
            `
              DELETE FROM rooms
              WHERE id = $1
            `,
            [
              roomId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23001',
        });
      },
    );

    it(
      'creates the planned inventory indexes',
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
                  'rooms_building_id_idx',
                  'beds_room_id_idx'
                )
              ORDER BY indexname
            `,
          );

        expect(
          result.rows.map(
            (row) => row.indexname,
          ),
        ).toEqual([
          'beds_room_id_idx',
          'rooms_building_id_idx',
        ]);
      },
    );
  },
);