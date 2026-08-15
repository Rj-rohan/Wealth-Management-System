/**
 * Authentication middleware.
 *
 * Login and registration already issued a 7-day JWT, but no route verified it —
 * any caller could read or mutate another user's data by guessing an id. The
 * merge introduces a single guard used by every account-scoped route across
 * both feature sets, so one sign-in unlocks the whole platform and nothing else.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-demo';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

/** Rejects the request unless it carries a valid, unexpired token. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = { id: payload.id, email: payload.email, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }
}

/**
 * For routes carrying a :userId parameter — confirms the caller owns that
 * account. Advisors may read their consented clients' data, which is checked
 * against advisor_client_consent by the service layer.
 */
export function requireSelf(req: Request, res: Response, next: NextFunction) {
  const { userId } = req.params;
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (req.user.id !== userId && req.user.role !== 'advisor') {
    return res.status(403).json({ error: 'You do not have access to this account.' });
  }
  return next();
}
