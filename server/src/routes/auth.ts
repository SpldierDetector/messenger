import { Router } from 'express';

import { authenticateUser } from '../auth/auth-service.js';
import { 
  createSessionToken,
  getSessionExpirationTime,  
} from '../auth/session.js';
import { deleteSession, insertSession } from '../db/sessions.js';
import { requireAuth } from '../middleware/auth.js';

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

authRouter.get('/me', requireAuth, (request, response) => {
  response.json({
    user: request.user,
  });
});

authRouter.post('/logout', requireAuth, (request, response) =>{
  const token = request.authToken;

  if (!token) {
    response.status(401).json({
      error: 'authorization required',
    });

    return;
  }

  deleteSession(token);

  response.status(204).send();
});