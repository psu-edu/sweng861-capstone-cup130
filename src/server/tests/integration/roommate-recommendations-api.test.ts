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

        if (
          userId !== undefined
        ) {
          const authenticatedRequest =
            req as AuthenticatedRequest;

          authenticatedRequest.currentUser = {
            id:
              userId,

            authSubject:
              `test|${userId}`,

            email:
              'recommendation-test@example.edu',

            role:
              'STUDENT',
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

async function createStudent(
  sequence: number,
  gender: Gender = 'MALE',
  firstName = `Student${sequence}`,
  lastName = 'Candidate',
): Promise<string> {
  const userResult =
    await pool.query<{
      id: string;
    }>(
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
        `test|recommendation-${sequence}`,
        `recommendation-${sequence}@example.edu`,
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
      `REC${sequence}`,
      firstName,
      lastName,
      gender,
    ],
  );

  return userId;
}

async function createRoommateProfile(
  studentId: string,
  options: {
    optedIn?: boolean;
    preferenceValue?: number;
    aboutMe?: string;
    lookingFor?: string;
  } = {},
): Promise<void> {
  const optedIn =
    options.optedIn
    ?? true;

  const preferenceValue =
    options.preferenceValue
    ?? 3;

  const aboutMe =
    options.aboutMe
    ?? 'I like a quiet room and keep shared spaces clean.';

  const lookingFor =
    options.lookingFor
    ?? 'Looking for clear communication and similar study habits.';

  await pool.query(
    `
      INSERT INTO roommate_profiles (
        student_id,
        opted_in,
        sleep_schedule,
        wake_schedule,
        cleanliness,
        study_environment,
        noise_tolerance,
        social_preference,
        guest_frequency,
        room_use,
        sharing_preference,
        temperature_preference,
        communication_style,
        conflict_resolution,
        priority_1,
        priority_2,
        priority_3,
        about_me,
        looking_for
      )
      VALUES (
        $1,
        $2,
        $3,
        $3,
        $3,
        $3,
        $3,
        $3,
        $3,
        $3,
        $3,
        $3,
        $3,
        $3,
        'CLEANLINESS',
        'STUDY_ENVIRONMENT',
        'COMMUNICATION_STYLE',
        $4,
        $5
      )
    `,
    [
      studentId,
      optedIn,
      preferenceValue,
      aboutMe,
      lookingFor,
    ],
  );
}

function getAcademicYear():
string {
  const now =
    new Date();

  const currentYear =
    now.getFullYear();

  const firstYear =
    now.getMonth() < 6
      ? currentYear - 1
      : currentYear;

  return (
    `${firstYear}-${firstYear + 1}`
  );
}

function studentGet(
  studentId: string,
  path: string,
) {
  return request(app)
    .get(path)
    .set(
      'x-test-user-id',
      studentId,
    )
    .set(
      'x-test-role',
      'STUDENT',
    );
}

async function createRoommateRequest(
  requesterId: string,
  requestedId: string,
  status:
    'PENDING'
    | 'ACCEPTED',
): Promise<void> {
  await pool.query(
    `
      INSERT INTO roommate_requests (
        requester_student_id,
        requested_student_id,
        academic_year,
        status,
        responded_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        CASE
          WHEN $4::VARCHAR(30) =
            'ACCEPTED'
          THEN NOW()
          ELSE NULL
        END
      )
    `,
    [
      requesterId,
      requestedId,
      getAcademicYear(),
      status,
    ],
  );
}

describe(
  'AI-assisted roommate recommendations API',
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
      'requires the current student to complete and opt into a roommate profile',
      async () => {
        const studentId =
          await createStudent(1);

        const academicYear =
          getAcademicYear();

        const missingResponse =
          await studentGet(
            studentId,
            `/api/student/roommates/recommendations?academicYear=${academicYear}`,
          );

        expect(
          missingResponse.status,
        ).toBe(409);

        expect(
          missingResponse.body.message,
        ).toBe(
          'Complete your roommate profile before requesting AI-assisted recommendations.',
        );

        await createRoommateProfile(
          studentId,
          {
            optedIn:
              false,
          },
        );

        const optedOutResponse =
          await studentGet(
            studentId,
            `/api/student/roommates/recommendations?academicYear=${academicYear}`,
          );

        expect(
          optedOutResponse.status,
        ).toBe(409);

        expect(
          optedOutResponse.body.message,
        ).toBe(
          'Opt into AI-assisted roommate matching before requesting recommendations.',
        );
      },
    );

    it(
      'returns only eligible same-gender opted-in candidates',
      async () => {
        const currentId =
          await createStudent(
            1,
            'MALE',
            'Alex',
            'Current',
          );

        await createRoommateProfile(
          currentId,
        );

        const eligibleId =
          await createStudent(
            2,
            'MALE',
            'Jordan',
            'Eligible',
          );

        await createRoommateProfile(
          eligibleId,
        );

        const differentGenderId =
          await createStudent(
            3,
            'FEMALE',
            'Taylor',
            'Different',
          );

        await createRoommateProfile(
          differentGenderId,
        );

        const optedOutId =
          await createStudent(
            4,
            'MALE',
            'Casey',
            'OptedOut',
          );

        await createRoommateProfile(
          optedOutId,
          {
            optedIn:
              false,
          },
        );

        const alreadyPairedId =
          await createStudent(
            5,
            'MALE',
            'Morgan',
            'Paired',
          );

        await createRoommateProfile(
          alreadyPairedId,
        );

        const pairPartnerId =
          await createStudent(
            6,
            'MALE',
            'Riley',
            'Partner',
          );

        await createRoommateProfile(
          pairPartnerId,
        );

        await createRoommateRequest(
          alreadyPairedId,
          pairPartnerId,
          'ACCEPTED',
        );

        const academicYear =
          getAcademicYear();

        const response =
          await studentGet(
            currentId,
            `/api/student/roommates/recommendations?academicYear=${academicYear}`,
          );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.academicYear,
        ).toBe(
          academicYear,
        );

        expect(
          response.body.recommendations,
        ).toHaveLength(1);

        expect(
          response.body.recommendations[0].candidate.studentId,
        ).toBe(
          eligibleId,
        );

        expect(
          response.body.recommendations[0].candidate,
        ).not.toHaveProperty(
          'gender',
        );

        expect(
          response.body.recommendations[0],
        ).toMatchObject({
          analysisSource:
            'MOCK',
        });

        const serialized =
          JSON.stringify(
            response.body,
          );

        expect(serialized)
          .not.toContain(
            differentGenderId,
          );

        expect(serialized)
          .not.toContain(
            optedOutId,
          );

        expect(serialized)
          .not.toContain(
            alreadyPairedId,
          );
      },
    );

    it(
      'blocks AI recommendations when the student already has an accepted direct roommate request',
      async () => {
        const currentId =
          await createStudent(
            1,
          );

        const roommateId =
          await createStudent(
            2,
          );

        await createRoommateProfile(
          currentId,
        );

        await createRoommateProfile(
          roommateId,
        );

        await createRoommateRequest(
          currentId,
          roommateId,
          'ACCEPTED',
        );

        const response =
          await studentGet(
            currentId,
            `/api/student/roommates/recommendations?academicYear=${getAcademicYear()}`,
          );

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error:
              'conflict',

            message:
              'AI-assisted recommendations are unavailable because you already have an accepted roommate request for this academic year.',
          });
      },
    );

    it(
      'ranks stronger structured compatibility ahead of weaker compatibility',
      async () => {
        const currentId =
          await createStudent(
            1,
          );

        await createRoommateProfile(
          currentId,
          {
            preferenceValue:
              1,
          },
        );

        const strongId =
          await createStudent(
            2,
            'MALE',
            'Strong',
            'Match',
          );

        await createRoommateProfile(
          strongId,
          {
            preferenceValue:
              1,
          },
        );

        const weakId =
          await createStudent(
            3,
            'MALE',
            'Weak',
            'Match',
          );

        await createRoommateProfile(
          weakId,
          {
            preferenceValue:
              5,
          },
        );

        const response =
          await studentGet(
            currentId,
            `/api/student/roommates/recommendations?academicYear=${getAcademicYear()}`,
          );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.recommendations,
        ).toHaveLength(2);

        expect(
          response.body.recommendations[0].candidate.studentId,
        ).toBe(
          strongId,
        );

        expect(
          response.body.recommendations[1].candidate.studentId,
        ).toBe(
          weakId,
        );

        expect(
          response.body.recommendations[0].structuredScore,
        ).toBeGreaterThan(
          response.body.recommendations[1].structuredScore,
        );

        expect(
          response.body.recommendations[0].compatibilityScore,
        ).toBeGreaterThan(
          response.body.recommendations[1].compatibilityScore,
        );
      },
    );

    it(
      'does not recommend a candidate when an active request already exists between the pair',
      async () => {
        const currentId =
          await createStudent(
            1,
          );

        const candidateId =
          await createStudent(
            2,
          );

        await createRoommateProfile(
          currentId,
        );

        await createRoommateProfile(
          candidateId,
        );

        await createRoommateRequest(
          currentId,
          candidateId,
          'PENDING',
        );

        const response =
          await studentGet(
            currentId,
            `/api/student/roommates/recommendations?academicYear=${getAcademicYear()}`,
          );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.recommendations,
        ).toEqual([]);
      },
    );

    it(
      'limits AI analysis to the five strongest structured candidates',
      async () => {
        const currentId =
          await createStudent(
            1,
          );

        await createRoommateProfile(
          currentId,
        );

        for (
          let sequence = 2;
          sequence <= 7;
          sequence += 1
        ) {
          const candidateId =
            await createStudent(
              sequence,
            );

          await createRoommateProfile(
            candidateId,
          );
        }

        const response =
          await studentGet(
            currentId,
            `/api/student/roommates/recommendations?academicYear=${getAcademicYear()}`,
          );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.recommendations,
        ).toHaveLength(5);
      },
    );

    it(
      'returns recommendations without automatically creating roommate requests',
      async () => {
        const currentId =
          await createStudent(
            1,
          );

        const candidateId =
          await createStudent(
            2,
          );

        await createRoommateProfile(
          currentId,
        );

        await createRoommateProfile(
          candidateId,
        );

        const response =
          await studentGet(
            currentId,
            `/api/student/roommates/recommendations?academicYear=${getAcademicYear()}`,
          );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.recommendations,
        ).toHaveLength(1);

        const requestCount =
          await pool.query<{
            count: string;
          }>(
            `
              SELECT
                COUNT(*)::TEXT
                  AS count
              FROM roommate_requests
            `,
          );

        expect(
          requestCount.rows[0]?.count,
        ).toBe('0');
      },
    );
  },
);