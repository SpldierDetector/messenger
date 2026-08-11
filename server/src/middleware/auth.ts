import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import { getUserBySessionToken } from '../auth/auth-service.js';

export function requireAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.headers.authorization;

  if (!authorization) {
    response.status(401).json({
      error: 'authorization required',
    });

    return;
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    response.status(401).json({
      error: 'invalid authorization',
    });

    return
  }

  const user = getUserBySessionToken(token);

  if (!user) {
    response.status(401).json({
      error: 'invalid or expired session',
    });

    return;
  }

  request.user = user;
  request.authToken = token;

  next();
}