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

import type {
  Gender,
} from '../../src/modules/student-profile/student-profile.types.js';

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
              'roommate-api-test@example.edu',
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
        `test|roommate-api-${sequence}`,
        `roommate-api-${sequence}@example.edu`,
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

async function createStudent(
  sequence: number,
  firstName = `Student${sequence}`,
  lastName = 'Roommate',
  studentNumber = `RMA${sequence}`,
  gender: Gender = 'MALE',
): Promise<string> {
  const userId =
    await createUser(
      'STUDENT',
      sequence,
    );

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
        $4,
        $5,
        'SENIOR',
        'Software Engineering',
        'SPRING',
        2028
      )
    `,
    [
      userId,
      studentNumber,
      firstName,
      lastName,
      gender,
    ],
  );

  return userId;
}

function getAcademicYear(
  offset = 0,
): string {
  const now =
    new Date();

  const currentYear =
    now.getFullYear();

  const academicYearStart =
    now.getMonth() < 6
      ? currentYear - 1
      : currentYear;

  const firstYear =
    academicYearStart + offset;

  return `${firstYear}-${firstYear + 1}`;
}

function roommateProfileBody(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    optedIn: true,
    sleepSchedule: 3,
    wakeSchedule: 3,
    cleanliness: 5,
    studyEnvironment: 2,
    noiseTolerance: 2,
    socialPreference: 3,
    guestFrequency: 2,
    roomUse: 3,
    sharingPreference: 3,
    temperaturePreference: 2,
    communicationStyle: 4,
    conflictResolution: 4,
    priority1: 'CLEANLINESS',
    priority2: 'STUDY_ENVIRONMENT',
    priority3: 'COMMUNICATION_STYLE',
    aboutMe:
      'I enjoy a quiet room and keep shared spaces organized.',
    lookingFor:
      'Looking for a respectful roommate with similar study habits.',
    ...overrides,
  };
}

function studentRequest(
  studentId: string,
) {
  return {
    get:
      (path: string) =>
        request(app)
          .get(path)
          .set(
            'x-test-user-id',
            studentId,
          )
          .set(
            'x-test-role',
            'STUDENT',
          ),

    post:
      (path: string) =>
        request(app)
          .post(path)
          .set(
            'x-test-user-id',
            studentId,
          )
          .set(
            'x-test-role',
            'STUDENT',
          ),

    put:
      (path: string) =>
        request(app)
          .put(path)
          .set(
            'x-test-user-id',
            studentId,
          )
          .set(
            'x-test-role',
            'STUDENT',
          ),
  };
}

async function createRequestThroughApi(
  requesterId: string,
  requestedId: string,
): Promise<string> {
  const response =
    await studentRequest(
      requesterId,
    )
      .post(
        '/api/student/roommates/requests',
      )
      .send({
        requestedStudentId:
          requestedId,
        academicYear:
          getAcademicYear(),
      });

  expect(response.status)
    .toBe(201);

  return response.body.request.id as string;
}

describe(
  'student roommate matching API',
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
          roommate_requests,
          roommate_profiles,
          student_profiles,
          users
        RESTART IDENTITY CASCADE
      `);
    });

    afterAll(async () => {
      await closeDatabasePool();
    });

    it(
      'returns null when the student has not created a roommate profile',
      async () => {
        const studentId =
          await createStudent(1);

        const response =
          await studentRequest(
            studentId,
          )
            .get(
              '/api/student/roommates/profile',
            );

        expect(response.status)
          .toBe(200);

        expect(response.body)
          .toEqual({
            profile: null,
          });
      },
    );

    it(
      'creates a roommate profile for the authenticated student',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        const response =
          await studentRequest(
            firstStudentId,
          )
            .put(
              '/api/student/roommates/profile',
            )
            .send(
              roommateProfileBody({
                studentId:
                  secondStudentId,
              }),
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.profile,
        ).toMatchObject({
          studentId:
            firstStudentId,
          optedIn: true,
          cleanliness: 5,
          priority1:
            'CLEANLINESS',
        });

        const rows =
          await pool.query<{
            student_id: string;
          }>(
            `
              SELECT student_id
              FROM roommate_profiles
              ORDER BY student_id
            `,
          );

        expect(rows.rows)
          .toEqual([
            {
              student_id:
                firstStudentId,
            },
          ]);
      },
    );

    it(
      'updates the existing profile and preserves preferences when opting out',
      async () => {
        const studentId =
          await createStudent(1);

        await studentRequest(
          studentId,
        )
          .put(
            '/api/student/roommates/profile',
          )
          .send(
            roommateProfileBody(),
          );

        const response =
          await studentRequest(
            studentId,
          )
            .put(
              '/api/student/roommates/profile',
            )
            .send(
              roommateProfileBody({
                optedIn: false,
                cleanliness: 4,
                aboutMe:
                  '  Updated roommate profile.  ',
              }),
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.profile,
        ).toMatchObject({
          studentId,
          optedIn: false,
          cleanliness: 4,
          aboutMe:
            'Updated roommate profile.',
        });

        const countResult =
          await pool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::TEXT AS count
              FROM roommate_profiles
              WHERE student_id = $1
            `,
            [
              studentId,
            ],
          );

        expect(
          countResult.rows[0]?.count,
        ).toBe('1');
      },
    );

    it(
      'rejects profile preferences outside the 1 through 5 range',
      async () => {
        const studentId =
          await createStudent(1);

        const response =
          await studentRequest(
            studentId,
          )
            .put(
              '/api/student/roommates/profile',
            )
            .send(
              roommateProfileBody({
                cleanliness: 6,
              }),
            );

        expect(response.status)
          .toBe(400);

        expect(response.body)
          .toEqual({
            error:
              'validation_error',
            message:
              'Cleanliness preference must be an integer from 1 through 5.',
          });
      },
    );

    it(
      'rejects duplicate roommate priorities',
      async () => {
        const studentId =
          await createStudent(1);

        const response =
          await studentRequest(
            studentId,
          )
            .put(
              '/api/student/roommates/profile',
            )
            .send(
              roommateProfileBody({
                priority2:
                  'CLEANLINESS',
              }),
            );

        expect(response.status)
          .toBe(400);

        expect(response.body)
          .toEqual({
            error:
              'validation_error',
            message:
              'Roommate profile priorities must be unique.',
          });
      },
    );

    it(
      'searches students by name or student number without exposing sensitive profile fields',
      async () => {
        const currentStudentId =
          await createStudent(
            1,
            'Alex',
            'Morgan',
            'RM1001',
            'MALE',
          );

        const jordanId =
          await createStudent(
            2,
            'Jordan',
            'Lee',
            'RM2002',
            'MALE',
          );

        await createStudent(
          3,
          'Taylor',
          'Smith',
          'RM3003',
          'FEMALE',
        );

        const nameResponse =
          await studentRequest(
            currentStudentId,
          )
            .get(
              '/api/student/roommates/search?q=Jordan',
            );

        expect(nameResponse.status)
          .toBe(200);

        expect(
          nameResponse.body.students,
        ).toHaveLength(1);

        expect(
          nameResponse.body.students[0],
        ).toMatchObject({
          studentId: jordanId,
          studentNumber:
            'RM2002',
          firstName: 'Jordan',
          lastName: 'Lee',
          academicStatus:
            'SENIOR',
          major:
            'Software Engineering',
        });

        expect(
          nameResponse.body.students[0],
        ).not.toHaveProperty(
          'gender',
        );

        expect(
          nameResponse.body.students[0],
        ).not.toHaveProperty(
          'authSubject',
        );

        expect(
          nameResponse.body.students[0],
        ).not.toHaveProperty(
          'email',
        );

        expect(
          nameResponse.body.students[0],
        ).not.toHaveProperty(
          'aboutMe',
        );

        const numberResponse =
          await studentRequest(
            currentStudentId,
          )
            .get(
              '/api/student/roommates/search?q=RM2002',
            );

        expect(numberResponse.status)
          .toBe(200);

        expect(
          numberResponse.body.students,
        ).toHaveLength(1);

        expect(
          numberResponse.body.students[0].studentId,
        ).toBe(jordanId);

        const selfResponse =
          await studentRequest(
            currentStudentId,
          )
            .get(
              '/api/student/roommates/search?q=Alex',
            );

        expect(
          selfResponse.body.students,
        ).toEqual([]);
      },
    );

    it(
      'returns only same-gender students in roommate search results',
      async () => {
        const currentStudentId =
          await createStudent(
            1,
            'Current',
            'Student',
            'RM1001',
            'MALE',
          );

        const sameGenderId =
          await createStudent(
            2,
            'Same',
            'Match',
            'RM2002',
            'MALE',
          );

        await createStudent(
          3,
          'Different',
          'Match',
          'RM3003',
          'FEMALE',
        );

        await createStudent(
          4,
          'Unspecified',
          'Match',
          'RM4004',
          'UNSPECIFIED',
        );

        const response =
          await studentRequest(
            currentStudentId,
          )
            .get(
              '/api/student/roommates/search?q=Match',
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.students,
        ).toHaveLength(1);

        expect(
          response.body.students[0].studentId,
        ).toBe(
          sameGenderId,
        );
      },
    );

    it(
      'requires the current student to specify a matchable gender before searching',
      async () => {
        const studentId =
          await createStudent(
            1,
            'Alex',
            'Morgan',
            'RM1001',
            'UNSPECIFIED',
          );

        const response =
          await studentRequest(
            studentId,
          )
            .get(
              '/api/student/roommates/search?q=Jordan',
            );

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'Set your gender to MALE or FEMALE in your Student Profile before using roommate matching.',
          });
      },
    );

    it(
      'requires a search term',
      async () => {
        const studentId =
          await createStudent(1);

        const response =
          await studentRequest(
            studentId,
          )
            .get(
              '/api/student/roommates/search',
            );

        expect(response.status)
          .toBe(400);

        expect(response.body.error)
          .toBe(
            'validation_error',
          );
      },
    );

    it(
      'creates a direct roommate request without requiring AI opt-in profiles',
      async () => {
        const requesterId =
          await createStudent(
            1,
            'Alex',
            'Morgan',
            'RM1001',
            'MALE',
          );

        const requestedId =
          await createStudent(
            2,
            'Jordan',
            'Lee',
            'RM2002',
            'MALE',
          );

        const academicYear =
          getAcademicYear();

        const response =
          await studentRequest(
            requesterId,
          )
            .post(
              '/api/student/roommates/requests',
            )
            .send({
              requestedStudentId:
                requestedId,
              academicYear,
            });

        expect(response.status)
          .toBe(201);

        expect(
          response.body.request,
        ).toMatchObject({
          academicYear,
          status: 'PENDING',
          requester: {
            studentId:
              requesterId,
          },
          requested: {
            studentId:
              requestedId,
          },
        });

        const profileCount =
          await pool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::TEXT AS count
              FROM roommate_profiles
            `,
          );

        expect(
          profileCount.rows[0]?.count,
        ).toBe('0');
      },
    );

    it(
      'rejects direct roommate requests between different genders',
      async () => {
        const requesterId =
          await createStudent(
            1,
            'Alex',
            'Morgan',
            'RM1001',
            'MALE',
          );

        const requestedId =
          await createStudent(
            2,
            'Jordan',
            'Lee',
            'RM2002',
            'FEMALE',
          );

        const response =
          await studentRequest(
            requesterId,
          )
            .post(
              '/api/student/roommates/requests',
            )
            .send({
              requestedStudentId:
                requestedId,
              academicYear:
                getAcademicYear(),
            });

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'Roommate requests are limited to students with the same gender.',
          });

        const requestCount =
          await pool.query<{
            count: string;
          }>(
            `
              SELECT COUNT(*)::TEXT AS count
              FROM roommate_requests
            `,
          );

        expect(
          requestCount.rows[0]?.count,
        ).toBe('0');
      },
    );

    it(
      'rejects a direct request when the requested student has unspecified gender',
      async () => {
        const requesterId =
          await createStudent(
            1,
            'Alex',
            'Morgan',
            'RM1001',
            'MALE',
          );

        const requestedId =
          await createStudent(
            2,
            'Jordan',
            'Lee',
            'RM2002',
            'UNSPECIFIED',
          );

        const response =
          await studentRequest(
            requesterId,
          )
            .post(
              '/api/student/roommates/requests',
            )
            .send({
              requestedStudentId:
                requestedId,
              academicYear:
                getAcademicYear(),
            });

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'The requested student must set their gender to MALE or FEMALE before they can participate in roommate matching.',
          });
      },
    );

    it(
      'rejects roommate requests when the requesting student has unspecified gender',
      async () => {
        const requesterId =
          await createStudent(
            1,
            'Alex',
            'Morgan',
            'RM1001',
            'UNSPECIFIED',
          );

        const requestedId =
          await createStudent(
            2,
            'Jordan',
            'Lee',
            'RM2002',
            'MALE',
          );

        const response =
          await studentRequest(
            requesterId,
          )
            .post(
              '/api/student/roommates/requests',
            )
            .send({
              requestedStudentId:
                requestedId,
              academicYear:
                getAcademicYear(),
            });

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'Set your gender to MALE or FEMALE in your Student Profile before using roommate matching.',
          });
      },
    );

    it(
      'rejects self requests and unknown requested students',
      async () => {
        const studentId =
          await createStudent(1);

        const selfResponse =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/roommates/requests',
            )
            .send({
              requestedStudentId:
                studentId,
              academicYear:
                getAcademicYear(),
            });

        expect(selfResponse.status)
          .toBe(400);

        expect(selfResponse.body.message)
          .toBe(
            'You cannot send a roommate request to yourself.',
          );

        const missingResponse =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/roommates/requests',
            )
            .send({
              requestedStudentId:
                '999999',
              academicYear:
                getAcademicYear(),
            });

        expect(missingResponse.status)
          .toBe(404);

        expect(missingResponse.body)
          .toEqual({
            error: 'not_found',
            message:
              'The requested student was not found.',
          });
      },
    );

    it(
      'validates the roommate request academic year',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        const response =
          await studentRequest(
            requesterId,
          )
            .post(
              '/api/student/roommates/requests',
            )
            .send({
              requestedStudentId:
                requestedId,
              academicYear:
                '2026-2028',
            });

        expect(response.status)
          .toBe(400);

        expect(response.body)
          .toEqual({
            error:
              'validation_error',
            message:
              'The second academic year must immediately follow the first.',
          });
      },
    );

    it(
      'prevents duplicate active requests in either direction for the same pair and academic year',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        await createRequestThroughApi(
          firstStudentId,
          secondStudentId,
        );

        const duplicateResponse =
          await studentRequest(
            firstStudentId,
          )
            .post(
              '/api/student/roommates/requests',
            )
            .send({
              requestedStudentId:
                secondStudentId,
              academicYear:
                getAcademicYear(),
            });

        expect(
          duplicateResponse.status,
        ).toBe(409);

        const reverseResponse =
          await studentRequest(
            secondStudentId,
          )
            .post(
              '/api/student/roommates/requests',
            )
            .send({
              requestedStudentId:
                firstStudentId,
              academicYear:
                getAcademicYear(),
            });

        expect(reverseResponse.status)
          .toBe(409);

        expect(reverseResponse.body.message)
          .toBe(
            'An active roommate request already exists between these students for this academic year.',
          );
      },
    );

    it(
      'lists only roommate requests involving the authenticated student',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        const thirdStudentId =
          await createStudent(3);

        const firstRequestId =
          await createRequestThroughApi(
            firstStudentId,
            secondStudentId,
          );

        await createRequestThroughApi(
          secondStudentId,
          thirdStudentId,
        );

        const firstResponse =
          await studentRequest(
            firstStudentId,
          )
            .get(
              '/api/student/roommates/requests',
            );

        expect(firstResponse.status)
          .toBe(200);

        expect(
          firstResponse.body.requests,
        ).toHaveLength(1);

        expect(
          firstResponse.body.requests[0].id,
        ).toBe(firstRequestId);

        const thirdResponse =
          await studentRequest(
            thirdStudentId,
          )
            .get(
              '/api/student/roommates/requests',
            );

        expect(
          thirdResponse.body.requests,
        ).toHaveLength(1);

        expect(
          thirdResponse.body.requests[0].requester.studentId,
        ).toBe(secondStudentId);
      },
    );

    it(
      'establishes mutual consent only when the requested student accepts',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        const requestId =
          await createRequestThroughApi(
            requesterId,
            requestedId,
          );

        const beforeAccept =
          await pool.query<{
            status: string;
            responded_at: Date | null;
          }>(
            `
              SELECT
                status,
                responded_at
              FROM roommate_requests
              WHERE id = $1
            `,
            [
              requestId,
            ],
          );

        expect(
          beforeAccept.rows[0],
        ).toMatchObject({
          status: 'PENDING',
          responded_at: null,
        });

        const response =
          await studentRequest(
            requestedId,
          )
            .post(
              `/api/student/roommates/requests/${requestId}/accept`,
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.request,
        ).toMatchObject({
          id: requestId,
          status: 'ACCEPTED',
        });

        expect(
          response.body.request.respondedAt,
        ).not.toBeNull();
      },
    );

    it(
      'rechecks gender eligibility when a pending request is accepted',
      async () => {
        const requesterId =
          await createStudent(
            1,
            'Alex',
            'Morgan',
            'RM1001',
            'MALE',
          );

        const requestedId =
          await createStudent(
            2,
            'Jordan',
            'Lee',
            'RM2002',
            'MALE',
          );

        const requestId =
          await createRequestThroughApi(
            requesterId,
            requestedId,
          );

        await pool.query(
          `
            UPDATE student_profiles
            SET
              gender = 'FEMALE',
              updated_at = NOW()
            WHERE user_id = $1
          `,
          [
            requesterId,
          ],
        );

        const response =
          await studentRequest(
            requestedId,
          )
            .post(
              `/api/student/roommates/requests/${requestId}/accept`,
            );

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'Roommate requests are limited to students with the same gender.',
          });

        const result =
          await pool.query<{
            status: string;
          }>(
            `
              SELECT status
              FROM roommate_requests
              WHERE id = $1
            `,
            [
              requestId,
            ],
          );

        expect(
          result.rows[0]?.status,
        ).toBe('PENDING');
      },
    );

    it(
      'does not allow the requesting student to accept their own outgoing request',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        const requestId =
          await createRequestThroughApi(
            requesterId,
            requestedId,
          );

        const response =
          await studentRequest(
            requesterId,
          )
            .post(
              `/api/student/roommates/requests/${requestId}/accept`,
            );

        expect(response.status)
          .toBe(409);

        expect(response.body.message)
          .toBe(
            'Only the requested student can accept this roommate request.',
          );
      },
    );

    it(
      'allows the requested student to decline a pending request',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        const requestId =
          await createRequestThroughApi(
            requesterId,
            requestedId,
          );

        const response =
          await studentRequest(
            requestedId,
          )
            .post(
              `/api/student/roommates/requests/${requestId}/decline`,
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.request.status,
        ).toBe('DECLINED');

        expect(
          response.body.request.respondedAt,
        ).not.toBeNull();
      },
    );

    it(
      'allows the requesting student to cancel a pending request',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        const requestId =
          await createRequestThroughApi(
            requesterId,
            requestedId,
          );

        const response =
          await studentRequest(
            requesterId,
          )
            .post(
              `/api/student/roommates/requests/${requestId}/cancel`,
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.request.status,
        ).toBe('CANCELLED');

        expect(
          response.body.request.cancelledAt,
        ).not.toBeNull();

        expect(
          response.body.request.respondedAt,
        ).toBeNull();
      },
    );

    it(
      'does not allow a third student to act on a roommate request',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        const thirdStudentId =
          await createStudent(3);

        const requestId =
          await createRequestThroughApi(
            requesterId,
            requestedId,
          );

        const response =
          await studentRequest(
            thirdStudentId,
          )
            .post(
              `/api/student/roommates/requests/${requestId}/accept`,
            );

        expect(response.status)
          .toBe(404);

        expect(response.body)
          .toEqual({
            error: 'not_found',
            message:
              'Roommate request was not found.',
          });
      },
    );

    it(
      'does not allow a request to transition again after it is no longer pending',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        const requestId =
          await createRequestThroughApi(
            requesterId,
            requestedId,
          );

        await studentRequest(
          requestedId,
        )
          .post(
            `/api/student/roommates/requests/${requestId}/decline`,
          );

        const response =
          await studentRequest(
            requestedId,
          )
            .post(
              `/api/student/roommates/requests/${requestId}/accept`,
            );

        expect(response.status)
          .toBe(409);

        expect(response.body.message)
          .toBe(
            'Only pending roommate requests can be accepted.',
          );
      },
    );

    it(
      'prevents Housing Officers from using Student roommate endpoints',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const response =
          await request(app)
            .get(
              '/api/student/roommates/profile',
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
      },
    );
  },
);