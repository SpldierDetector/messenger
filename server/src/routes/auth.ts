import { Router } from 'express';

import { authenticateUser, registerUser } from '../auth/auth-service.js';
import { 
  createSessionToken,
  getSessionExpirationTime,  
} from '../auth/session.js';
import { deleteSession, insertSession } from '../db/sessions.js';
import { requireAuth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/register', (request, response) => {
  const {
    name,
    login,
    password,
  } = request.body;

  if (
    typeof name !== 'string' ||
    typeof login !== 'string' ||
    typeof password !== 'string'
  ) {
    response.status(400).json({
      error: 'name, login and password are required',
    });

    return;
  }

  const normalizedName = name.trim();
  const normalizedLogin = login.trim();

  if (
    normalizedName.length === 0 ||
    normalizedLogin.length === 0
  ) {
    response.status(400).json({
      error: 'name and login cannot be empty',
    });

    return;
  }

  if (
    normalizedLogin.length < 3 ||
    normalizedLogin.length > 32
  ) {
    response.status(400).json({
      error: 'login must contain from 3 to 32 characters',
    });

    return;
  }

  if (
    password.length < 8 ||
    password.length > 128
  ) {
    response.status(400).json({
      error: 'password must contain from 8 to 128 characters',
    });

    return;
  }

  const user = registerUser(
    normalizedName,
    normalizedLogin,
    password,
  );

  if (!user) {
    response.status(409).json({
      error: 'login already exists',
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

  response.status(201).json({
    token,
    user,
  });
});

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