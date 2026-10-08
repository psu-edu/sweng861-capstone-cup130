import type {
  RequestHandler,
} from 'express';

import request from 'supertest';

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import app from '../../src/app.js';

import type {
  AuthenticatedRequest,
  UserRole,
} from '../../src/auth/auth.types.js';

import {
  applyPendingMigrations,
} from '../../src/db/migration-utils.js';

import {
  closeDatabasePool,
  pool,
} from '../../src/db/pool.js';

vi.mock(
  '../../src/auth/auth.middleware.js',
  async () => {
    const actual =
      await vi.importActual<
        typeof import(
          '../../src/auth/auth.middleware.js'
        )
      >(
        '../../src/auth/auth.middleware.js',
      );

    const validateAccessToken:
      RequestHandler =
      (
        _req,
        _res,
        next,
      ): void => {
        next();
      };

    const resolveLocalUser:
      RequestHandler =
      (
        req,
        _res,
        next,
      ): void => {
        const userId =
          req.header(
            'x-test-user-id',
          );

        const role =
          req.header(
            'x-test-role',
          );

        if (
          userId !== undefined
          && (
            role === 'STUDENT'
            || role
              === 'HOUSING_OFFICER'
          )
        ) {
          const authenticatedRequest =
            req as AuthenticatedRequest;

          authenticatedRequest.currentUser = {
            id: userId,
            authSubject:
              `test|${userId}`,
            email:
              'authorization-test@example.edu',
            role,
          };
        }

        next();
      };

    return {
      ...actual,
      validateAccessToken,
      resolveLocalUser,
    };
  },
);

async function createUser(
  role: UserRole,
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
          $3
        )
        RETURNING id
      `,
      [
        `test|authorization-${sequence}`,
        `authorization-${sequence}@example.edu`,
        role,
      ],
    );

  const userId =
    result.rows[0]?.id;

  if (userId === undefined) {
    throw new Error(
      'User insert did not return an id.',
    );
  }

  return userId;
}

async function createStudentProfile(
  userId: string,
  sequence: number,
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
        $3,
        'Student',
        'UNSPECIFIED',
        'SENIOR',
        $4,
        'SPRING',
        2027
      )
    `,
    [
      userId,
      `AUTH${sequence}`,
      `Student${sequence}`,
      `Original Major ${sequence}`,
    ],
  );
}

describe(
  'student profile API authorization',
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
      'allows a student to retrieve their own profile',
      async () => {
        const studentId =
          await createUser(
            'STUDENT',
            1,
          );

        await createStudentProfile(
          studentId,
          1,
        );

        const response =
          await request(app)
            .get(
              '/api/student/profile',
            )
            .set(
              'x-test-user-id',
              studentId,
            )
            .set(
              'x-test-role',
              'STUDENT',
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.profile,
        ).toMatchObject({
          userId: studentId,
          studentNumber: 'AUTH1',
          firstName: 'Student1',
        });
        
        expect(
          response.body.profile,
        ).not.toHaveProperty(
          'role',
        );
        
        expect(
          response.body.profile,
        ).not.toHaveProperty(
          'authSubject',
        );
      },
    );

    it(
      'rejects a Housing Officer from the student profile endpoint',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const response =
          await request(app)
            .get(
              '/api/student/profile',
            )
            .set(
              'x-test-user-id',
              officerId,
            )
            .set(
              'x-test-role',
              'HOUSING_OFFICER',
            );

        expect(response.status)
          .toBe(403);

        expect(response.body)
          .toEqual({
            error: 'forbidden',
            message:
              'You do not have permission to access this resource.',
          });

        expect(response.body)
          .not.toHaveProperty(
            'profile',
          );
      },
    );

    it(
      'does not let a student update another student by supplying a userId',
      async () => {
        const firstStudentId =
          await createUser(
            'STUDENT',
            1,
          );

        const secondStudentId =
          await createUser(
            'STUDENT',
            2,
          );

        await createStudentProfile(
          firstStudentId,
          1,
        );

        await createStudentProfile(
          secondStudentId,
          2,
        );

        const response =
          await request(app)
            .put(
              '/api/student/profile',
            )
            .set(
              'x-test-user-id',
              firstStudentId,
            )
            .set(
              'x-test-role',
              'STUDENT',
            )
            .send({
              userId:
                secondStudentId,
              studentNumber:
                'AUTH1',
              firstName:
                'Updated',
              lastName:
                'Student',
              gender:
                'UNSPECIFIED',
              academicStatus:
                'SENIOR',
              major:
                'Updated Major',
              anticipatedGraduationSemester:
                'SPRING',
              anticipatedGraduationYear:
                2027,
            });

        expect(response.status)
          .toBe(200);

        expect(
          response.body.profile.userId,
        ).toBe(
          firstStudentId,
        );

        const profiles =
          await pool.query<{
            user_id: string;
            major: string;
          }>(
            `
              SELECT
                user_id,
                major
              FROM student_profiles
              ORDER BY user_id
            `,
          );

        expect(profiles.rows)
          .toEqual([
            {
              user_id:
                firstStudentId,
              major:
                'Updated Major',
            },
            {
              user_id:
                secondStudentId,
              major:
                'Original Major 2',
            },
          ]);
      },
    );
  },
);