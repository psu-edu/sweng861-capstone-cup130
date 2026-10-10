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
              'application-test@example.edu',
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
        `test|application-${sequence}`,
        `application-${sequence}@example.edu`,
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
        major
      )
      VALUES (
        $1,
        $2,
        $3,
        'Student',
        'UNSPECIFIED',
        'SENIOR',
        'Software Engineering'
      )
    `,
    [
      userId,
      `APP${sequence}`,
      `Student${sequence}`,
    ],
  );

  return userId;
}

async function createBuildingWithRoomStyle():
Promise<string> {
  const buildingResult =
    await pool.query<{ id: string }>(
      `
        INSERT INTO buildings (
          name,
          address,
          description
        )
        VALUES (
          'East Residence Hall',
          '100 University Avenue',
          'Test residence hall'
        )
        RETURNING id
      `,
    );

  const buildingId =
    buildingResult.rows[0]?.id;

  if (buildingId === undefined) {
    throw new Error(
      'Building insert did not return an id.',
    );
  }

  await pool.query(
    `
      INSERT INTO rooms (
        building_id,
        room_number,
        floor,
        room_style
      )
      VALUES (
        $1,
        '201',
        2,
        'DOUBLE'
      )
    `,
    [
      buildingId,
    ],
  );

  return buildingId;
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

describe(
  'student housing application API',
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
      'creates a draft housing application for the authenticated student',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const response =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        expect(response.status)
          .toBe(201);

        expect(
          response.body.application,
        ).toMatchObject({
          academicYear:
            '2026-2027',
          preferredBuildingId:
            buildingId,
          preferredBuildingName:
            'East Residence Hall',
          preferredRoomStyle:
            'DOUBLE',
          status:
            'DRAFT',
        });

        expect(
          response.body.application,
        ).not.toHaveProperty(
          'officerNotes',
        );
      },
    );

    it(
      'rejects a second unsecured application',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const body = {
          academicYear:
            '2026-2027',
          preferredBuildingId:
            buildingId,
          preferredRoomStyle:
            'DOUBLE',
        };

        await studentRequest(
          studentId,
        )
          .post(
            '/api/student/applications',
          )
          .send(body);

        const response =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send(body);

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'You already have an active housing application.',
          });
      },
    );

    it(
      'rejects an invalid academic year',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const response =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2028',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        expect(response.status)
          .toBe(400);

        expect(response.body.error)
          .toBe(
            'validation_error',
          );
      },
    );

    it(
      'rejects a room style that is not active in the selected residence hall',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const response =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'SINGLE',
            });

        expect(response.status)
          .toBe(400);

        expect(response.body)
          .toEqual({
            error:
              'validation_error',
            message:
              'The selected residence hall and room style are not currently available as a housing option.',
          });
      },
    );

    it(
      'allows a student to edit their draft application',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const createResponse =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        const applicationId =
          createResponse.body
            .application.id as string;

        const response =
          await studentRequest(
            studentId,
          )
            .put(
              `/api/student/applications/${applicationId}`,
            )
            .send({
              academicYear:
                '2027-2028',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        expect(response.status)
          .toBe(200);

        expect(
          response.body.application,
        ).toMatchObject({
          id: applicationId,
          academicYear:
            '2027-2028',
          status: 'DRAFT',
        });
      },
    );

    it(
      'submits a draft application',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const createResponse =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        const applicationId =
          createResponse.body
            .application.id as string;

        const response =
          await studentRequest(
            studentId,
          )
            .post(
              `/api/student/applications/${applicationId}/submit`,
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.application,
        ).toMatchObject({
          id: applicationId,
          status:
            'SUBMITTED',
        });

        expect(
          response.body.application.submittedAt,
        ).not.toBeNull();
      },
    );

    it(
      'does not allow a submitted application to be edited',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const createResponse =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        const applicationId =
          createResponse.body
            .application.id as string;

        await studentRequest(
          studentId,
        )
          .post(
            `/api/student/applications/${applicationId}/submit`,
          );

        const response =
          await studentRequest(
            studentId,
          )
            .put(
              `/api/student/applications/${applicationId}`,
            )
            .send({
              academicYear:
                '2027-2028',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'Only draft housing applications can be edited.',
          });
      },
    );

    it(
      'does not allow a student to update another student application',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        const buildingId =
          await createBuildingWithRoomStyle();

        const createResponse =
          await studentRequest(
            firstStudentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        const applicationId =
          createResponse.body
            .application.id as string;

        const response =
          await studentRequest(
            secondStudentId,
          )
            .put(
              `/api/student/applications/${applicationId}`,
            )
            .send({
              academicYear:
                '2027-2028',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        expect(response.status)
          .toBe(404);
      },
    );

    it(
      'never returns Housing Officer notes to the Student',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const createResponse =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        const applicationId =
          createResponse.body
            .application.id as string;

        await pool.query(
          `
            UPDATE housing_applications
            SET officer_notes =
              'Private Housing Office note'
            WHERE id = $1
          `,
          [
            applicationId,
          ],
        );

        const response =
          await studentRequest(
            studentId,
          )
            .get(
              '/api/student/applications',
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.applications,
        ).toHaveLength(1);

        expect(
          response.body.applications[0],
        ).not.toHaveProperty(
          'officerNotes',
        );

        expect(
          JSON.stringify(response.body),
        ).not.toContain(
          'Private Housing Office note',
        );
      },
    );

    it(
      'allows a student to cancel their own submitted application',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const createResponse =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        const applicationId =
          createResponse.body
            .application.id as string;

        await studentRequest(
          studentId,
        )
          .post(
            `/api/student/applications/${applicationId}/submit`,
          );

        const response =
          await studentRequest(
            studentId,
          )
            .post(
              `/api/student/applications/${applicationId}/cancel`,
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.application,
        ).toMatchObject({
          id: applicationId,
          status: 'CANCELLED',
        });

        expect(
          response.body.application.cancelledAt,
        ).not.toBeNull();

        const result =
          await pool.query<{
            cancelled_by: string | null;
          }>(
            `
              SELECT cancelled_by
              FROM housing_applications
              WHERE id = $1
            `,
            [
              applicationId,
            ],
          );

        expect(
          result.rows[0]?.cancelled_by,
        ).toBe(studentId);
      },
    );

    it(
      'does not allow a student to cancel another student application',
      async () => {
        const firstStudentId =
          await createStudent(1);

        const secondStudentId =
          await createStudent(2);

        const buildingId =
          await createBuildingWithRoomStyle();

        const createResponse =
          await studentRequest(
            firstStudentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        const applicationId =
          createResponse.body
            .application.id as string;

        const response =
          await studentRequest(
            secondStudentId,
          )
            .post(
              `/api/student/applications/${applicationId}/cancel`,
            );

        expect(response.status)
          .toBe(404);
      },
    );

    it(
      'does not cancel housing-assigned or completed applications through the Student endpoint',
      async () => {
        const studentId =
          await createStudent(1);

        const buildingId =
          await createBuildingWithRoomStyle();

        const createResponse =
          await studentRequest(
            studentId,
          )
            .post(
              '/api/student/applications',
            )
            .send({
              academicYear:
                '2026-2027',
              preferredBuildingId:
                buildingId,
              preferredRoomStyle:
                'DOUBLE',
            });

        const applicationId =
          createResponse.body
            .application.id as string;

        await pool.query(
          `
            UPDATE housing_applications
            SET status = 'HOUSING_ASSIGNED'
            WHERE id = $1
          `,
          [
            applicationId,
          ],
        );

        const assignedResponse =
          await studentRequest(
            studentId,
          )
            .post(
              `/api/student/applications/${applicationId}/cancel`,
            );

        expect(
          assignedResponse.status,
        ).toBe(409);

        expect(
          assignedResponse.body.message,
        ).toBe(
          'Housing-assigned applications must be cancelled through the housing assignment workflow.',
        );

        await pool.query(
          `
            UPDATE housing_applications
            SET status = 'COMPLETED'
            WHERE id = $1
          `,
          [
            applicationId,
          ],
        );

        const completedResponse =
          await studentRequest(
            studentId,
          )
            .post(
              `/api/student/applications/${applicationId}/cancel`,
            );

        expect(
          completedResponse.status,
        ).toBe(409);

        expect(
          completedResponse.body.message,
        ).toBe(
          'Completed housing applications cannot be cancelled.',
        );
      },
    );

    it(
      'prevents a Housing Officer from using Student application endpoints',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const response =
          await request(app)
            .get(
              '/api/student/applications',
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