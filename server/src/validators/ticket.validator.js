import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createTicketSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().max(5000, 'Description cannot exceed 5000 characters').optional().default(''),
  type: z.enum(['bug', 'feature', 'task']).optional().default('bug'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
  assigneeId: z.string().regex(objectIdRegex, 'Invalid assignee ID').nullable().optional(),
  labels: z.array(z.string().trim().toLowerCase().max(24, 'Label too long')).max(5, 'Maximum 5 labels').optional().default([]),
  dueDate: z.string().datetime({ offset: true }).nullable().optional()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional())
}).strict();

export const updateTicketSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters').optional(),
  description: z.string().max(5000, 'Description cannot exceed 5000 characters').optional(),
  type: z.enum(['bug', 'feature', 'task']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  labels: z.array(z.string().trim().toLowerCase().max(24)).max(5).optional(),
  dueDate: z.string().nullable().optional()
}).strict();

export const assignTicketSchema = z.object({
  assigneeId: z.string().regex(objectIdRegex, 'Invalid assignee ID').nullable()
}).strict();

export const moveTicketSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'done']),
  beforeTicketId: z.string().regex(objectIdRegex, 'Invalid beforeTicketId').nullable().optional(),
  afterTicketId: z.string().regex(objectIdRegex, 'Invalid afterTicketId').nullable().optional()
}).strict();
