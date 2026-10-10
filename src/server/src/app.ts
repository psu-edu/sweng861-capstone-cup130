import express, {
  type Request,
  type Response,
} from 'express';

import {checkDatabaseConnection,} from './db/pool.js';
import {authRouter,} from './auth/auth.routes.js';
import {handleAuthenticationError,} from './auth/auth.middleware.js';
import {studentProfileRouter,} from './modules/student-profile/student-profile.routes.js';
import {housingInventoryRouter,housingOptionsRouter,} from './modules/housing-inventory/housing-inventory.routes.js';
import {housingOfficerApplicationRouter,studentHousingApplicationRouter,} from './modules/housing-application/housing-application.routes.js';
import {studentRoommateMatchingRouter,} from './modules/roommate-matching/roommate-matching.routes.js';
import {housingAssignmentRouter,studentHousingAssignmentRouter,} from './modules/housing-assignment/housing-assignment.routes.js';

const app = express();

app.use(express.json());

app.get(
  '/health',
  async (
    _req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      await checkDatabaseConnection();

      res.status(200).json({
        status: 'ok',
        service: 'campus-rental-server',
        database: 'connected',
      });
    } catch {
      res.status(503).json({
        status: 'degraded',
        service: 'campus-rental-server',
        database: 'unavailable',
      });
    }
  },
);

app.use(
  '/api/auth',
  authRouter,
);

app.use(
  '/api/student/profile',
  studentProfileRouter,
);

app.use(
  '/api/inventory',
  housingInventoryRouter,
);

app.use(
  '/api/student/housing-options',
  housingOptionsRouter,
);

app.use(
  '/api/student/applications',
  studentHousingApplicationRouter,
);

app.use(
  '/api/applications',
  housingOfficerApplicationRouter,
);

app.use(
  '/api/student/roommates',
  studentRoommateMatchingRouter,
);

app.use(
  '/api/assignments',
  housingAssignmentRouter,
);

app.use(
  '/api/student/housing-assignments',
  studentHousingAssignmentRouter,
);

app.use(
  handleAuthenticationError,
);

export default app;