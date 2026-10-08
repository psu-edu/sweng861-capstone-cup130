import {
  auth,
  InvalidTokenError,
  UnauthorizedError,
} from 'express-oauth2-jwt-bearer';

import type {
  ErrorRequestHandler,
} from 'express';

import {
  environment,
} from '../config/environment.js';

export const validateAccessToken = auth({
  issuerBaseURL:
    `https://${environment.auth0.domain}`,

  audience:
    environment.auth0.audience,
});

export const handleAuthenticationError:
  ErrorRequestHandler =
  (
    error,
    _req,
    res,
    next,
  ): void => {
    if (error instanceof InvalidTokenError) {
      res.status(401).json({
        error: 'invalid_token',
        message:
          'The provided access token is invalid or expired.',
      });

      return;
    }

    if (error instanceof UnauthorizedError) {
      res
        .status(401)
        .set(error.headers)
        .json({
          error: 'unauthorized',
          message:
            'Authentication is required.',
        });

      return;
    }

    next(error);
  };