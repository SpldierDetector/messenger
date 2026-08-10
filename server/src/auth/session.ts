import { randomBytes } from 'node:crypto';

const SESSION_DURATION = 1000 * 60 * 60 * 24 * 30;

export function createSessionToken() {
  return randomBytes(32).toString('hex');
}

export function getSessionExpirationTime() {
  return Date.now() + SESSION_DURATION;
}