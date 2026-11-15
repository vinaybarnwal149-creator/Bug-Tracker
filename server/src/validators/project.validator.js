import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(80, 'Title cannot exceed 80 characters'),
  key: z.string().trim().regex(/^[A-Z]{2,5}$/, 'Key must be 2 to 5 uppercase letters (A-Z)'),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional().default('')
}).strict();

export const updateProjectSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(80, 'Title cannot exceed 80 characters').optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional()
}).strict();

export const addMemberSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  role: z.enum(['manager', 'developer', 'viewer'])
}).strict();

export const updateMemberSchema = z.object({
  role: z.enum(['manager', 'developer', 'viewer'])
}).strict();
