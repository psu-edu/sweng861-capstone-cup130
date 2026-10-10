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

type StudentGender =
  | 'MALE'
  | 'FEMALE'
  | 'UNSPECIFIED';

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
              'assignment-gender-test@example.edu',
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
        `test|assignment-gender-${sequence}`,
        `assignment-gender-${sequence}@example.edu`,
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
  gender: StudentGender,
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
        'GenderTest',
        $4,
        'SENIOR',
        'Software Engineering',
        'SPRING',
        2028
      )
    `,
    [
      userId,
      `GND${sequence}`,
      `Student${sequence}`,
      gender,
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
          'Gender Policy Hall',
          '400 Campus Drive',
          'Gender assignment policy test hall.'
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
  roomNumber: string,
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
          'TRIPLE'
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
    | 'APPROVED'
    | 'HOUSING_ASSIGNED',
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
          housing_assigned_at
        )
        VALUES (
          $1,
          '2026-2027',
          $2,
          'TRIPLE',
          $3::VARCHAR(30),
          NOW(),
          NOW(),
          CASE
            WHEN $3::VARCHAR(30) =
              'HOUSING_ASSIGNED'
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

async function createExistingAssignment(
  applicationId: string,
  bedId: string,
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
          reserved_at
        )
        VALUES (
          $1,
          $2,
          'RESERVED',
          NOW()
        )
        RETURNING id
      `,
      [
        applicationId,
        bedId,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (
    id === undefined
  ) {
    throw new Error(
      'Assignment insert did not return an id.',
    );
  }

  return id;
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

function apiRequest(
  userId: string,
  role: UserRole,
) {
  return {
    get:
      (
        path: string,
      ) =>
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
      (
        path: string,
      ) =>
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
  'housing assignment gender policy',
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
      'removes beds in a male-occupied room from female assignment options',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const maleStudentId =
          await createStudent(
            2,
            'MALE',
          );

        const femaleStudentId =
          await createStudent(
            3,
            'FEMALE',
          );

        const buildingId =
          await createBuilding();

        const occupiedRoomId =
          await createRoom(
            buildingId,
            '201',
          );

        const emptyRoomId =
          await createRoom(
            buildingId,
            '202',
          );

        const occupiedBedId =
          await createBed(
            occupiedRoomId,
            'A',
          );

        await createBed(
          occupiedRoomId,
          'B',
        );

        await createBed(
          occupiedRoomId,
          'C',
        );

        await createBed(
          emptyRoomId,
          'A',
        );

        await createBed(
          emptyRoomId,
          'B',
        );

        await createBed(
          emptyRoomId,
          'C',
        );

        const maleApplicationId =
          await createApplication(
            maleStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createExistingAssignment(
          maleApplicationId,
          occupiedBedId,
        );

        const femaleApplicationId =
          await createApplication(
            femaleStudentId,
            buildingId,
            'APPROVED',
          );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          ).get(
            `/api/assignments/applications/${femaleApplicationId}/options`,
          );

        expect(
          response.status,
        ).toBe(200);

        const rooms =
          response.body
            .options
            .buildings
            .flatMap(
              (
                building: {
                  rooms: Array<{
                    id: string;
                    availableBedCount:
                      number;
                    beds: Array<{
                      available: boolean;
                    }>;
                  }>;
                },
              ) =>
                building.rooms,
            );

        const occupiedRoom =
          rooms.find(
            (
              room: {
                id: string;
              },
            ) =>
              room.id
              === occupiedRoomId,
          );

        const emptyRoom =
          rooms.find(
            (
              room: {
                id: string;
              },
            ) =>
              room.id
              === emptyRoomId,
          );

        expect(
          occupiedRoom
            ?.availableBedCount,
        ).toBe(0);

        expect(
          occupiedRoom
            ?.beds
            .every(
              (
                bed: {
                  available: boolean;
                },
              ) =>
                !bed.available,
            ),
        ).toBe(true);

        expect(
          emptyRoom
            ?.availableBedCount,
        ).toBe(3);
      },
    );

    it(
      'rejects mixed-gender assignment while allowing another student of the existing room gender',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const firstMaleStudentId =
          await createStudent(
            2,
            'MALE',
          );

        const femaleStudentId =
          await createStudent(
            3,
            'FEMALE',
          );

        const secondMaleStudentId =
          await createStudent(
            4,
            'MALE',
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
            '201',
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

        const thirdBedId =
          await createBed(
            roomId,
            'C',
          );

        const firstMaleApplicationId =
          await createApplication(
            firstMaleStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createExistingAssignment(
          firstMaleApplicationId,
          firstBedId,
        );

        const femaleApplicationId =
          await createApplication(
            femaleStudentId,
            buildingId,
            'APPROVED',
          );

        const femaleResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId:
                femaleApplicationId,
              bedId:
                secondBedId,
            });

        expect(
          femaleResponse.status,
        ).toBe(409);

        const secondMaleApplicationId =
          await createApplication(
            secondMaleStudentId,
            buildingId,
            'APPROVED',
          );

        const maleResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId:
                secondMaleApplicationId,
              bedId:
                thirdBedId,
            });

        expect(
          maleResponse.status,
        ).toBe(201);
      },
    );

    it(
      'allows an unspecified student into an empty room but prevents all later sharing',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const firstStudentId =
          await createStudent(
            2,
            'UNSPECIFIED',
          );

        const secondStudentId =
          await createStudent(
            3,
            'UNSPECIFIED',
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
            '201',
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

        const firstResponse =
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
              bedId:
                firstBedId,
            });

        expect(
          firstResponse.status,
        ).toBe(201);

        const secondApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'APPROVED',
          );

        const secondResponse =
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
              bedId:
                secondBedId,
            });

        expect(
          secondResponse.status,
        ).toBe(409);
      },
    );

    it(
      'rejects a mixed-gender roommate pair even when an accepted request exists',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const maleStudentId =
          await createStudent(
            2,
            'MALE',
          );

        const femaleStudentId =
          await createStudent(
            3,
            'FEMALE',
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
            '201',
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

        const maleApplicationId =
          await createApplication(
            maleStudentId,
            buildingId,
            'APPROVED',
          );

        const femaleApplicationId =
          await createApplication(
            femaleStudentId,
            buildingId,
            'APPROVED',
          );

        await createAcceptedRoommateRequest(
          maleStudentId,
          femaleStudentId,
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
                maleApplicationId,
              roommateApplicationId:
                femaleApplicationId,
              bedId:
                firstBedId,
              roommateBedId:
                secondBedId,
            });

        expect(
          response.status,
        ).toBe(409);

        const assignmentResult =
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
                AND status IN (
                  'RESERVED',
                  'CONFIRMED'
                )
            `,
            [
              [
                maleApplicationId,
                femaleApplicationId,
              ],
            ],
          );

        expect(
          assignmentResult
            .rows[0]?.count,
        ).toBe(0);
      },
    );

    it(
      'rejects changing an assignment into a room occupied by a different gender',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const maleStudentId =
          await createStudent(
            2,
            'MALE',
          );

        const femaleStudentId =
          await createStudent(
            3,
            'FEMALE',
          );

        const buildingId =
          await createBuilding();

        const maleRoomId =
          await createRoom(
            buildingId,
            '201',
          );

        const femaleRoomId =
          await createRoom(
            buildingId,
            '202',
          );

        const maleBedId =
          await createBed(
            maleRoomId,
            'A',
          );

        const femaleBedId =
          await createBed(
            femaleRoomId,
            'A',
          );

        const targetBedId =
          await createBed(
            femaleRoomId,
            'B',
          );

        const maleApplicationId =
          await createApplication(
            maleStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const maleAssignmentId =
          await createExistingAssignment(
            maleApplicationId,
            maleBedId,
          );

        const femaleApplicationId =
          await createApplication(
            femaleStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        await createExistingAssignment(
          femaleApplicationId,
          femaleBedId,
        );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              `/api/assignments/${maleAssignmentId}/change`,
            )
            .send({
              bedId:
                targetBedId,
            });

        expect(
          response.status,
        ).toBe(409);

        const assignmentResult =
          await pool.query<{
            bed_id: string;
            status: string;
          }>(
            `
              SELECT
                bed_id,
                status
              FROM housing_assignments
              WHERE id = $1
            `,
            [
              maleAssignmentId,
            ],
          );

        expect(
          assignmentResult
            .rows[0],
        ).toEqual({
          bed_id:
            maleBedId,
          status:
            'RESERVED',
        });
      },
    );

    it(
      'serializes competing different-gender assignments into the same empty room',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const maleStudentId =
          await createStudent(
            2,
            'MALE',
          );

        const femaleStudentId =
          await createStudent(
            3,
            'FEMALE',
          );

        const buildingId =
          await createBuilding();

        const roomId =
          await createRoom(
            buildingId,
            '201',
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

        const maleApplicationId =
          await createApplication(
            maleStudentId,
            buildingId,
            'APPROVED',
          );

        const femaleApplicationId =
          await createApplication(
            femaleStudentId,
            buildingId,
            'APPROVED',
          );

        const [
          maleResponse,
          femaleResponse,
        ] =
          await Promise.all([
            apiRequest(
              officerId,
              'HOUSING_OFFICER',
            )
              .post(
                '/api/assignments',
              )
              .send({
                applicationId:
                  maleApplicationId,
                bedId:
                  firstBedId,
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
                  femaleApplicationId,
                bedId:
                  secondBedId,
              }),
          ]);

        const statuses = [
          maleResponse.status,
          femaleResponse.status,
        ].sort(
          (
            first,
            second,
          ) =>
            first - second,
        );

        expect(
          statuses,
        ).toEqual([
          201,
          409,
        ]);

        const activeResult =
          await pool.query<{
            count: number;
          }>(
            `
              SELECT
                COUNT(*)::INTEGER
                  AS count
              FROM housing_assignments
                assignment
              JOIN beds bed
                ON bed.id =
                  assignment.bed_id
              WHERE bed.room_id = $1
                AND assignment.status IN (
                  'RESERVED',
                  'CONFIRMED'
                )
            `,
            [
              roomId,
            ],
          );

        expect(
          activeResult
            .rows[0]?.count,
        ).toBe(1);
      },
    );
  },
);