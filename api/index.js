import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { connectDB } from '../server/src/config/db.js';
import apiRoutes from '../server/src/routes/index.js';
import demoFallbackRouter from '../server/src/routes/demoFallback.js';

let appInstance = null;

const createServerlessApp = () => {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  // Route /api/v1 dynamically based on DB availability
  app.use('/api/v1', (req, res, next) => {
    if (mongoose.connection.readyState === 1) {
      return apiRoutes(req, res, next);
    }
    return demoFallbackRouter(req, res, next);
  });

  return app;
};

export default async function handler(req, res) {
  try {
    await connectDB();
  } catch (err) {
    // When MongoDB Atlas is not yet configured, demo fallback handles all requests
  }

  if (!appInstance) {
    appInstance = createServerlessApp();
  }

  return appInstance(req, res);
}
