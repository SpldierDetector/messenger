import { 
  getUserByLogin,
  getUserById,
  insertUser,
} from '../db/users.js';
import { mapUserRow } from '../mappers/user.js';
import type { UserData, UserRow } from '../types/user.js';
import { verifyPassword, hashPassword } from './password.js';
import { 
  deleteSession,
  getSessionByToken,
} from '../db/sessions.js';
import type { SessionRow } from '../types/session.js';

export function registerUser(
  name: string,
  login: string,
  password: string,
): UserData | null {
  const normalizedName = name.trim();

  const normalizedLogin = login
    .trim()
    .toLowerCase();
  
  const existingUser = getUserByLogin(
    normalizedLogin,
  );

  if (existingUser) {
    return null;
  }

  const passwordHash = hashPassword(password);

  const userId = insertUser(
    normalizedName,
    normalizedLogin,
    passwordHash,
  );

  const row = getUserById(userId);

  if (!row) {
    throw new Error (
      'Failed to load registered user',
    );
  }

  return mapUserRow(row as UserRow)
}

export function authenticateUser(
  login: string,
  password: string,
): UserData | null {
  const normalizedLogin = login.trim().toLowerCase();

  const row = getUserByLogin(normalizedLogin);

  if (!row) {
    return null;
  }

  const user = row as UserRow;

  if (!user.passwordHash) {
    return null;
  }

  const passwordIsValid = verifyPassword(
    password,
    user.passwordHash,
  );

  if (!passwordIsValid) {
    return null;
  }

  return mapUserRow(user);
}

export function getUserBySessionToken(
  token: string,
): UserData | null {
  const sessionRow = getSessionByToken(token);

  if (!sessionRow) {
    return null;
  }

  const session = sessionRow as SessionRow;

  if (session.expiresAt <= Date.now()) {
    deleteSession(token);
    return null;
  }

  const userRow = getUserById(session.userId);

  if (!userRow) {
    return null;
  }

  return mapUserRow(userRow);
}