import {
  Router,
} from 'express';

import {
  requireRole,
  resolveLocalUser,
  validateAccessToken,
} from '../../auth/auth.middleware.js';

import {
  approveOfficerApplication,
  cancelCurrentStudentApplication,
  cancelOfficerApplication,
  createCurrentStudentApplication,
  getCurrentStudentApplications,
  getOfficerApplication,
  getOfficerApplications,
  submitCurrentStudentApplication,
  updateCurrentStudentApplication,
  updateOfficerApplicationNotes,
} from './housing-application.controller.js';

export const studentHousingApplicationRouter =
  Router();

studentHousingApplicationRouter.use(
  validateAccessToken,
  resolveLocalUser,
  requireRole('STUDENT'),
);

studentHousingApplicationRouter.get(
  '/',
  getCurrentStudentApplications,
);

studentHousingApplicationRouter.post(
  '/',
  createCurrentStudentApplication,
);

studentHousingApplicationRouter.put(
  '/:applicationId',
  updateCurrentStudentApplication,
);

studentHousingApplicationRouter.post(
  '/:applicationId/submit',
  submitCurrentStudentApplication,
);

studentHousingApplicationRouter.post(
  '/:applicationId/cancel',
  cancelCurrentStudentApplication,
);

export const housingOfficerApplicationRouter =
  Router();

housingOfficerApplicationRouter.use(
  validateAccessToken,
  resolveLocalUser,
  requireRole('HOUSING_OFFICER'),
);

housingOfficerApplicationRouter.get(
  '/',
  getOfficerApplications,
);

housingOfficerApplicationRouter.get(
  '/:applicationId',
  getOfficerApplication,
);

housingOfficerApplicationRouter.put(
  '/:applicationId/notes',
  updateOfficerApplicationNotes,
);

housingOfficerApplicationRouter.post(
  '/:applicationId/approve',
  approveOfficerApplication,
);

housingOfficerApplicationRouter.post(
  '/:applicationId/cancel',
  cancelOfficerApplication,
);