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
        `auth0|roommate-student-${sequence}`,
        `roommate-student-${sequence}@example.edu`,
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
      `RM${String(sequence).padStart(4, '0')}`,
    ],
  );

  return userId;
}

async function createRoommateProfile(
  studentId: string,
  optedIn = true,
): Promise<void> {
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
        3,
        3,
        4,
        2,
        3,
        3,
        2,
        3,
        3,
        2,
        4,
        4,
        'CLEANLINESS',
        'STUDY_ENVIRONMENT',
        'COMMUNICATION_STYLE',
        'Graduate student who enjoys a quiet room.',
        'Looking for a respectful and communicative roommate.'
      )
    `,
    [
      studentId,
      optedIn,
    ],
  );
}

async function createRoommateRequest(
  requesterStudentId: string,
  requestedStudentId: string,
  status = 'PENDING',
  academicYear = '2026-2027',
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
      `
        INSERT INTO roommate_requests (
          requester_student_id,
          requested_student_id,
          academic_year,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4
        )
        RETURNING id
      `,
      [
        requesterStudentId,
        requestedStudentId,
        academicYear,
        status,
      ],
    );

  const requestId =
    result.rows[0]?.id;

  if (requestId === undefined) {
    throw new Error(
      'Roommate request insert did not return an id.',
    );
  }

  return requestId;
}

describe(
  'roommate matching schema',
  () => {
    beforeAll(async () => {
      await applyPendingMigrations();
    });

    beforeEach(async () => {
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
    });

    afterAll(async () => {
      await closeDatabasePool();
    });

    it(
      'records migration 0004 as applied',
      async () => {
        const report =
          await getMigrationStatus();

        expect(
          report.migrations,
        ).toContainEqual({
          filename:
            '0004_create_roommate_matching.sql',
          status: 'applied',
        });
      },
    );

    it(
      'creates a roommate profile for a student',
      async () => {
        const studentId =
          await createStudent(1);

        await createRoommateProfile(
          studentId,
        );

        const result =
          await pool.query<{
            opted_in: boolean;
            cleanliness: number;
            priority_1: string;
          }>(
            `
              SELECT
                opted_in,
                cleanliness,
                priority_1
              FROM roommate_profiles
              WHERE student_id = $1
            `,
            [
              studentId,
            ],
          );

        expect(
          result.rows[0],
        ).toMatchObject({
          opted_in: true,
          cleanliness: 4,
          priority_1: 'CLEANLINESS',
        });
      },
    );

    it(
      'allows only one roommate profile per student',
      async () => {
        const studentId =
          await createStudent(1);

        await createRoommateProfile(
          studentId,
        );

        await expect(
          createRoommateProfile(
            studentId,
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'requires a roommate profile to reference a student',
      async () => {
        await expect(
          createRoommateProfile(
            '999999',
          ),
        ).rejects.toMatchObject({
          code: '23503',
        });
      },
    );

    it(
      'rejects lifestyle preference values outside the 1 through 5 range',
      async () => {
        const studentId =
          await createStudent(1);

        await expect(
          pool.query(
            `
              INSERT INTO roommate_profiles (
                student_id,
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
                conflict_resolution
              )
              VALUES (
                $1,
                6,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3
              )
            `,
            [
              studentId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'rejects an unsupported priority',
      async () => {
        const studentId =
          await createStudent(1);

        await expect(
          pool.query(
            `
              INSERT INTO roommate_profiles (
                student_id,
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
                priority_1
              )
              VALUES (
                $1,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                'INVALID'
              )
            `,
            [
              studentId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'prevents duplicate priority selections',
      async () => {
        const studentId =
          await createStudent(1);

        await expect(
          pool.query(
            `
              INSERT INTO roommate_profiles (
                student_id,
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
                priority_2
              )
              VALUES (
                $1,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                3,
                'CLEANLINESS',
                'CLEANLINESS'
              )
            `,
            [
              studentId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it.each([
      'PENDING',
      'ACCEPTED',
      'DECLINED',
      'CANCELLED',
    ])(
      'accepts roommate request status %s',
      async (status) => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        const requestId =
          await createRoommateRequest(
            requesterId,
            requestedId,
            status,
          );

        expect(
          requestId,
        ).toBeDefined();
      },
    );

    it(
      'rejects an unsupported roommate request status',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        await expect(
          createRoommateRequest(
            requesterId,
            requestedId,
            'INVALID',
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'prevents a student from requesting themselves',
      async () => {
        const studentId =
          await createStudent(1);

        await expect(
          createRoommateRequest(
            studentId,
            studentId,
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'requires roommate requests to reference existing students',
      async () => {
        const requesterId =
          await createStudent(1);

        await expect(
          createRoommateRequest(
            requesterId,
            '999999',
          ),
        ).rejects.toMatchObject({
          code: '23503',
        });
      },
    );

    it(
      'requires the roommate request academic year format YYYY-YYYY',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        await expect(
          createRoommateRequest(
            requesterId,
            requestedId,
            'PENDING',
            '2026/2027',
          ),
        ).rejects.toMatchObject({
          code: '23514',
        });
      },
    );

    it(
      'prevents duplicate pending requests for the same pair',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        await createRoommateRequest(
          requesterId,
          requestedId,
        );

        await expect(
          createRoommateRequest(
            requesterId,
            requestedId,
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'prevents a reverse-direction duplicate active request',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        await createRoommateRequest(
          firstStudentId,
          secondStudentId,
          'PENDING',
        );

        await expect(
          createRoommateRequest(
            secondStudentId,
            firstStudentId,
            'PENDING',
          ),
        ).rejects.toMatchObject({
          code: '23505',
        });
      },
    );

    it(
      'allows a new request after a previous request was declined',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        await createRoommateRequest(
          firstStudentId,
          secondStudentId,
          'DECLINED',
        );

        await expect(
          createRoommateRequest(
            secondStudentId,
            firstStudentId,
            'PENDING',
          ),
        ).resolves.toBeDefined();
      },
    );

    it(
      'allows a new request after a previous request was cancelled',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        await createRoommateRequest(
          firstStudentId,
          secondStudentId,
          'CANCELLED',
        );

        await expect(
          createRoommateRequest(
            firstStudentId,
            secondStudentId,
            'PENDING',
          ),
        ).resolves.toBeDefined();
      },
    );

    it(
      'prevents deleting a student profile referenced by a roommate request',
      async () => {
        const requesterId =
          await createStudent(1);

        const requestedId =
          await createStudent(2);

        await createRoommateRequest(
          requesterId,
          requestedId,
        );

        await expect(
          pool.query(
            `
              DELETE FROM student_profiles
              WHERE user_id = $1
            `,
            [
              requesterId,
            ],
          ),
        ).rejects.toMatchObject({
          code: '23001',
        });
      },
    );

    it(
      'creates the planned roommate request indexes',
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
                  'roommate_requests_active_pair_unique_idx',
                  'roommate_requests_requester_idx',
                  'roommate_requests_requested_idx',
                  'roommate_requests_status_idx'
                )
              ORDER BY indexname
            `,
          );

        expect(
          result.rows.map(
            (row) => row.indexname,
          ),
        ).toEqual([
          'roommate_requests_active_pair_unique_idx',
          'roommate_requests_requested_idx',
          'roommate_requests_requester_idx',
          'roommate_requests_status_idx',
        ]);
      },
    );
  },
);