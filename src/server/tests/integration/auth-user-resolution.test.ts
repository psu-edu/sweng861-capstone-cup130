import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  getAuthenticatedUser,
} from '../../src/auth/auth.service.js';

import {
  applyPendingMigrations,
} from '../../src/db/migration-utils.js';

import {
  closeDatabasePool,
  pool,
} from '../../src/db/pool.js';

describe(
  'authenticated user resolution',
  () => {
    beforeAll(async () => {
      await applyPendingMigrations();
    });

    beforeEach(async () => {
      await pool.query(`
        TRUNCATE TABLE
          student_profiles,
          users
        RESTART IDENTITY CASCADE
      `);
    });

    afterAll(async () => {
      await closeDatabasePool();
    });

    it(
      'resolves a registered Campus Rental user by authentication subject',
      async () => {
        await pool.query(
          `
            INSERT INTO users (
              auth_subject,
              email,
              role
            )
            VALUES (
              'auth0|student-test',
              'student@example.edu',
              'STUDENT'
            )
          `,
        );

        const user =
          await getAuthenticatedUser(
            'auth0|student-test',
          );

        expect(user).toMatchObject({
          authSubject:
            'auth0|student-test',
          email:
            'student@example.edu',
          role:
            'STUDENT',
        });

        expect(user?.id).toBeDefined();
      },
    );

    it(
      'returns null when the authentication subject is not registered',
      async () => {
        const user =
          await getAuthenticatedUser(
            'auth0|unknown-user',
          );

        expect(user).toBeNull();
      },
    );
  },
);