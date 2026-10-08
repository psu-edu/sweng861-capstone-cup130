import type {
  Request,
  Response,
} from 'express';

import type {
  AuthenticatedRequest,
} from './auth.types.js';

export function getCurrentUser(
  req: Request,
  res: Response,
): void {
  const authenticatedRequest =
    req as AuthenticatedRequest;

  const user =
    authenticatedRequest.currentUser;

  if (user === undefined) {
    res.status(401).json({
      error: 'unauthorized',
      message:
        'Authentication is required.',
    });

    return;
  }

  res.status(200).json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
}