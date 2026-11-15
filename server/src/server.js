import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';
import { seedDatabase } from './seed/seed.js';

const startServer = async () => {
  try {
    await connectDB();

    if (env.NODE_ENV !== 'production') {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('No users found in database. Auto-seeding demo data...');
        await seedDatabase(false);
      }
    }

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`TrackFlow API server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDB();
        console.log('Server and database connection closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
