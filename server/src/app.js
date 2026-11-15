import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/error.js';
import apiRoutes from './routes/index.js';

export const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());

  const allowedOrigins = env.CLIENT_URL.split(',').map((url) => url.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps or curl) or if origin is in allowedOrigins
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed'));
        }
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Root health check (used by Render)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), time: new Date().toISOString() });
  });

  // Apply general API rate limiting
  app.use('/api', apiLimiter);

  // Mount API v1
  app.use('/api/v1', apiRoutes);

  // 404 handler
  app.use(notFound);

  // Global error handler
  app.use(errorHandler);

  return app;
};

export default createApp;
