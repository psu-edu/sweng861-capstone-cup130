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

async function createUser(
  authSubject = 'auth0|student-1',
  email = 'student1@example.edu',
  role = 'STUDENT',
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO users (
          auth_subject,
          email,
          role
        )
        VALUES ($1, $2, $3)
        RETURNING id
      `,
      [
        authSubject,
        email,
        role,
      ],
    );

  const userId = result.rows[0]?.id;

  if (userId === undefined) {
    throw new Error(
      'User insert did not return an id.',
    );
  }

  return userId;
}

async function createStudentProfile(
  userId: string,
  studentNumber = 'PSU0001',
): Promise<void> {
  await pool.query(
    `
      INSERT INTO student_profiles (
        user_id,
        student_number,
        first_name,
        last_name,
        gender,
        academic_status,
        major,
        anticipated_graduation_semester,
        anticipated_graduation_year
      )
      VALUES (
        $1,
        $2,
        'Test',
        'Student',
        'UNSPECIFIED',
        'GRADUATE',
        'Software Engineering',
        'SPRING',
        2027
      )
    `,
    [
      userId,
      studentNumber,
    ],
  );
}

describe(
  'users and student_profiles schema',
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
      'records migration 0001 as applied',
      async () => {
        const report =
          await getMigrationStatus();

        expect(report.initialized).toBe(true);

        expect(
          report.migrations,
        ).toContainEqual({
          filename:
            '0001_create_users_and_student_profiles.sql',
          status: 'applied',
        });
      },
    );

    it.each([
      'STUDENT',
      'HOUSING_OFFICER',
    ])(
      'accepts the supported user role %s',
      async (role) => {
        const userId =
          await createUser(
            `auth0|${role.toLowerCase()}`,
            `${role.toLowerCase()}@example.edu`,
            role,
          );

        const result =
          await pool.query<{
            role: string;
          }>(
            `
              SELECT role
              FROM users
              WHERE id = $1
            `,
            [
              userId,
            ],
          );

        expect(
          result.rows[0]?.role,
        ).toBe(role);
      },
    );

    it(
      'rejects an unsupported user role',
      async () => {
        await expect(
          createUser(
            'auth0|invalid-role',
            'invalid-role@example.edu',
            'ADMIN',
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'requires unique external authentication subjects',
      async () => {
        await createUser();

        await expect(
          createUser(
            'auth0|student-1',
            'student2@example.edu',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'requires unique email addresses',
      async () => {
        await createUser();

        await expect(
          createUser(
            'auth0|student-2',
            'student1@example.edu',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'creates a valid student profile for an existing user',
      async () => {
        const userId =
          await createUser();

        await createStudentProfile(
          userId,
        );

        const result =
          await pool.query<{
            student_number: string;
            academic_status: string;
            major: string;
          }>(
            `
              SELECT
                student_number,
                academic_status,
                major
              FROM student_profiles
              WHERE user_id = $1
            `,
            [
              userId,
            ],
          );

        expect(
          result.rows[0],
        ).toMatchObject({
          student_number: 'PSU0001',
          academic_status: 'GRADUATE',
          major: 'Software Engineering',
        });
      },
    );

    it(
      'requires a student profile to reference an existing user',
      async () => {
        await expect(
          createStudentProfile(
            '999999',
          ),
        ).rejects.toMatchObject({
          code: '23503',
        });
      },
    );

    it(
      'allows only one student profile per user',
      async () => {
        const userId =
          await createUser();

        await createStudentProfile(
          userId,
          'PSU0001',
        );

        await expect(
          createStudentProfile(
            userId,
            'PSU0002',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'requires unique student numbers',
      async () => {
        const firstUserId =
          await createUser(
            'auth0|student-1',
            'student1@example.edu',
          );

        const secondUserId =
          await createUser(
            'auth0|student-2',
            'student2@example.edu',
          );

        await createStudentProfile(
          firstUserId,
          'PSU0001',
        );

        await expect(
          createStudentProfile(
            secondUserId,
            'PSU0001',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'rejects an unsupported gender value',
      async () => {
        const userId =
          await createUser();

        await expect(
          pool.query(
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
                'PSU0001',
                'Test',
                'Student',
                'INVALID',
                'GRADUATE',
                'Software Engineering'
              )
            `,
            [
              userId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'rejects an unsupported academic status',
      async () => {
        const userId =
          await createUser();

        await expect(
          pool.query(
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
                'PSU0001',
                'Test',
                'Student',
                'UNSPECIFIED',
                'INVALID',
                'Software Engineering'
              )
            `,
            [
              userId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'rejects an unsupported graduation semester',
      async () => {
        const userId =
          await createUser();

        await expect(
          pool.query(
            `
              INSERT INTO student_profiles (
                user_id,
                student_number,
                first_name,
                last_name,
                gender,
                academic_status,
                major,
                anticipated_graduation_semester
              )
              VALUES (
                $1,
                'PSU0001',
                'Test',
                'Student',
                'UNSPECIFIED',
                'GRADUATE',
                'Software Engineering',
                'WINTER'
              )
            `,
            [
              userId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'prevents deletion of a user that owns a student profile',
      async () => {
        const userId =
          await createUser();

        await createStudentProfile(
          userId,
        );

        await expect(
          pool.query(
            `
              DELETE FROM users
              WHERE id = $1
            `,
            [
              userId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23001',
        });
      },
    );
  },
);