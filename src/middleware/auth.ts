import { createHash, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import type { Config } from '../config.js';

function digest(s: string): Buffer {
  return createHash('sha256').update(s, 'utf8').digest();
}

/** Guards every /api/* route, including /api/health — the iOS Settings screen
 *  uses that endpoint to verify the token itself. */
export function requireSyncToken(config: Config) {
  const expected = digest(config.syncToken);
  return (req: Request, res: Response, next: NextFunction): void => {
    const header = req.get('authorization') ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
    if (token && timingSafeEqual(digest(token), expected)) {
      next();
      return;
    }
    res.set('WWW-Authenticate', 'Bearer').status(401).json({ error: 'unauthorized' });
  };
}
