import {
  findUserByAuthSubject,
} from './auth.repository.js';

import type {
  AuthenticatedUser,
} from './auth.types.js';

export async function getAuthenticatedUser(
  authSubject: string,
): Promise<AuthenticatedUser | null> {
  return findUserByAuthSubject(
    authSubject,
  );
}