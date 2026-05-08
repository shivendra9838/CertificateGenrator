import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../config/database';
import { requireAuth, AuthenticatedRequest, getJwtSecret } from '../middleware/auth';
import { User } from '../models/User';

const router = Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const toPublicUser = (user: {
  _id: unknown;
  name: string;
  companyName: string;
  email: string;
  createdAt: Date;
}) => ({
  id: String(user._id),
  name: user.name,
  companyName: user.companyName,
  email: user.email,
  createdAt: user.createdAt,
});

const createToken = (user: { _id: unknown; email: string }): string =>
  jwt.sign({ userId: String(user._id), email: user.email }, getJwtSecret(), { expiresIn: '7d' });

const validateSignup = (body: Request['body']) => {
  const errors: Array<{ field: string; message: string }> = [];

  if (typeof body.name !== 'string' || !body.name.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  if (typeof body.companyName !== 'string' || !body.companyName.trim()) {
    errors.push({ field: 'companyName', message: 'Company name is required' });
  }
  if (typeof body.email !== 'string' || !emailRegex.test(body.email.trim())) {
    errors.push({ field: 'email', message: 'Valid email id is required' });
  }
  if (typeof body.password !== 'string' || body.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }

  return errors;
};

router.post('/signup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validationErrors = validateSignup(req.body);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: validationErrors,
        },
      });
    }

    await connectToDatabase();

    const email = req.body.email.trim().toLowerCase();
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'An account with this email id already exists',
        },
      });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({
      name: req.body.name.trim(),
      companyName: req.body.companyName.trim(),
      email,
      passwordHash,
    });

    return res.status(201).json({
      success: true,
      data: {
        user: toPublicUser(user),
        token: createToken(user),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/signin', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (typeof req.body.email !== 'string' || typeof req.body.password !== 'string') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email id and password are required',
        },
      });
    }

    await connectToDatabase();

    const user = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    const isPasswordValid = user ? await bcrypt.compare(req.body.password, user.passwordHash) : false;

    if (!user || !isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Email id or password is incorrect',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: toPublicUser(user),
        token: createToken(user),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await connectToDatabase();

    const user = await User.findById(req.user?.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        user: toPublicUser(user),
      },
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
