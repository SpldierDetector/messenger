import { Router } from 'express';
import {
  removePushToken,
  savePushToken,
} from '../db/push-tokens.js';
import { requireAuth } from '../middleware/auth.js';

export const pushTokensRouter = Router();

function isValidExpoPushToken(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^(?:Expo|Exponent)PushToken\[[A-Za-z0-9_-]+\]$/.test(value) &&
    value.length <= 256
  );
}

pushTokensRouter.post(
  '/',
  requireAuth,
  (request, response) => {
    const token = request.body?.token;

    if (!isValidExpoPushToken(token)) {
      response.status(400).json({
        error: 'invalid expo push token',
      });

      return;
    }
      
    savePushToken(request.user!.id, token);

    response.status(204).send();
  },
);

pushTokensRouter.delete(
  '/',
  requireAuth,
  (request, response) => {
    const token = request.body?.token;

    if (!isValidExpoPushToken(token)) {
      response.status(400).json({
        error: 'invalid expo push token',
      });

      return;
    }

    removePushToken(request.user!.id, token);

    response.status(204).send();
  },
);