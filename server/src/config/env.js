import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check both server directory and workspace root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(16).default('c8d9e2f4a1b3c5e7d8f0a2b4c6e8f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5'),
  JWT_REFRESH_SECRET: z.string().min(16).default('f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5c8d9e2f4a1b3c5e7d8f0a2b4c6e8'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  COOKIE_DOMAIN: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default('')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Environment validation failed:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
