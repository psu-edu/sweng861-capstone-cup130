import {
  Router,
} from 'express';

import {
  requireRole,
  resolveLocalUser,
  validateAccessToken,
} from '../../auth/auth.middleware.js';

import {
  getCurrentStudentProfile,
  updateCurrentStudentProfile,
} from './student-profile.controller.js';

export const studentProfileRouter =
  Router();

studentProfileRouter.use(
  validateAccessToken,
  resolveLocalUser,
  requireRole('STUDENT'),
);

studentProfileRouter.get(
  '/',
  getCurrentStudentProfile,
);

studentProfileRouter.put(
  '/',
  updateCurrentStudentProfile,
);