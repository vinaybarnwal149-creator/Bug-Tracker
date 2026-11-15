import mongoose from 'mongoose';
import { env } from './env.js';

let mongod = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  let uri = env.MONGODB_URI;

  try {
    if (uri && uri.trim() !== '' && !uri.includes('127.0.0.1')) {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`Connected to MongoDB at ${uri.split('@').pop()}`);
      return;
    }
  } catch (err) {
    console.warn(`Could not connect to external MongoDB: ${err.message}.`);
  }

  // Do not attempt in-memory Mongo in production or on Vercel serverless
  if (process.env.VERCEL || env.NODE_ENV === 'production') {
    console.log('Running on Vercel/Production without external MongoDB. Operating in demo mode.');
    return;
  }

  // Fallback to MongoMemoryServer only in local development / test
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create({
      instance: {
        startupTimeout: 60000
      }
    });
    uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`Connected to in-memory MongoDB at ${uri}`);
  } catch (err) {
    console.error('Fatal: Failed to connect to any MongoDB instance:', err);
    throw err;
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};
