import {
  Router,
} from 'express';

import {
  requireRole,
  resolveLocalUser,
  validateAccessToken,
} from '../../auth/auth.middleware.js';

import {
  acceptCurrentStudentRoommateRequest,
  cancelCurrentStudentRoommateRequest,
  createCurrentStudentRoommateRequest,
  declineCurrentStudentRoommateRequest,
  getCurrentRoommateProfile,
  getCurrentStudentRoommateRequests,
  searchCurrentStudentRoommates,
  updateCurrentRoommateProfile,
} from './roommate-matching.controller.js';

export const studentRoommateMatchingRouter =
  Router();

studentRoommateMatchingRouter.use(
  validateAccessToken,
  resolveLocalUser,
  requireRole('STUDENT'),
);

studentRoommateMatchingRouter.get(
  '/profile',
  getCurrentRoommateProfile,
);

studentRoommateMatchingRouter.put(
  '/profile',
  updateCurrentRoommateProfile,
);

studentRoommateMatchingRouter.get(
  '/search',
  searchCurrentStudentRoommates,
);

studentRoommateMatchingRouter.get(
  '/requests',
  getCurrentStudentRoommateRequests,
);

studentRoommateMatchingRouter.post(
  '/requests',
  createCurrentStudentRoommateRequest,
);

studentRoommateMatchingRouter.post(
  '/requests/:requestId/accept',
  acceptCurrentStudentRoommateRequest,
);

studentRoommateMatchingRouter.post(
  '/requests/:requestId/decline',
  declineCurrentStudentRoommateRequest,
);

studentRoommateMatchingRouter.post(
  '/requests/:requestId/cancel',
  cancelCurrentStudentRoommateRequest,
);