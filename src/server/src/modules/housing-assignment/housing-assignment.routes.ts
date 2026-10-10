import {
  Router,
} from 'express';

import {
  requireRole,
  resolveLocalUser,
  validateAccessToken,
} from '../../auth/auth.middleware.js';

import {
  cancelOfficerAssignment,
  cancelOfficerAssignmentOnly,
  changeOfficerAssignment,
  createOfficerAssignment,
  createOfficerRoommatePairAssignments,
  getCurrentStudentHousing,
  getOfficerAssignmentOptions,
  getOfficerAssignmentOverview,
} from './housing-assignment.controller.js';

export const housingAssignmentRouter =
  Router();

housingAssignmentRouter.use(
  validateAccessToken,
  resolveLocalUser,
  requireRole('HOUSING_OFFICER'),
);

housingAssignmentRouter.get(
  '/',
  getOfficerAssignmentOverview,
);

housingAssignmentRouter.get(
  '/applications/:applicationId/options',
  getOfficerAssignmentOptions,
);

housingAssignmentRouter.post(
  '/',
  createOfficerAssignment,
);

housingAssignmentRouter.post(
  '/pair',
  createOfficerRoommatePairAssignments,
);

housingAssignmentRouter.post(
  '/:assignmentId/change',
  changeOfficerAssignment,
);

housingAssignmentRouter.post(
  '/:assignmentId/cancel-assignment',
  cancelOfficerAssignmentOnly,
);

housingAssignmentRouter.post(
  '/:assignmentId/cancel',
  cancelOfficerAssignment,
);

export const studentHousingAssignmentRouter =
  Router();

studentHousingAssignmentRouter.use(
  validateAccessToken,
  resolveLocalUser,
  requireRole('STUDENT'),
);

studentHousingAssignmentRouter.get(
  '/',
  getCurrentStudentHousing,
);