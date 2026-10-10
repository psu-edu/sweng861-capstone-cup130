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
        const role =
          req.header(
            'x-test-role',
          );

        if (
          role === 'STUDENT'
          || role
            === 'HOUSING_OFFICER'
        ) {
          const authenticatedRequest =
            req as AuthenticatedRequest;

          authenticatedRequest.currentUser = {
            id: '1',
            authSubject:
              'test|inventory-user',
            email:
              'inventory-test@example.edu',
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

function officerRequest() {
  return {
    get:
      (path: string) =>
        request(app)
          .get(path)
          .set(
            'x-test-role',
            'HOUSING_OFFICER',
          ),

    post:
      (path: string) =>
        request(app)
          .post(path)
          .set(
            'x-test-role',
            'HOUSING_OFFICER',
          ),

    put:
      (path: string) =>
        request(app)
          .put(path)
          .set(
            'x-test-role',
            'HOUSING_OFFICER',
          ),
  };
}

describe(
  'housing inventory API',
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
          student_profiles,
          users
        RESTART IDENTITY CASCADE
      `);
    });

    afterAll(async () => {
      await closeDatabasePool();
    });

    it(
      'allows a Housing Officer to create a building, room, and bed',
      async () => {
        const buildingResponse =
          await officerRequest()
            .post(
              '/api/inventory/buildings',
            )
            .send({
              name:
                'North Residence Hall',
              address:
                '300 University Avenue',
              description:
                'North campus residence hall.',
            });

        expect(
          buildingResponse.status,
        ).toBe(201);

        expect(
          buildingResponse.body.building,
        ).toMatchObject({
          name:
            'North Residence Hall',
          address:
            '300 University Avenue',
          description:
            'North campus residence hall.',
          active: true,
          rooms: [],
        });

        const buildingId =
          buildingResponse.body
            .building.id as string;

        const roomResponse =
          await officerRequest()
            .post(
              `/api/inventory/buildings/${buildingId}/rooms`,
            )
            .send({
              roomNumber: '201',
              floor: 2,
              roomStyle: 'DOUBLE',
            });

        expect(
          roomResponse.status,
        ).toBe(201);

        expect(
          roomResponse.body.room,
        ).toMatchObject({
          buildingId,
          roomNumber: '201',
          floor: 2,
          roomStyle: 'DOUBLE',
          active: true,
          beds: [],
        });

        const roomId =
          roomResponse.body
            .room.id as string;

        const bedResponse =
          await officerRequest()
            .post(
              `/api/inventory/rooms/${roomId}/beds`,
            )
            .send({
              bedLabel: 'A',
            });

        expect(
          bedResponse.status,
        ).toBe(201);

        expect(
          bedResponse.body.bed,
        ).toMatchObject({
          bedLabel: 'A',
          active: true,
          available: true,
        });

        const hierarchyResponse =
          await officerRequest()
            .get(
              '/api/inventory',
            );

        expect(
          hierarchyResponse.status,
        ).toBe(200);

        expect(
          hierarchyResponse.body
            .buildings[0]
            .rooms[0]
            .beds[0],
        ).toMatchObject({
          bedLabel: 'A',
          active: true,
          available: true,
        });
      },
    );

    it(
      'rejects a duplicate building name with a friendly conflict response',
      async () => {
        await officerRequest()
          .post(
            '/api/inventory/buildings',
          )
          .send({
            name:
              'North Residence Hall',
            address:
              '300 University Avenue',
            description: null,
          });

        const response =
          await officerRequest()
            .post(
              '/api/inventory/buildings',
            )
            .send({
              name:
                'North Residence Hall',
              address:
                '400 University Avenue',
              description: null,
            });

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'A building with that name already exists.',
          });
      },
    );

    it(
      'rejects an invalid room style',
      async () => {
        const buildingResponse =
          await officerRequest()
            .post(
              '/api/inventory/buildings',
            )
            .send({
              name:
                'North Residence Hall',
              address:
                '300 University Avenue',
              description: null,
            });

        const buildingId =
          buildingResponse.body
            .building.id as string;

        const response =
          await officerRequest()
            .post(
              `/api/inventory/buildings/${buildingId}/rooms`,
            )
            .send({
              roomNumber: '201',
              floor: 2,
              roomStyle: 'SUITE',
            });

        expect(response.status)
          .toBe(400);

        expect(response.body)
          .toEqual({
            error:
              'validation_error',
            message:
              'Room style must be SINGLE, DOUBLE, TRIPLE, or QUAD.',
          });
      },
    );

    it(
      'returns a friendly error when creating a room for a missing building',
      async () => {
        const response =
          await officerRequest()
            .post(
              '/api/inventory/buildings/999999/rooms',
            )
            .send({
              roomNumber: '201',
              floor: 2,
              roomStyle: 'DOUBLE',
            });

        expect(response.status)
          .toBe(400);

        expect(response.body)
          .toEqual({
            error:
              'validation_error',
            message:
              'The selected building does not exist.',
          });
      },
    );

    it(
      'rejects duplicate bed labels within the same room',
      async () => {
        const buildingResponse =
          await officerRequest()
            .post(
              '/api/inventory/buildings',
            )
            .send({
              name:
                'North Residence Hall',
              address:
                '300 University Avenue',
              description: null,
            });

        const buildingId =
          buildingResponse.body
            .building.id as string;

        const roomResponse =
          await officerRequest()
            .post(
              `/api/inventory/buildings/${buildingId}/rooms`,
            )
            .send({
              roomNumber: '201',
              floor: 2,
              roomStyle: 'DOUBLE',
            });

        const roomId =
          roomResponse.body
            .room.id as string;

        await officerRequest()
          .post(
            `/api/inventory/rooms/${roomId}/beds`,
          )
          .send({
            bedLabel: 'A',
          });

        const response =
          await officerRequest()
            .post(
              `/api/inventory/rooms/${roomId}/beds`,
            )
            .send({
              bedLabel: 'A',
            });

        expect(response.status)
          .toBe(409);

        expect(response.body)
          .toEqual({
            error: 'conflict',
            message:
              'That bed label already exists in this room.',
          });
      },
    );

    it(
      'allows inventory to be deactivated without deleting it',
      async () => {
        const buildingResponse =
          await officerRequest()
            .post(
              '/api/inventory/buildings',
            )
            .send({
              name:
                'North Residence Hall',
              address:
                '300 University Avenue',
              description: null,
            });

        const buildingId =
          buildingResponse.body
            .building.id as string;

        const response =
          await officerRequest()
            .put(
              `/api/inventory/buildings/${buildingId}`,
            )
            .send({
              name:
                'North Residence Hall',
              address:
                '300 University Avenue',
              description: null,
              active: false,
            });

        expect(response.status)
          .toBe(200);

        expect(
          response.body.building,
        ).toMatchObject({
          id: buildingId,
          active: false,
        });

        const databaseResult =
          await pool.query<{
            active: boolean;
          }>(
            `
              SELECT active
              FROM buildings
              WHERE id = $1
            `,
            [
              buildingId,
            ],
          );

        expect(
          databaseResult.rows[0]
            ?.active,
        ).toBe(false);
      },
    );

    it(
      'does not report an active bed as available when its room is inactive',
      async () => {
        const buildingResponse =
          await officerRequest()
            .post(
              '/api/inventory/buildings',
            )
            .send({
              name:
                'North Residence Hall',
              address:
                '300 University Avenue',
              description: null,
            });
    
        const buildingId =
          buildingResponse.body
            .building.id as string;
    
        const roomResponse =
          await officerRequest()
            .post(
              `/api/inventory/buildings/${buildingId}/rooms`,
            )
            .send({
              roomNumber: '201',
              floor: 2,
              roomStyle: 'DOUBLE',
            });
    
        const roomId =
          roomResponse.body
            .room.id as string;
    
        const deactivateResponse =
          await officerRequest()
            .put(
              `/api/inventory/rooms/${roomId}`,
            )
            .send({
              roomNumber: '201',
              floor: 2,
              roomStyle: 'DOUBLE',
              active: false,
            });
    
        expect(
          deactivateResponse.status,
        ).toBe(200);
    
        const bedResponse =
          await officerRequest()
            .post(
              `/api/inventory/rooms/${roomId}/beds`,
            )
            .send({
              bedLabel: 'A',
            });
    
        expect(
          bedResponse.status,
        ).toBe(201);
    
        expect(
          bedResponse.body.bed,
        ).toMatchObject({
          bedLabel: 'A',
          active: true,
          available: false,
        });
      },
    );

    it(
      'prevents a Student from using Housing Officer inventory endpoints',
      async () => {
        const response =
          await request(app)
            .post(
              '/api/inventory/buildings',
            )
            .set(
              'x-test-role',
              'STUDENT',
            )
            .send({
              name:
                'Unauthorized Hall',
              address:
                '500 University Avenue',
              description: null,
            });

        expect(response.status)
          .toBe(403);

        expect(response.body)
          .toEqual({
            error: 'forbidden',
            message:
              'You do not have permission to access this resource.',
          });

        const result =
          await pool.query<{
            count: number;
          }>(
            `
              SELECT COUNT(*)::INTEGER
                AS count
              FROM buildings
            `,
          );

        expect(
          result.rows[0]?.count,
        ).toBe(0);
      },
    );
  },
);