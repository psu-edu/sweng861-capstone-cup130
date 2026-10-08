import type {
  Request,
} from 'express';

export const USER_ROLES = [
  'STUDENT',
  'HOUSING_OFFICER',
] as const;

export type UserRole =
  (typeof USER_ROLES)[number];

export interface AuthenticatedUser {
  id: string;
  authSubject: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest
  extends Request {
  currentUser?: AuthenticatedUser;
}