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
  applyDevelopmentSeed,
} from '../../src/db/seed-utils.js';

import {
  closeDatabasePool,
  pool,
} from '../../src/db/pool.js';

async function resetDomainData():
Promise<void> {
  await pool.query(`
    TRUNCATE TABLE
      roommate_requests,
      roommate_profiles,
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
}

describe(
  'development/demo seed data',
  () => {
    beforeAll(async () => {
      await applyPendingMigrations();
    });

    beforeEach(async () => {
      await resetDomainData();
    });

    afterAll(async () => {
      await closeDatabasePool();
    });

    it(
      'populates representative records across the domain',
      async () => {
        await applyDevelopmentSeed();

        const result =
          await pool.query<{
            users: number;
            student_profiles: number;
            buildings: number;
            rooms: number;
            beds: number;
            applications: number;
            assignments: number;
            leases: number;
            roommate_profiles: number;
            roommate_requests: number;
          }>(
            `
              SELECT
                (SELECT COUNT(*)::int FROM users)
                  AS users,
                (SELECT COUNT(*)::int FROM student_profiles)
                  AS student_profiles,
                (SELECT COUNT(*)::int FROM buildings)
                  AS buildings,
                (SELECT COUNT(*)::int FROM rooms)
                  AS rooms,
                (SELECT COUNT(*)::int FROM beds)
                  AS beds,
                (SELECT COUNT(*)::int FROM housing_applications)
                  AS applications,
                (SELECT COUNT(*)::int FROM housing_assignments)
                  AS assignments,
                (SELECT COUNT(*)::int FROM leases)
                  AS leases,
                (SELECT COUNT(*)::int FROM roommate_profiles)
                  AS roommate_profiles,
                (SELECT COUNT(*)::int FROM roommate_requests)
                  AS roommate_requests
            `,
          );

        expect(
          result.rows[0],
        ).toEqual({
          users: 5,
          student_profiles: 4,
          buildings: 2,
          rooms: 4,
          beds: 8,
          applications: 4,
          assignments: 2,
          leases: 2,
          roommate_profiles: 4,
          roommate_requests: 2,
        });
      },
    );

    it(
      'creates representative application workflow states',
      async () => {
        await applyDevelopmentSeed();

        const result =
          await pool.query<{
            status: string;
            count: number;
          }>(
            `
              SELECT
                status,
                COUNT(*)::int AS count
              FROM housing_applications
              GROUP BY status
              ORDER BY status
            `,
          );

        expect(
          result.rows,
        ).toEqual([
          {
            status: 'APPROVED',
            count: 1,
          },
          {
            status: 'COMPLETED',
            count: 1,
          },
          {
            status: 'DRAFT',
            count: 1,
          },
          {
            status: 'HOUSING_ASSIGNED',
            count: 1,
          },
        ]);
      },
    );

    it(
      'can be applied repeatedly without duplicating demo records',
      async () => {
        await applyDevelopmentSeed();
        await applyDevelopmentSeed();

        const result =
          await pool.query<{
            users: number;
            applications: number;
            assignments: number;
            roommate_requests: number;
          }>(
            `
              SELECT
                (SELECT COUNT(*)::int FROM users)
                  AS users,
                (SELECT COUNT(*)::int FROM housing_applications)
                  AS applications,
                (SELECT COUNT(*)::int FROM housing_assignments)
                  AS assignments,
                (SELECT COUNT(*)::int FROM roommate_requests)
                  AS roommate_requests
            `,
          );

        expect(
          result.rows[0],
        ).toEqual({
          users: 5,
          applications: 4,
          assignments: 2,
          roommate_requests: 2,
        });
      },
    );
  },
);