import {
  Router,
} from 'express';

import {
  requireRole,
  resolveLocalUser,
  validateAccessToken,
} from '../../auth/auth.middleware.js';

import {
  createCurrentStudentApplication,
  getCurrentStudentApplications,
  submitCurrentStudentApplication,
  updateCurrentStudentApplication,
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