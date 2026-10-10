import type {
  Request,
  Response,
} from 'express';

import type {
  AuthenticatedRequest,
} from '../../auth/auth.types.js';

import {
  acceptRoommateRequest,
  cancelRoommateRequest,
  createRoommateRequest,
  declineRoommateRequest,
  findRoommateStudents,
  getRoommateProfile,
  getRoommateRecommendations,
  getRoommateRequests,
  RoommateConflictError,
  RoommateNotFoundError,
  RoommateValidationError,
  saveRoommateProfile,
} from './roommate-matching.service.js';

interface RoommateRequestParams {
  [key: string]: string;
  requestId: string;
}

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

function handleRoommateError(
  error: unknown,
  res: Response,
): boolean {
  if (
    error
    instanceof RoommateValidationError
  ) {
    res.status(400).json({
      error:
        'validation_error',

      message:
        error.message,
    });

    return true;
  }

  if (
    error
    instanceof RoommateNotFoundError
  ) {
    res.status(404).json({
      error:
        'not_found',

      message:
        error.message,
    });

    return true;
  }

  if (
    error
    instanceof RoommateConflictError
  ) {
    res.status(409).json({
      error:
        'conflict',

      message:
        error.message,
    });

    return true;
  }

  return false;
}

function sendAuthenticationRequired(
  res: Response,
): void {
  res.status(401).json({
    error:
      'unauthorized',

    message:
      'Authentication is required.',
  });
}

export async function getCurrentRoommateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    sendAuthenticationRequired(
      res,
    );

    return;
  }

  const profile =
    await getRoommateProfile(
      studentId,
    );

  res.status(200).json({
    profile,
  });
}

export async function updateCurrentRoommateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    sendAuthenticationRequired(
      res,
    );

    return;
  }

  try {
    const profile =
      await saveRoommateProfile(
        studentId,
        req.body as unknown,
      );

    res.status(200).json({
      profile,
    });
  } catch (error: unknown) {
    if (
      handleRoommateError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function searchCurrentStudentRoommates(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    sendAuthenticationRequired(
      res,
    );

    return;
  }

  try {
    const students =
      await findRoommateStudents(
        studentId,
        req.query.q,
      );

    res.status(200).json({
      students,
    });
  } catch (error: unknown) {
    if (
      handleRoommateError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function getCurrentStudentRoommateRequests(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    sendAuthenticationRequired(
      res,
    );

    return;
  }

  const requests =
    await getRoommateRequests(
      studentId,
    );

  res.status(200).json({
    requests,
  });
}

export async function createCurrentStudentRoommateRequest(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    sendAuthenticationRequired(
      res,
    );

    return;
  }

  try {
    const roommateRequest =
      await createRoommateRequest(
        studentId,
        req.body as unknown,
      );

    res.status(201).json({
      request:
        roommateRequest,
    });
  } catch (error: unknown) {
    if (
      handleRoommateError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function acceptCurrentStudentRoommateRequest(
  req: Request<RoommateRequestParams>,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    sendAuthenticationRequired(
      res,
    );

    return;
  }

  try {
    const roommateRequest =
      await acceptRoommateRequest(
        studentId,
        req.params.requestId,
      );

    if (
      roommateRequest
      === null
    ) {
      res.status(404).json({
        error:
          'not_found',

        message:
          'Roommate request was not found.',
      });

      return;
    }

    res.status(200).json({
      request:
        roommateRequest,
    });
  } catch (error: unknown) {
    if (
      handleRoommateError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function declineCurrentStudentRoommateRequest(
  req: Request<RoommateRequestParams>,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    sendAuthenticationRequired(
      res,
    );

    return;
  }

  try {
    const roommateRequest =
      await declineRoommateRequest(
        studentId,
        req.params.requestId,
      );

    if (
      roommateRequest
      === null
    ) {
      res.status(404).json({
        error:
          'not_found',

        message:
          'Roommate request was not found.',
      });

      return;
    }

    res.status(200).json({
      request:
        roommateRequest,
    });
  } catch (error: unknown) {
    if (
      handleRoommateError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function cancelCurrentStudentRoommateRequest(
  req: Request<RoommateRequestParams>,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    sendAuthenticationRequired(
      res,
    );

    return;
  }

  try {
    const roommateRequest =
      await cancelRoommateRequest(
        studentId,
        req.params.requestId,
      );

    if (
      roommateRequest
      === null
    ) {
      res.status(404).json({
        error:
          'not_found',

        message:
          'Roommate request was not found.',
      });

      return;
    }

    res.status(200).json({
      request:
        roommateRequest,
    });
  } catch (error: unknown) {
    if (
      handleRoommateError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function getCurrentStudentRoommateRecommendations(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    sendAuthenticationRequired(
      res,
    );

    return;
  }

  try {
    const result =
      await getRoommateRecommendations(
        studentId,
        req.query.academicYear,
      );

    res.status(200).json(
      result,
    );
  } catch (error: unknown) {
    if (
      handleRoommateError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}