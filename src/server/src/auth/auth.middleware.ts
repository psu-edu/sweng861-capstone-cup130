import {
  auth,
  InvalidTokenError,
  UnauthorizedError,
} from 'express-oauth2-jwt-bearer';

import type {
  ErrorRequestHandler,
  RequestHandler,
} from 'express';

import {
  environment,
} from '../config/environment.js';

import {
  getAuthenticatedUser,
} from './auth.service.js';

import type {
  AuthenticatedRequest,
  UserRole,
} from './auth.types.js';

export const validateAccessToken = auth({
  issuerBaseURL:
    `https://${environment.auth0.domain}`,

  audience:
    environment.auth0.audience,
});

export const resolveLocalUser:
  RequestHandler =
  async (
    req,
    res,
    next,
  ): Promise<void> => {
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

    try {
      const user =
        await getAuthenticatedUser(
          authSubject,
        );

      if (user === null) {
        res.status(403).json({
          error: 'forbidden',
          message:
            'The authenticated identity is not registered for Campus Rental.',
        });

        return;
      }

      const authenticatedRequest =
        req as AuthenticatedRequest;

      authenticatedRequest.currentUser =
        user;

      next();
    } catch (error) {
      next(error);
    }
  };

export function requireRole(
  ...allowedRoles: UserRole[]
): RequestHandler {
  return (
    req,
    res,
    next,
  ): void => {
    const authenticatedRequest =
      req as AuthenticatedRequest;

    const user =
      authenticatedRequest.currentUser;

    if (user === undefined) {
      res.status(401).json({
        error: 'unauthorized',
        message:
          'Authentication is required.',
      });

      return;
    }

    if (
      !allowedRoles.includes(
        user.role,
      )
    ) {
      res.status(403).json({
        error: 'forbidden',
        message:
          'You do not have permission to access this resource.',
      });

      return;
    }

    next();
  };
}

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