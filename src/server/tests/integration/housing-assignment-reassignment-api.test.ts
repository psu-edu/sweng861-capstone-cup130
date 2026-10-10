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
              'housing-reassignment-test@example.edu',
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
        `test|reassignment-${sequence}`,
        `reassignment-${sequence}@example.edu`,
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
        'Reassignment',
        'MALE',
        'SENIOR',
        'Software Engineering',
        'SPRING',
        2028
      )
    `,
    [
      userId,
      `HAR${sequence}`,
      `Student${sequence}`,
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
          'Reassignment Hall',
          '200 Campus Drive',
          'Housing reassignment test hall.'
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

async function createApprovedApplication(
  studentId: string,
  buildingId: string,
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
          approved_at
        )
        VALUES (
          $1,
          '2026-2027',
          $2,
          'DOUBLE',
          'APPROVED',
          NOW(),
          NOW()
        )
        RETURNING id
      `,
      [
        studentId,
        buildingId,
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

async function createDraftApplication(
  studentId: string,
  buildingId: string,
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
          status
        )
        VALUES (
          $1,
          '2027-2028',
          $2,
          'DOUBLE',
          'DRAFT'
        )
        RETURNING id
      `,
      [
        studentId,
        buildingId,
      ],
    );

  const id =
    result.rows[0]?.id;

  if (
    id === undefined
  ) {
    throw new Error(
      'Draft application insert did not return an id.',
    );
  }

  return id;
}

function apiRequest(
  userId: string,
  role: UserRole,
) {
  return {
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

async function reserveAssignment(
  officerId: string,
  applicationId: string,
  bedId: string,
): Promise<string> {
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

  const assignmentId =
    response.body
      .assignment
      .id as string;

  return assignmentId;
}

describe(
  'housing assignment reassignment API',
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
      'changes a reserved assignment atomically and preserves the previous reservation as history',
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

        const firstRoomId =
          await createRoom(
            buildingId,
            '201',
          );

        const secondRoomId =
          await createRoom(
            buildingId,
            '202',
          );

        const firstBedId =
          await createBed(
            firstRoomId,
            'A',
          );

        const secondBedId =
          await createBed(
            secondRoomId,
            'A',
          );

        const applicationId =
          await createApprovedApplication(
            firstStudentId,
            buildingId,
          );

        const firstAssignmentId =
          await reserveAssignment(
            officerId,
            applicationId,
            firstBedId,
          );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              `/api/assignments/${firstAssignmentId}/change`,
            )
            .send({
              bedId:
                secondBedId,
            });

        expect(
          response.status,
        ).toBe(200);

        expect(
          response.body.assignment,
        ).toMatchObject({
          applicationId,
          bedId:
            secondBedId,
          status:
            'RESERVED',
        });

        expect(
          response.body
            .assignment
            .id,
        ).not.toBe(
          firstAssignmentId,
        );

        const historyResult =
          await pool.query<{
            id: string;
            bed_id: string;
            status: string;
            cancelled_by:
              string | null;
          }>(
            `
              SELECT
                id,
                bed_id,
                status,
                cancelled_by
              FROM housing_assignments
              WHERE application_id = $1
              ORDER BY id
            `,
            [
              applicationId,
            ],
          );

        expect(
          historyResult.rows,
        ).toEqual([
          {
            id:
              firstAssignmentId,
            bed_id:
              firstBedId,
            status:
              'CANCELLED',
            cancelled_by:
              officerId,
          },
          {
            id:
              response.body
                .assignment
                .id,
            bed_id:
              secondBedId,
            status:
              'RESERVED',
            cancelled_by:
              null,
          },
        ]);

        const applicationResult =
          await pool.query<{
            status: string;
          }>(
            `
              SELECT status
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

        const secondApplicationId =
          await createApprovedApplication(
            secondStudentId,
            buildingId,
          );

        const releasedBedResponse =
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
                firstBedId,
            });

        expect(
          releasedBedResponse.status,
        ).toBe(201);
      },
    );

    it(
      'rolls back an assignment change when the selected bed is already occupied',
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
          await createApprovedApplication(
            firstStudentId,
            buildingId,
          );

        const secondApplicationId =
          await createApprovedApplication(
            secondStudentId,
            buildingId,
          );

        const firstAssignmentId =
          await reserveAssignment(
            officerId,
            firstApplicationId,
            firstBedId,
          );

        await reserveAssignment(
          officerId,
          secondApplicationId,
          secondBedId,
        );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              `/api/assignments/${firstAssignmentId}/change`,
            )
            .send({
              bedId:
                secondBedId,
            });

        expect(
          response.status,
        ).toBe(409);

        expect(
          response.body.message,
        ).toBe(
          'The selected bed is no longer available.',
        );

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
              firstAssignmentId,
            ],
          );

        expect(
          assignmentResult
            .rows[0],
        ).toEqual({
          bed_id:
            firstBedId,
          status:
            'RESERVED',
        });
      },
    );

    it(
      'cancels only the assignment, returns the application to approved, and allows later reassignment',
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

        const firstRoomId =
          await createRoom(
            buildingId,
            '201',
          );

        const secondRoomId =
          await createRoom(
            buildingId,
            '202',
          );

        const firstBedId =
          await createBed(
            firstRoomId,
            'A',
          );

        const secondBedId =
          await createBed(
            secondRoomId,
            'A',
          );

        const applicationId =
          await createApprovedApplication(
            studentId,
            buildingId,
          );

        const assignmentId =
          await reserveAssignment(
            officerId,
            applicationId,
            firstBedId,
          );

        const cancelResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          ).post(
            `/api/assignments/${assignmentId}/cancel-assignment`,
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

        const applicationResult =
          await pool.query<{
            status: string;
            housing_assigned_at:
              Date | null;
            cancelled_at:
              Date | null;
            cancelled_by:
              string | null;
          }>(
            `
              SELECT
                status,
                housing_assigned_at,
                cancelled_at,
                cancelled_by
              FROM housing_applications
              WHERE id = $1
            `,
            [
              applicationId,
            ],
          );

        expect(
          applicationResult
            .rows[0],
        ).toEqual({
          status:
            'APPROVED',
          housing_assigned_at:
            null,
          cancelled_at:
            null,
          cancelled_by:
            null,
        });

        const reassignmentResponse =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          )
            .post(
              '/api/assignments',
            )
            .send({
              applicationId,
              bedId:
                secondBedId,
            });

        expect(
          reassignmentResponse
            .status,
        ).toBe(201);

        const historyResult =
          await pool.query<{
            status: string;
          }>(
            `
              SELECT status
              FROM housing_assignments
              WHERE application_id = $1
              ORDER BY id
            `,
            [
              applicationId,
            ],
          );

        expect(
          historyResult
            .rows
            .map(
              (row) =>
                row.status,
            ),
        ).toEqual([
          'CANCELLED',
          'RESERVED',
        ]);
      },
    );

    it(
      'does not return an assigned application to approved when another unsecured application exists',
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
            '201',
          );

        const bedId =
          await createBed(
            roomId,
            'A',
          );

        const applicationId =
          await createApprovedApplication(
            studentId,
            buildingId,
          );

        const assignmentId =
          await reserveAssignment(
            officerId,
            applicationId,
            bedId,
          );

        await createDraftApplication(
          studentId,
          buildingId,
        );

        const response =
          await apiRequest(
            officerId,
            'HOUSING_OFFICER',
          ).post(
            `/api/assignments/${assignmentId}/cancel-assignment`,
          );

        expect(
          response.status,
        ).toBe(409);

        expect(
          response.body.message,
        ).toBe(
          'The housing application cannot return to approved status while another unsecured housing application is active for this student.',
        );

        const applicationResult =
          await pool.query<{
            status: string;
          }>(
            `
              SELECT status
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

        const assignmentResult =
          await pool.query<{
            status: string;
          }>(
            `
              SELECT status
              FROM housing_assignments
              WHERE id = $1
            `,
            [
              assignmentId,
            ],
          );

        expect(
          assignmentResult
            .rows[0]?.status,
        ).toBe(
          'RESERVED',
        );
      },
    );

    it(
      'voids a generated lease when changing a reserved assignment',
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

        const firstRoomId =
          await createRoom(
            buildingId,
            '201',
          );

        const secondRoomId =
          await createRoom(
            buildingId,
            '202',
          );

        const firstBedId =
          await createBed(
            firstRoomId,
            'A',
          );

        const secondBedId =
          await createBed(
            secondRoomId,
            'A',
          );

        const applicationId =
          await createApprovedApplication(
            studentId,
            buildingId,
          );

        const assignmentId =
          await reserveAssignment(
            officerId,
            applicationId,
            firstBedId,
          );

        await pool.query(
          `
            INSERT INTO leases (
              assignment_id,
              status,
              generated_at
            )
            VALUES (
              $1,
              'GENERATED',
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
          )
            .post(
              `/api/assignments/${assignmentId}/change`,
            )
            .send({
              bedId:
                secondBedId,
            });

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
      'does not change a reserved assignment after its lease was sent for signature',
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

        const firstRoomId =
          await createRoom(
            buildingId,
            '201',
          );

        const secondRoomId =
          await createRoom(
            buildingId,
            '202',
          );

        const firstBedId =
          await createBed(
            firstRoomId,
            'A',
          );

        const secondBedId =
          await createBed(
            secondRoomId,
            'A',
          );

        const applicationId =
          await createApprovedApplication(
            studentId,
            buildingId,
          );

        const assignmentId =
          await reserveAssignment(
            officerId,
            applicationId,
            firstBedId,
          );

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
          )
            .post(
              `/api/assignments/${assignmentId}/change`,
            )
            .send({
              bedId:
                secondBedId,
            });

        expect(
          response.status,
        ).toBe(409);

        expect(
          response.body.message,
        ).toBe(
          'The lease has already been sent for signature and must be voided through the lease workflow before changing this assignment.',
        );

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
              assignmentId,
            ],
          );

        expect(
          assignmentResult
            .rows[0],
        ).toEqual({
          bed_id:
            firstBedId,
          status:
            'RESERVED',
        });
      },
    );
  },
);