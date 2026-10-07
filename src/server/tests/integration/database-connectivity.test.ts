import {
  afterAll,
  describe,
  expect,
  it,
} from 'vitest';

import {
  environment,
} from '../../src/config/environment.js';

import {
  checkDatabaseConnection,
  closeDatabasePool,
  pool,
} from '../../src/db/pool.js';

describe(
  'PostgreSQL test database',
  () => {
    afterAll(async () => {
      await closeDatabasePool();
    });

    it(
      'uses a dedicated test database',
      () => {
        expect(
          environment.database.name,
        ).toMatch(/_test$/);
      },
    );

    it(
      'connects through the application database pool',
      async () => {
        await checkDatabaseConnection();

        const result =
          await pool.query<{
            database_name: string;
          }>(
            `
              SELECT current_database()
                AS database_name
            `,
          );

        expect(
          result.rows[0]?.database_name,
        ).toBe(
          environment.database.name,
        );
      },
    );
  },
);