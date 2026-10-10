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

import type {
  HousingApplicationStatus,
} from '../../src/modules/housing-application/housing-application.types.js';

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
              'officer-application-test@example.edu',
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
        `test|officer-application-${sequence}`,
        `officer-application-${sequence}@example.edu`,
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
        'Software Engineering',
        'SPRING',
        2027
      )
    `,
    [
      userId,
      `OFFAPP${sequence}`,
      `Student${sequence}`,
    ],
  );

  return userId;
}

async function createBuilding():
Promise<string> {
  const result =
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
    result.rows[0]?.id;

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

async function createApplication(
  studentId: string,
  buildingId: string,
  status: HousingApplicationStatus,
): Promise<string> {
  const result =
    await pool.query<{ id: string }>(
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
          $3::VARCHAR(30),
          CASE
            WHEN $3::VARCHAR(30) = 'DRAFT'
              THEN NULL
            ELSE NOW()
          END,
          CASE
            WHEN $3::VARCHAR(30) IN (
              'APPROVED',
              'HOUSING_ASSIGNED',
              'COMPLETED'
            )
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

  const applicationId =
    result.rows[0]?.id;

  if (applicationId === undefined) {
    throw new Error(
      'Housing application insert did not return an id.',
    );
  }

  return applicationId;
}

function officerRequest(
  officerId: string,
) {
  return {
    get:
      (path: string) =>
        request(app)
          .get(path)
          .set(
            'x-test-user-id',
            officerId,
          )
          .set(
            'x-test-role',
            'HOUSING_OFFICER',
          ),

    post:
      (path: string) =>
        request(app)
          .post(path)
          .set(
            'x-test-user-id',
            officerId,
          )
          .set(
            'x-test-role',
            'HOUSING_OFFICER',
          ),

    put:
      (path: string) =>
        request(app)
          .put(path)
          .set(
            'x-test-user-id',
            officerId,
          )
          .set(
            'x-test-role',
            'HOUSING_OFFICER',
          ),
  };
}

describe(
  'Housing Officer application API',
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
      'lists housing applications with Student context',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        await createApplication(
          studentId,
          buildingId,
          'SUBMITTED',
        );

        const response =
          await officerRequest(
            officerId,
          )
            .get(
              '/api/applications',
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.applications,
        ).toHaveLength(1);

        expect(
          response.body.applications[0],
        ).toMatchObject({
          studentId,
          studentNumber:
            'OFFAPP2',
          firstName:
            'Student2',
          lastName:
            'Student',
          academicStatus:
            'SENIOR',
          major:
            'Software Engineering',
          academicYear:
            '2026-2027',
          preferredBuildingName:
            'East Residence Hall',
          preferredRoomStyle:
            'DOUBLE',
          status:
            'SUBMITTED',
        });
      },
    );

    it(
      'returns Housing Officer notes through the administrative detail endpoint',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'SUBMITTED',
          );

        await pool.query(
          `
            UPDATE housing_applications
            SET officer_notes =
              'Internal review note'
            WHERE id = $1
          `,
          [
            applicationId,
          ],
        );

        const response =
          await officerRequest(
            officerId,
          )
            .get(
              `/api/applications/${applicationId}`,
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.application,
        ).toMatchObject({
          id: applicationId,
          officerNotes:
            'Internal review note',
        });
      },
    );

    it(
      'allows a Housing Officer to save and clear internal notes',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'SUBMITTED',
          );

        const saveResponse =
          await officerRequest(
            officerId,
          )
            .put(
              `/api/applications/${applicationId}/notes`,
            )
            .send({
              officerNotes:
                'Follow up with the student.',
            });

        expect(saveResponse.status)
          .toBe(200);

        expect(
          saveResponse.body
            .application.officerNotes,
        ).toBe(
          'Follow up with the student.',
        );

        const clearResponse =
          await officerRequest(
            officerId,
          )
            .put(
              `/api/applications/${applicationId}/notes`,
            )
            .send({
              officerNotes: null,
            });

        expect(clearResponse.status)
          .toBe(200);

        expect(
          clearResponse.body
            .application.officerNotes,
        ).toBeNull();
      },
    );

    it(
      'approves a submitted application and records the approving Housing Officer',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'SUBMITTED',
          );

        const response =
          await officerRequest(
            officerId,
          )
            .post(
              `/api/applications/${applicationId}/approve`,
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.application,
        ).toMatchObject({
          id: applicationId,
          status: 'APPROVED',
          approvedBy: officerId,
        });

        expect(
          response.body.application.approvedAt,
        ).not.toBeNull();

        const result =
          await pool.query<{
            status: string;
            approved_by: string | null;
            approved_at: Date | null;
          }>(
            `
              SELECT
                status,
                approved_by,
                approved_at
              FROM housing_applications
              WHERE id = $1
            `,
            [
              applicationId,
            ],
          );

        expect(
          result.rows[0],
        ).toMatchObject({
          status: 'APPROVED',
          approved_by: officerId,
        });

        expect(
          result.rows[0]?.approved_at,
        ).not.toBeNull();
      },
    );

    it(
      'rejects approval when the application is not submitted',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'DRAFT',
          );

        const response =
          await officerRequest(
            officerId,
          )
            .post(
              `/api/applications/${applicationId}/approve`,
            );

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'Only submitted housing applications can be approved.',
          });
      },
    );

    it(
      'does not approve an application twice',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'SUBMITTED',
          );

        await officerRequest(
          officerId,
        )
          .post(
            `/api/applications/${applicationId}/approve`,
          );

        const response =
          await officerRequest(
            officerId,
          )
            .post(
              `/api/applications/${applicationId}/approve`,
            );

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'Only submitted housing applications can be approved.',
          });
      },
    );

    it(
      'allows a Housing Officer to cancel an approved application and records the actor',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const studentId =
          await createStudent(2);

        const buildingId =
          await createBuilding();

        const applicationId =
          await createApplication(
            studentId,
            buildingId,
            'APPROVED',
          );

        const response =
          await officerRequest(
            officerId,
          )
            .post(
              `/api/applications/${applicationId}/cancel`,
            );

        expect(response.status)
          .toBe(200);

        expect(
          response.body.application,
        ).toMatchObject({
          id: applicationId,
          status: 'CANCELLED',
          cancelledBy: officerId,
        });

        expect(
          response.body.application.cancelledAt,
        ).not.toBeNull();
      },
    );

    it(
      'does not cancel housing-assigned or completed applications through the application endpoint',
      async () => {
        const officerId =
          await createUser(
            'HOUSING_OFFICER',
            1,
          );

        const firstStudentId =
          await createStudent(2);

        const secondStudentId =
          await createStudent(3);

        const buildingId =
          await createBuilding();

        const assignedApplicationId =
          await createApplication(
            firstStudentId,
            buildingId,
            'HOUSING_ASSIGNED',
          );

        const completedApplicationId =
          await createApplication(
            secondStudentId,
            buildingId,
            'COMPLETED',
          );

        const assignedResponse =
          await officerRequest(
            officerId,
          )
            .post(
              `/api/applications/${assignedApplicationId}/cancel`,
            );

        expect(
          assignedResponse.status,
        ).toBe(409);

        expect(
          assignedResponse.body.message,
        ).toBe(
          'Housing-assigned applications must be cancelled through the housing assignment workflow.',
        );

        const completedResponse =
          await officerRequest(
            officerId,
          )
            .post(
              `/api/applications/${completedApplicationId}/cancel`,
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
      'prevents a Student from using Housing Officer application endpoints',
      async () => {
        const studentId =
          await createStudent(1);

        const response =
          await request(app)
            .get(
              '/api/applications',
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