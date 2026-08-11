import type { UserData } from './user.js';

declare global {
  namespace Express {
    interface Request {
      user?: UserData;
      authToken?: string;
    }
  }
}

export {};