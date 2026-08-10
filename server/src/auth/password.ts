import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(SALT_LENGTH).toString('hex');

  const hash = scryptSync(
    password,
    salt,
    KEY_LENGTH,
  ).toString('hex');

  return `${salt}:${hash}`;
}

export function verifyPassword(
  password: string,
  storedPasswordHash: string,
) {
  const [salt, storedHash] = storedPasswordHash.split(':');

  if (!salt || !storedHash) {
    return false;
  }

  const hash = scryptSync(
    password,
    salt,
    KEY_LENGTH,
  );

  const storedHashBuffer = Buffer.from(
    storedHash,
    'hex',
  );

  if (hash.length !== storedHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(hash, storedHashBuffer);
}