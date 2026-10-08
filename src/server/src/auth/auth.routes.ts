import {
  Router,
  type Request,
  type Response,
} from 'express';

import {
  validateAccessToken,
} from './auth.middleware.js';

export const authRouter = Router();

authRouter.get(
  '/me',
  validateAccessToken,
  (
    req: Request,
    res: Response,
  ): void => {
    const authSubject =
      req.auth?.payload.sub;

    if (
      typeof authSubject !== 'string'
      || authSubject.trim() === ''
    ) {
      res.status(401).json({
        error: 'invalid_token',
        message:
          'The authenticated identity does not contain a subject.',
      });

      return;
    }

    res.status(200).json({
      authenticated: true,
      authSubject,
    });
  },
);