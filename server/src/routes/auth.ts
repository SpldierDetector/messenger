import { Router } from 'express';

import { 
  authenticateUser,
  getUserBySessionToken,
} from '../auth/auth-service.js';
import { 
  createSessionToken,
  getSessionExpirationTime,  
} from '../auth/session.js';
import { insertSession } from '../db/sessions.js';

export const authRouter = Router();

authRouter.post('/login', (request, response) => {
  const { login, password } = request.body;

  if (
    typeof login !== 'string' ||
    typeof password !== 'string'
  ) { response.status(400).json({
      error: 'login and password are required',
    });
  
  return;
  }

  const user = authenticateUser(login, password);

  if (!user) {
    response.status(401).json({
      error: 'invalid login or password',
    });

    return;
  }

  const token = createSessionToken();

  const createdAt = Date.now();
  const expiresAt = getSessionExpirationTime();

  insertSession(
    token,
    user.id,
    createdAt,
    expiresAt,
  );

  response.json({
    token,
    user,
  });
});

authRouter.get('/me', (request, response) => {
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

    return;
  }

  const user = getUserBySessionToken(token);

  if (!user) {
    response.status(401).json({
      error: 'invalid or expired session',
    });

    return;
  }

  response.json({
    user,
  });
});