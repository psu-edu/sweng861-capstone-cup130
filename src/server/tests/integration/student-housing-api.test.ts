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
            id:
              userId,
            authSubject:
              `test|${userId}`,
            email:
              'student-housing-test@example.edu',
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
          $3
        )
        RETURNING id
      `,
      [
        `test|student-housing-${sequence}`,
        `student-housing-${sequence}@example.edu`,
        role,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (
    id === undefined
  ) {
    throw new Error(
      'User insert did not return an id.',
    );
  }

  return id;
}

async function createStudent(
  sequence: number,
  firstName: string,
  lastName: string,
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
        'MALE',
        'SENIOR',
        'Software Engineering',
        'SPRING',
        2028
      )
    `,
    [
      userId,
      `HSG${sequence}`,
      firstName,
      lastName,
    ],
  );

  return userId;
}

async function createBuilding():
Promise<string> {
  const result =
    await pool.query<{
      id: string;
    }>(
      `
        INSERT INTO buildings (
          name,
          address,
          description
        )
        VALUES (
          'Student Housing Hall',
          '300 Campus Drive',
          'Student housing view test hall.'
        )
        RETURNING id
      `,
    );

  const id =
    result.rows[0]?.id;

  if (
    id === undefined
  ) {
    throw new Error(
      'Building insert did not return an id.',
    );
  }

  return id;
}

async function createRoom(
  buildingId: string,
): Promise<string> {
  const result =
    await pool.query<{
      id: string;
    }>(
      `
        INSERT INTO rooms (
          building_id,
          room_number,
          floor,
          room_style
        )
        VALUES (
          $1,
          '401',
          4,
          'QUAD'
        )
        RETURNING id
      `,
      [
        buildingId,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (
    id === undefined
  ) {
    throw new Error(
      'Room insert did not return an id.',
    );
  }

  return id;
}

async function createBed(
  roomId: string,
  bedLabel: string,
): Promise<string> {
  const result =
    await pool.query<{
      id: string;
    }>(
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

  const id =
    result.rows[0]?.id;

  if (
    id === undefined
  ) {
    throw new Error(
      'Bed insert did not return an id.',
    );
  }

  return id;
}

async function createApplication(
  studentId: string,
  buildingId: string,
  status:
    | 'HOUSING_ASSIGNED'
    | 'CANCELLED',
): Promise<string> {
  const result =
    await pool.query<{
      id: string;
    }>(
      `
        INSERT INTO housing_applications (
          student_id,
          academic_year,
          preferred_building_id,
          preferred_room_style,
          status,
          submitted_at,
          approved_at,
          housing_assigned_at,
          cancelled_at
        )
        VALUES (
          $1,
          '2026-2027',
          $2,
          'QUAD',
          $3::VARCHAR(30),
          NOW(),
          NOW(),
          CASE
            WHEN $3::VARCHAR(30) =
              'HOUSING_ASSIGNED'
            THEN NOW()
            ELSE NULL
          END,
          CASE
            WHEN $3::VARCHAR(30) =
              'CANCELLED'
            THEN NOW()
            ELSE NULL
          END
        )
        RETURNING id
      `,
      [
        studentId,
        buildingId,
        status,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (
    id === undefined
  ) {
    throw new Error(
      'Application insert did not return an id.',
    );
  }

  return id;
}

async function createAssignment(
  applicationId: string,
  bedId: string,
  status:
    | 'RESERVED'
    | 'CANCELLED',
): Promise<void> {
  await pool.query(
    `
      INSERT INTO housing_assignments (
        application_id,
        bed_id,
        status,
        reserved_at,
        cancelled_at
      )
      VALUES (
        $1,
        $2,
        $3::VARCHAR(30),
        NOW(),
        CASE
          WHEN $3::VARCHAR(30) =
            'CANCELLED'
          THEN NOW()
          ELSE NULL
        END
      )
    `,
    [
      applicationId,
      bedId,
      status,
    ],
  );
}

async function createAcceptedRoommateRequest(
  firstStudentId: string,
  secondStudentId: string,
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
        '2026-2027',
        'ACCEPTED',
        NOW()
      )
    `,
    [
      firstStudentId,
      secondStudentId,
    ],
  );
}

function studentRequest(
  studentId: string,
) {
  return request(app)
    .get(
      '/api/student/housing-assignments',
    )
    .set(
      'x-test-user-id',
      studentId,
    )
    .set(
      'x-test-role',
      'STUDENT',
    );
}

describe(
  'student housing API',
  () => {
    beforeAll(async () => {
      await applyPendingMigrations();
    });

    beforeEach(async () => {
      await pool.query(`
        TRUNCATE TABLE
          leases,
          housing_assignments,
          roommate_requests,
          roommate_profiles,
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
      'returns accepted assigned roommates and room occupancy without exposing unrelated occupants',
      async () => {
        const firstStudentId =
          await createStudent(
            1,
            'Alex',
            'Morgan',
          );

        const roommateStudentId =
          await createStudent(
            2,
            'Jordan',
            'Lee',
          );

        const unrelatedStudentId =
          await createStudent(
            3,
            'Other',
            'Resident',
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const firstBedId =
          await createBed(
            roomId,
            'A',
          );

        const roommateBedId =
          await createBed(
            roomId,
            'B',
          );

        const unrelatedBedId =
          await createBed(
            roomId,
            'C',
          );

        await createBed(
          roomId,
          'D',
        );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const roommateApplicationId =
          await createApplication(
            roommateStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const unrelatedApplicationId =
          await createApplication(
            unrelatedStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createAssignment(
          firstApplicationId,
          firstBedId,
          'RESERVED',
        );

        await createAssignment(
          roommateApplicationId,
          roommateBedId,
          'RESERVED',
        );

        await createAssignment(
          unrelatedApplicationId,
          unrelatedBedId,
          'RESERVED',
        );

        await createAcceptedRoommateRequest(
          firstStudentId,
          roommateStudentId,
        );

        const response =
          await studentRequest(
            firstStudentId,
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          response.body
            .assignments[0],
        ).toMatchObject({
          applicationId:
            firstApplicationId,
          status:
            'RESERVED',
          buildingName:
            'Student Housing Hall',
          roomNumber:
            '401',
          roomStyle:
            'QUAD',
          bedLabel:
            'A',
          totalBedCount:
            4,
          occupiedBedCount:
            3,
          openBedCount:
            1,
          assignedRoommates: [
            {
              firstName:
                'Jordan',
              lastName:
                'Lee',
              bedLabel:
                'B',
            },
          ],
        });

        expect(
          JSON.stringify(
            response.body
              .assignments[0]
              .assignedRoommates,
          ),
        ).not.toContain(
          'Other',
        );
      },
    );

    it(
      'does not attach current roommate or occupancy information to historical assignments',
      async () => {
        const firstStudentId =
          await createStudent(
            1,
            'Alex',
            'Morgan',
          );

        const roommateStudentId =
          await createStudent(
            2,
            'Jordan',
            'Lee',
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const firstBedId =
          await createBed(
            roomId,
            'A',
          );

        const roommateBedId =
          await createBed(
            roomId,
            'B',
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'CANCELLED',
          );

        const roommateApplicationId =
          await createApplication(
            roommateStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createAssignment(
          firstApplicationId,
          firstBedId,
          'CANCELLED',
        );

        await createAssignment(
          roommateApplicationId,
          roommateBedId,
          'RESERVED',
        );

        await createAcceptedRoommateRequest(
          firstStudentId,
          roommateStudentId,
        );

        const response =
          await studentRequest(
            firstStudentId,
          );

        expect(
          response.status,
        ).toBe(200);

        expect(
          response.body
            .assignments[0],
        ).toMatchObject({
          status:
            'CANCELLED',
          totalBedCount:
            null,
          occupiedBedCount:
            null,
          openBedCount:
            null,
          assignedRoommates: [],
        });
      },
    );
  },
);