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
              'housing-assignment-test@example.edu',
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
        `test|assignment-${sequence}`,
        `assignment-${sequence}@example.edu`,
        role,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (id === undefined) {
    throw new Error(
      'User insert did not return an id.',
    );
  }

  return id;
}

async function createStudent(
  sequence: number,
  firstName =
    `Student${sequence}`,
  lastName =
    'Assignment',
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
      `HAS${sequence}`,
      firstName,
      lastName,
    ],
  );

  return userId;
}

async function createBuilding(
  name =
    'Assignment Hall',
): Promise<string> {
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
          $1,
          '100 Campus Drive',
          'Assignment test hall.'
        )
        RETURNING id
      `,
      [
        name,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (id === undefined) {
    throw new Error(
      'Building insert did not return an id.',
    );
  }

  return id;
}

async function createRoom(
  buildingId: string,
  roomNumber =
    '201',
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
          $2,
          2,
          'DOUBLE'
        )
        RETURNING id
      `,
      [
        buildingId,
        roomNumber,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (id === undefined) {
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

  if (id === undefined) {
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
    | 'DRAFT'
    | 'SUBMITTED'
    | 'APPROVED'
    | 'HOUSING_ASSIGNED'
    | 'COMPLETED'
    | 'CANCELLED',
  academicYear =
    '2026-2027',
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
          completed_at
        )
        VALUES (
          $1,
          $2,
          $3,
          'DOUBLE',
          $4::VARCHAR(30),
          CASE
            WHEN $4::VARCHAR(30) IN (
              'SUBMITTED',
              'APPROVED',
              'HOUSING_ASSIGNED',
              'COMPLETED'
            )
              THEN NOW()
            ELSE NULL
          END,
          CASE
            WHEN $4::VARCHAR(30) IN (
              'APPROVED',
              'HOUSING_ASSIGNED',
              'COMPLETED'
            )
              THEN NOW()
            ELSE NULL
          END,
          CASE
            WHEN $4::VARCHAR(30) IN (
              'HOUSING_ASSIGNED',
              'COMPLETED'
            )
              THEN NOW()
            ELSE NULL
          END,
          CASE
            WHEN $4::VARCHAR(30) =
              'COMPLETED'
              THEN NOW()
            ELSE NULL
          END
        )
        RETURNING id
      `,
      [
        studentId,
        academicYear,
        buildingId,
        status,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (id === undefined) {
    throw new Error(
      'Application insert did not return an id.',
    );
  }

  return id;
}

async function createAcceptedRoommateRequest(
  firstStudentId: string,
  secondStudentId: string,
  academicYear =
    '2026-2027',
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
        'ACCEPTED',
        NOW()
      )
    `,
    [
      firstStudentId,
      secondStudentId,
      academicYear,
    ],
  );
}

async function createExistingAssignment(
  applicationId: string,
  bedId: string,
  status:
    | 'RESERVED'
    | 'CONFIRMED',
): Promise<string> {
  const result =
    await pool.query<{
      id: string;
    }>(
      `
        INSERT INTO housing_assignments (
          application_id,
          bed_id,
          status,
          reserved_at,
          confirmed_at
        )
        VALUES (
          $1,
          $2,
          $3::VARCHAR(30),
          NOW(),
          CASE
            WHEN $3::VARCHAR(30) =
              'CONFIRMED'
              THEN NOW()
            ELSE NULL
          END
        )
        RETURNING id
      `,
      [
        applicationId,
        bedId,
        status,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (id === undefined) {
    throw new Error(
      'Assignment insert did not return an id.',
    );
  }

  return id;
}

function apiRequest(
  userId: string,
  role: UserRole,
) {
  return {
    get:
      (path: string) =>
        request(app)
          .get(path)
          .set(
            'x-test-user-id',
            userId,
          )
          .set(
            'x-test-role',
            role,
          ),

    post:
      (path: string) =>
        request(app)
          .post(path)
          .set(
            'x-test-user-id',
            userId,
          )
          .set(
            'x-test-role',
            role,
          ),
  };
}

describe(
  'housing assignment API',
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
      'returns assignment-ready applications, accepted roommate information, and preferred inventory options',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const firstStudentId =
          await createStudent(
            2,
            'Alex',
            'Morgan',
          );

        const secondStudentId =
          await createStudent(
            3,
            'Jordan',
            'Lee',
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        await createBed(
          roomId,
          'A',
        );

        await createBed(
          roomId,
          'B',
        );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'APPROVED',
          );

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'APPROVED',
          );

        await createAcceptedRoommateRequest(
          firstStudentId,
          secondStudentId,
        );

        const overviewResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          ).get(
            '/api/assignments',
          );

        expect(
          overviewResponse.status,
        ).toBe(200);

        const firstApplication =
          overviewResponse
            .body
            .applications
            .find(
              (
                application:
                  { id: string },
              ) =>
                application.id
                === firstApplicationId,
            );

        expect(
          firstApplication,
        ).toMatchObject({
          id:
            firstApplicationId,
          status:
            'APPROVED',
          preferredBuildingId:
            buildingId,
          preferredRoomStyle:
            'DOUBLE',
          assignmentId:
            null,

          roommates: [
            {
              studentId:
                secondStudentId,
              firstName:
                'Jordan',
              lastName:
                'Lee',
              applicationId:
                secondApplicationId,
              applicationStatus:
                'APPROVED',
            },
          ],
        });

        const optionsResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          ).get(
            `/api/assignments/applications/${firstApplicationId}/options`,
          );

        expect(
          optionsResponse.status,
        ).toBe(200);

        expect(
          optionsResponse
            .body
            .options
            .buildings[0],
        ).toMatchObject({
          id:
            buildingId,
          preferredBuilding:
            true,

          rooms: [
            {
              id:
                roomId,
              roomStyle:
                'DOUBLE',
              preferredRoomStyle:
                true,
              matchesPreferences:
                true,
              availableBedCount:
                2,
            },
          ],
        });
      },
    );

    it(
      'creates a reserved assignment and transitions the application in one workflow',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(
            2,
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
            'A',
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'APPROVED',
          );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId,
              bedId,
            });

        expect(
          response.status,
        ).toBe(201);

        expect(
          response.body.assignment,
        ).toMatchObject({
          applicationId,
          studentId,
          status:
            'RESERVED',
          buildingId,
          roomId,
          bedId,
        });

        const applicationResult =
          await pool.query<{
            status: string;
            housing_assigned_at:
              Date | null;
          }>(
            `
              SELECT
                status,
                housing_assigned_at
              FROM housing_applications
              WHERE id = $1
            `,
            [
              applicationId,
            ],
          );

        expect(
          applicationResult
            .rows[0]?.status,
        ).toBe(
          'HOUSING_ASSIGNED',
        );

        expect(
          applicationResult
            .rows[0]
            ?.housing_assigned_at,
        ).not.toBeNull();

        const studentResponse =
          await apiRequest(
            studentId,
            'STUDENT',
          ).get(
            '/api/student/housing-assignments',
          );

        expect(
          studentResponse.status,
        ).toBe(200);

        expect(
          studentResponse
            .body
            .assignments[0],
        ).toMatchObject({
          applicationId,
          status:
            'RESERVED',
          buildingName:
            'Assignment Hall',
          roomNumber:
            '201',
          roomStyle:
            'DOUBLE',
          bedLabel:
            'A',
        });
      },
    );

    it(
      'rejects assignment when the housing application is not approved',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(
            2,
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
            'A',
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'SUBMITTED',
          );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId,
              bedId,
            });

        expect(
          response.status,
        ).toBe(409);

        expect(
          response.body.message,
        ).toBe(
          'Only approved housing applications can receive a housing assignment.',
        );
      },
    );

    it(
      'rejects assignment to inactive inventory',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(
            2,
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
            'A',
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'APPROVED',
          );

        await pool.query(
          `
            UPDATE beds
            SET active = FALSE
            WHERE id = $1
          `,
          [
            bedId,
          ],
        );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId,
              bedId,
            });

        expect(
          response.status,
        ).toBe(409);

        expect(
          response.body.message,
        ).toBe(
          'The selected bed is not active and available for assignment.',
        );
      },
    );

    it(
      'allows only one concurrent assignment attempt to claim the same bed',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const firstStudentId =
          await createStudent(
            2,
          );

        const secondStudentId =
          await createStudent(
            3,
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
            'A',
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'APPROVED',
          );

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'APPROVED',
          );

        const [
          firstResponse,
          secondResponse,
        ] = await Promise.all([
          apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId:
                firstApplicationId,
              bedId,
            }),

          apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId:
                secondApplicationId,
              bedId,
            }),
        ]);

        expect(
          [
            firstResponse.status,
            secondResponse.status,
          ].sort(),
        ).toEqual([
          201,
          409,
        ]);

        const assignmentResult =
          await pool.query<{
            count: number;
          }>(
            `
              SELECT
                COUNT(*)::INTEGER
                  AS count
              FROM housing_assignments
              WHERE bed_id = $1
                AND status IN (
                  'RESERVED',
                  'CONFIRMED'
                )
            `,
            [
              bedId,
            ],
          );

        expect(
          assignmentResult
            .rows[0]?.count,
        ).toBe(1);

        const applicationResult =
          await pool.query<{
            status: string;
          }>(
            `
              SELECT status
              FROM housing_applications
              WHERE id =
                ANY($1::bigint[])
              ORDER BY id
            `,
            [
              [
                firstApplicationId,
                secondApplicationId,
              ],
            ],
          );

        expect(
          applicationResult
            .rows
            .map(
              (row) =>
                row.status,
            )
            .sort(),
        ).toEqual([
          'APPROVED',
          'HOUSING_ASSIGNED',
        ]);
      },
    );

    it(
      'creates an accepted roommate pair in two beds in the same room atomically',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const firstStudentId =
          await createStudent(
            2,
            'Alex',
            'Morgan',
          );

        const secondStudentId =
          await createStudent(
            3,
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

        const secondBedId =
          await createBed(
            roomId,
            'B',
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'APPROVED',
          );

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'APPROVED',
          );

        await createAcceptedRoommateRequest(
          firstStudentId,
          secondStudentId,
        );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments/pair',
            )
            .send({
              applicationId:
                firstApplicationId,
              roommateApplicationId:
                secondApplicationId,
              bedId:
                firstBedId,
              roommateBedId:
                secondBedId,
            });

        expect(
          response.status,
        ).toBe(201);

        expect(
          response
            .body
            .assignments,
        ).toHaveLength(2);

        expect(
          response
            .body
            .assignments
            .map(
              (
                assignment:
                  { status: string },
              ) =>
                assignment.status,
            ),
        ).toEqual([
          'RESERVED',
          'RESERVED',
        ]);

        const applicationResult =
          await pool.query<{
            status: string;
          }>(
            `
              SELECT status
              FROM housing_applications
              WHERE id =
                ANY($1::bigint[])
            `,
            [
              [
                firstApplicationId,
                secondApplicationId,
              ],
            ],
          );

        expect(
          applicationResult
            .rows
            .every(
              (row) =>
                row.status
                === 'HOUSING_ASSIGNED',
            ),
        ).toBe(true);
      },
    );

    it(
      'rejects pair assignment without accepted roommate consent and creates neither assignment',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const firstStudentId =
          await createStudent(
            2,
          );

        const secondStudentId =
          await createStudent(
            3,
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

        const secondBedId =
          await createBed(
            roomId,
            'B',
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'APPROVED',
          );

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'APPROVED',
          );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments/pair',
            )
            .send({
              applicationId:
                firstApplicationId,
              roommateApplicationId:
                secondApplicationId,
              bedId:
                firstBedId,
              roommateBedId:
                secondBedId,
            });

        expect(
          response.status,
        ).toBe(409);

        expect(
          response.body.message,
        ).toBe(
          'The selected students do not have an accepted roommate request for this academic year.',
        );

        const assignmentResult =
          await pool.query<{
            count: number;
          }>(
            `
              SELECT
                COUNT(*)::INTEGER
                  AS count
              FROM housing_assignments
            `,
          );

        expect(
          assignmentResult
            .rows[0]?.count,
        ).toBe(0);
      },
    );

    it(
      'rolls back both roommate assignments when either selected bed is unavailable',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const firstStudentId =
          await createStudent(
            2,
          );

        const secondStudentId =
          await createStudent(
            3,
          );

        const thirdStudentId =
          await createStudent(
            4,
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

        const secondBedId =
          await createBed(
            roomId,
            'B',
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'APPROVED',
          );

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'APPROVED',
          );

        const thirdApplicationId =
          await createApplication(
            thirdStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createAcceptedRoommateRequest(
          firstStudentId,
          secondStudentId,
        );

        await createExistingAssignment(
          thirdApplicationId,
          secondBedId,
          'RESERVED',
        );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments/pair',
            )
            .send({
              applicationId:
                firstApplicationId,
              roommateApplicationId:
                secondApplicationId,
              bedId:
                firstBedId,
              roommateBedId:
                secondBedId,
            });

        expect(
          response.status,
        ).toBe(409);

        const pairAssignmentResult =
          await pool.query<{
            count: number;
          }>(
            `
              SELECT
                COUNT(*)::INTEGER
                  AS count
              FROM housing_assignments
              WHERE application_id =
                ANY($1::bigint[])
            `,
            [
              [
                firstApplicationId,
                secondApplicationId,
              ],
            ],
          );

        expect(
          pairAssignmentResult
            .rows[0]?.count,
        ).toBe(0);

        const applicationResult =
          await pool.query<{
            status: string;
          }>(
            `
              SELECT status
              FROM housing_applications
              WHERE id =
                ANY($1::bigint[])
            `,
            [
              [
                firstApplicationId,
                secondApplicationId,
              ],
            ],
          );

        expect(
          applicationResult
            .rows
            .every(
              (row) =>
                row.status
                === 'APPROVED',
            ),
        ).toBe(true);
      },
    );

    it(
      'cancels a reserved assignment and releases the bed for another approved application',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const firstStudentId =
          await createStudent(
            2,
          );

        const secondStudentId =
          await createStudent(
            3,
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
            'A',
          );

        const firstApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'APPROVED',
          );

        const createResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId:
                firstApplicationId,
              bedId,
            });

        const assignmentId =
          createResponse
            .body
            .assignment
            .id as string;

        const cancelResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          ).post(
            `/api/assignments/${assignmentId}/cancel`,
          );

        expect(
          cancelResponse.status,
        ).toBe(200);

        expect(
          cancelResponse
            .body
            .assignment,
        ).toMatchObject({
          id:
            assignmentId,
          status:
            'CANCELLED',
          cancelledBy:
            officerId,
        });

        const firstApplicationResult =
          await pool.query<{
            status: string;
            cancelled_by:
              string | null;
          }>(
            `
              SELECT
                status,
                cancelled_by
              FROM housing_applications
              WHERE id = $1
            `,
            [
              firstApplicationId,
            ],
          );

        expect(
          firstApplicationResult
            .rows[0],
        ).toMatchObject({
          status:
            'CANCELLED',
          cancelled_by:
            officerId,
        });

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'APPROVED',
          );

        const secondCreateResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId:
                secondApplicationId,
              bedId,
            });

        expect(
          secondCreateResponse.status,
        ).toBe(201);
      },
    );

    it(
      'voids an unfinished local lease when a reserved assignment is cancelled',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(
            2,
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
            'A',
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'APPROVED',
          );

        const createResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId,
              bedId,
            });

        const assignmentId =
          createResponse
            .body
            .assignment
            .id as string;

        await pool.query(
          `
            INSERT INTO leases (
              assignment_id,
              status
            )
            VALUES (
              $1,
              'GENERATED'
            )
          `,
          [
            assignmentId,
          ],
        );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          ).post(
            `/api/assignments/${assignmentId}/cancel`,
          );

        expect(
          response.status,
        ).toBe(200);

        const leaseResult =
          await pool.query<{
            status: string;
            voided_by:
              string | null;
            voided_at:
              Date | null;
          }>(
            `
              SELECT
                status,
                voided_by,
                voided_at
              FROM leases
              WHERE assignment_id = $1
            `,
            [
              assignmentId,
            ],
          );

        expect(
          leaseResult.rows[0],
        ).toMatchObject({
          status:
            'VOIDED',
          voided_by:
            officerId,
        });

        expect(
          leaseResult
            .rows[0]
            ?.voided_at,
        ).not.toBeNull();
      },
    );

    it(
      'does not cancel a reserved assignment after its lease was sent for signature',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(
            2,
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
          );

        const bedId =
          await createBed(
            roomId,
            'A',
          );

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'APPROVED',
          );

        const createResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId,
              bedId,
            });

        const assignmentId =
          createResponse
            .body
            .assignment
            .id as string;

        await pool.query(
          `
            INSERT INTO leases (
              assignment_id,
              status,
              sent_at
            )
            VALUES (
              $1,
              'SENT_FOR_SIGNATURE',
              NOW()
            )
          `,
          [
            assignmentId,
          ],
        );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          ).post(
            `/api/assignments/${assignmentId}/cancel`,
          );

        expect(
          response.status,
        ).toBe(409);

        expect(
          response.body.message,
        ).toBe(
          'The lease has already been sent for signature and must be voided through the lease workflow before cancelling this assignment.',
        );
      },
    );

    it(
      'preserves a confirmed historical assignment while reserving a replacement room-change assignment',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(
            2,
          );

        const buildingId =
          await createBuilding();

        const oldRoomId =
          await createRoom(
            buildingId,
            '201',
          );

        const newRoomId =
          await createRoom(
            buildingId,
            '202',
          );

        const oldBedId =
          await createBed(
            oldRoomId,
            'A',
          );

        const newBedId =
          await createBed(
            newRoomId,
            'A',
          );

        const oldApplicationId =
          await createApplication(
            studentId,
            buildingId,
            'COMPLETED',
          );

        const oldAssignmentId =
          await createExistingAssignment(
            oldApplicationId,
            oldBedId,
            'CONFIRMED',
          );

        const newApplicationId =
          await createApplication(
            studentId,
            buildingId,
            'APPROVED',
          );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId:
                newApplicationId,
              bedId:
                newBedId,
            });

        expect(
          response.status,
        ).toBe(201);

        const historyResult =
          await pool.query<{
            id: string;
            status: string;
          }>(
            `
              SELECT
                id,
                status
              FROM housing_assignments
              WHERE application_id =
                ANY($1::bigint[])
              ORDER BY id
            `,
            [
              [
                oldApplicationId,
                newApplicationId,
              ],
            ],
          );

        expect(
          historyResult.rows,
        ).toEqual([
          {
            id:
              oldAssignmentId,
            status:
              'CONFIRMED',
          },
          {
            id:
              response
                .body
                .assignment
                .id,
            status:
              'RESERVED',
          },
        ]);
      },
    );

    it(
      'enforces Student and Housing Officer role boundaries',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(
            2,
          );

        const studentOfficerResponse =
          await apiRequest(
            studentId,
            'STUDENT',
          ).get(
            '/api/assignments',
          );

        expect(
          studentOfficerResponse
            .status,
        ).toBe(403);

        const officerStudentResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          ).get(
            '/api/student/housing-assignments',
          );

        expect(
          officerStudentResponse
            .status,
        ).toBe(403);
      },
    );
  },
);