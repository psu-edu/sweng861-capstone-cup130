import {
  pool,
} from '../db/pool.js';

import type {
  AuthenticatedUser,
  UserRole,
} from './auth.types.js';

interface UserRow {
  id: string;
  auth_subject: string;
  email: string;
  role: UserRole;
}

export async function findUserByAuthSubject(
  authSubject: string,
): Promise<AuthenticatedUser | null> {
  const result =
    await pool.query<UserRow>(
      `
        SELECT
          id,
          auth_subject,
          email,
          role
        FROM users
        WHERE auth_subject = $1
        LIMIT 1
      `,
      [
        authSubject,
      ],
    );

  const row = result.rows[0];

  if (row === undefined) {
    return null;
  }

  return {
    id: row.id,
    authSubject: row.auth_subject,
    email: row.email,
    role: row.role,
  };
}