import type {
  Request,
  Response,
} from 'express';

import type {
  AuthenticatedRequest,
} from '../../auth/auth.types.js';

import {
  cancelHousingAssignment,
  createHousingAssignment,
  createRoommatePairAssignments,
  getHousingAssignmentOptions,
  getHousingAssignmentOverview,
  getStudentHousing,
  HousingAssignmentConflictError,
  HousingAssignmentNotFoundError,
  HousingAssignmentValidationError,
} from './housing-assignment.service.js';

interface ApplicationParams {
  [key: string]: string;
  applicationId: string;
}

interface AssignmentParams {
  [key: string]: string;
  assignmentId: string;
}

function getAuthenticatedUserId(
  req: Request,
): string | null {
  const authenticatedRequest =
    req as AuthenticatedRequest;

  return (
    authenticatedRequest
      .currentUser?.id
    ?? null
  );
}

function handleHousingAssignmentError(
  error: unknown,
  res: Response,
): boolean {
  if (
    error
    instanceof HousingAssignmentValidationError
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
    instanceof HousingAssignmentNotFoundError
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
    instanceof HousingAssignmentConflictError
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

export async function getOfficerAssignmentOverview(
  _req: Request,
  res: Response,
): Promise<void> {
  const overview =
    await getHousingAssignmentOverview();

  res.status(200).json(
    overview,
  );
}

export async function getOfficerAssignmentOptions(
  req: Request<ApplicationParams>,
  res: Response,
): Promise<void> {
  try {
    const options =
      await getHousingAssignmentOptions(
        req.params.applicationId,
      );

    res.status(200).json({
      options,
    });
  } catch (error: unknown) {
    if (
      handleHousingAssignmentError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function createOfficerAssignment(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const assignment =
      await createHousingAssignment(
        req.body as unknown,
      );

    res.status(201).json({
      assignment,
    });
  } catch (error: unknown) {
    if (
      handleHousingAssignmentError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function createOfficerRoommatePairAssignments(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const assignments =
      await createRoommatePairAssignments(
        req.body as unknown,
      );

    res.status(201).json({
      assignments,
    });
  } catch (error: unknown) {
    if (
      handleHousingAssignmentError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function cancelOfficerAssignment(
  req: Request<AssignmentParams>,
  res: Response,
): Promise<void> {
  const officerId =
    getAuthenticatedUserId(
      req,
    );

  if (officerId === null) {
    res.status(401).json({
      error:
        'unauthorized',
      message:
        'Authentication is required.',
    });

    return;
  }

  try {
    const assignment =
      await cancelHousingAssignment(
        req.params.assignmentId,
        officerId,
      );

    res.status(200).json({
      assignment,
    });
  } catch (error: unknown) {
    if (
      handleHousingAssignmentError(
        error,
        res,
      )
    ) {
      return;
    }

    throw error;
  }
}

export async function getCurrentStudentHousing(
  req: Request,
  res: Response,
): Promise<void> {
  const studentId =
    getAuthenticatedUserId(
      req,
    );

  if (studentId === null) {
    res.status(401).json({
      error:
        'unauthorized',
      message:
        'Authentication is required.',
    });

    return;
  }

  const assignments =
    await getStudentHousing(
      studentId,
    );

  res.status(200).json({
    assignments,
  });
}