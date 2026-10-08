import {
  Router,
} from 'express';

import {
  getCurrentUser,
} from './auth.controller.js';

import {
  resolveLocalUser,
  validateAccessToken,
} from './auth.middleware.js';

export const authRouter = Router();

authRouter.get(
  '/me',
  validateAccessToken,
  resolveLocalUser,
  getCurrentUser,
);