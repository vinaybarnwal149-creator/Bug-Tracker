import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment body cannot be empty').max(2000, 'Comment cannot exceed 2000 characters'),
  parentId: z.string().regex(objectIdRegex, 'Invalid parent comment ID').nullable().optional()
}).strict();

export const updateCommentSchema = z.object({
  body: z.string().trim().min(1, 'Comment body cannot be empty').max(2000, 'Comment cannot exceed 2000 characters')
}).strict();
