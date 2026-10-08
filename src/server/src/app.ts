import express, {
  type Request,
  type Response,
} from 'express';

import {checkDatabaseConnection,} from './db/pool.js';

import {authRouter,} from './auth/auth.routes.js';

import {handleAuthenticationError,} from './auth/auth.middleware.js';

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
  handleAuthenticationError,
);

export default app;