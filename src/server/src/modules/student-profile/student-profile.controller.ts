import type {
  Request,
  Response,
} from 'express';

import type {
  AuthenticatedRequest,
} from '../../auth/auth.types.js';

import {
  getStudentProfile,
  StudentProfileConflictError,
  StudentProfileValidationError,
  updateStudentProfile,
} from './student-profile.service.js';

function getAuthenticatedUserId(
  req: Request,
): string | null {
  const authenticatedRequest =
    req as AuthenticatedRequest;

  return (
    authenticatedRequest.currentUser?.id
    ?? null
  );
}

export async function getCurrentStudentProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const userId =
    getAuthenticatedUserId(req);

  if (userId === null) {
    res.status(401).json({
      error: 'unauthorized',
      message:
        'Authentication is required.',
    });

    return;
  }

  const profile =
    await getStudentProfile(userId);

  if (profile === null) {
    res.status(404).json({
      error: 'not_found',
      message:
        'Student profile was not found.',
    });

    return;
  }

  res.status(200).json({
    profile,
  });
}

export async function updateCurrentStudentProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const userId =
    getAuthenticatedUserId(req);

  if (userId === null) {
    res.status(401).json({
      error: 'unauthorized',
      message:
        'Authentication is required.',
    });

    return;
  }

  try {
    const profile =
      await updateStudentProfile(
        userId,
        req.body as unknown,
      );

    if (profile === null) {
      res.status(404).json({
        error: 'not_found',
        message:
          'Student profile was not found.',
      });

      return;
    }

    res.status(200).json({
      profile,
    });
  } catch (error: unknown) {
    if (
      error
      instanceof StudentProfileValidationError
    ) {
      res.status(400).json({
        error: 'validation_error',
        message: error.message,
      });

      return;
    }

    if (
      error
      instanceof StudentProfileConflictError
    ) {
      res.status(409).json({
        error: 'conflict',
        message: error.message,
      });

      return;
    }

    throw error;
  }
}