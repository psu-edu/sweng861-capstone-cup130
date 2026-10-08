import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  StudentProfileConflictError,
  StudentProfileValidationError,
  getStudentProfile,
  updateStudentProfile,
} from '../../src/modules/student-profile/student-profile.service.js';

import {
  applyPendingMigrations,
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
        `auth0|profile-student-${sequence}`,
        `profile-student-${sequence}@example.edu`,
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
      `PROFILE${sequence}`,
    ],
  );

  return userId;
}

function createValidUpdate(
  studentNumber = 'PROFILE100',
) {
  return {
    studentNumber,
    firstName: 'Updated',
    lastName: 'Student',
    gender: 'UNSPECIFIED',
    academicStatus: 'SENIOR',
    major: 'Computer Science',
    anticipatedGraduationSemester:
      'FALL',
    anticipatedGraduationYear:
      2027,
  };
}

describe(
  'student profile service',
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
      'returns the profile for the authenticated student user',
      async () => {
        const userId =
          await createStudent(1);

        const profile =
          await getStudentProfile(
            userId,
          );

        expect(profile).toMatchObject({
          userId,
          studentNumber: 'PROFILE1',
          firstName: 'Test',
          lastName: 'Student',
          academicStatus: 'GRADUATE',
          major: 'Software Engineering',
        });
      },
    );

    it(
      'returns null when the student profile does not exist',
      async () => {
        const profile =
          await getStudentProfile(
            '999999',
          );

        expect(profile).toBeNull();
      },
    );

    it(
      'updates the student profile',
      async () => {
        const userId =
          await createStudent(1);

        const profile =
          await updateStudentProfile(
            userId,
            createValidUpdate(),
          );

        expect(profile).toMatchObject({
          userId,
          studentNumber:
            'PROFILE100',
          firstName:
            'Updated',
          academicStatus:
            'SENIOR',
          major:
            'Computer Science',
          anticipatedGraduationSemester:
            'FALL',
          anticipatedGraduationYear:
            2027,
        });
      },
    );

    it(
      'rejects an unsupported gender',
      async () => {
        const userId =
          await createStudent(1);

        await expect(
          updateStudentProfile(
            userId,
            {
              ...createValidUpdate(),
              gender: 'INVALID',
            },
          ),
        ).rejects.toBeInstanceOf(
          StudentProfileValidationError,
        );
      },
    );

    it(
      'rejects an unsupported academic status',
      async () => {
        const userId =
          await createStudent(1);

        await expect(
          updateStudentProfile(
            userId,
            {
              ...createValidUpdate(),
              academicStatus:
                'INVALID',
            },
          ),
        ).rejects.toBeInstanceOf(
          StudentProfileValidationError,
        );
      },
    );

    it(
      'rejects a student number already used by another student',
      async () => {
        await createStudent(1);

        const secondUserId =
          await createStudent(2);

        await expect(
          updateStudentProfile(
            secondUserId,
            createValidUpdate(
              'PROFILE1',
            ),
          ),
        ).rejects.toBeInstanceOf(
          StudentProfileConflictError,
        );
      },
    );
  },
);