import type {
  Request,
  Response,
} from 'express';

import type {
  AuthenticatedRequest,
} from '../../auth/auth.types.js';

import {
  createStudentHousingApplication,
  editStudentHousingApplication,
  getStudentHousingApplications,
  HousingApplicationConflictError,
  HousingApplicationValidationError,
  submitStudentHousingApplication,
} from './housing-application.service.js';

interface ApplicationParams {
  [key: string]: string;
  applicationId: string;
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

function handleHousingApplicationError(
  error: unknown,
  res: Response,
): boolean {
  if (
    error
    instanceof HousingApplicationValidationError
  ) {
    res.status(400).json({
      error: 'validation_error',
      message: error.message,
    });

    return true;
  }

  if (
    error
    instanceof HousingApplicationConflictError
  ) {
    res.status(409).json({
      error: 'conflict',
      message: error.message,
    });

    return true;
  }

  return false;
}

export async function getCurrentStudentApplications(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(req);

  if (studentId === null) {
    res.status(401).json({
      error: 'unauthorized',
      message:
        'Authentication is required.',
    });

    return;
  }

  const applications =
    await getStudentHousingApplications(
      studentId,
    );

  res.status(200).json({
    applications,
  });
}

export async function createCurrentStudentApplication(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(req);

  if (studentId === null) {
    res.status(401).json({
      error: 'unauthorized',
      message:
        'Authentication is required.',
    });

    return;
  }

  try {
    const application =
      await createStudentHousingApplication(
        studentId,
        req.body as unknown,
      );

    res.status(201).json({
      application,
    });
  } catch (error: unknown) {
    if (
      handleHousingApplicationError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function updateCurrentStudentApplication(
  req: Request<ApplicationParams>,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(req);

  if (studentId === null) {
    res.status(401).json({
      error: 'unauthorized',
      message:
        'Authentication is required.',
    });

    return;
  }

  try {
    const application =
      await editStudentHousingApplication(
        studentId,
        req.params.applicationId,
        req.body as unknown,
      );

    if (application === null) {
      res.status(404).json({
        error: 'not_found',
        message:
          'Housing application was not found.',
      });

      return;
    }

    res.status(200).json({
      application,
    });
  } catch (error: unknown) {
    if (
      handleHousingApplicationError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function submitCurrentStudentApplication(
  req: Request<ApplicationParams>,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(req);

  if (studentId === null) {
    res.status(401).json({
      error: 'unauthorized',
      message:
        'Authentication is required.',
    });

    return;
  }

  try {
    const application =
      await submitStudentHousingApplication(
        studentId,
        req.params.applicationId,
      );

    if (application === null) {
      res.status(404).json({
        error: 'not_found',
        message:
          'Housing application was not found.',
      });

      return;
    }

    res.status(200).json({
      application,
    });
  } catch (error: unknown) {
    if (
      handleHousingApplicationError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}