import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthTokenPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  return secret;
};

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication is required',
      },
    });
    return;
  }

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };
    next();
  } catch (_error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Sign in again to continue',
      },
    });
  }
};
