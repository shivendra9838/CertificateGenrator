import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin ${origin} is not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req: Request, res: Response, next: NextFunction) => {
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.socket.remoteAddress;

  logger.info(`${method} ${url} - IP: ${ip}`);

  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${method} ${url} - Status: ${res.statusCode} - Duration: ${duration}ms`);
  });

  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

import certificatesRouter from './routes/certificates';
import verifyRouter from './routes/verify';
import authRouter from './routes/auth';
app.use('/api/auth', authRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/certificates', certificatesRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.url} not found`,
    },
  });
});

interface ErrorWithStatus extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

app.use((err: ErrorWithStatus, _req: Request, res: Response, _next: NextFunction): void => {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  logger.error(`${code} - ${message}`);
  logger.error(`Stack: ${err.stack || 'No stack trace available'}`);
  if (err.details) {
    logger.error('Details:', err.details);
  }

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(process.env.NODE_ENV === 'development' && err.details ? { details: err.details } : {}),
    },
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`CORS Origins: ${corsOrigins.join(', ')}`);
  });
}

export default app;
