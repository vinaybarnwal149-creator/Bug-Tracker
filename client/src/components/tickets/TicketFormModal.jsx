import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { Select } from '../ui/Select.jsx';
import { Button } from '../ui/Button.jsx';
import { ticketsApi } from '../../api/tickets.api.js';
import { PRIORITIES, TYPES, STATUSES } from '../../lib/constants.js';

const ticketSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title cannot exceed 120 characters'),
  description: z.string().max(5000).optional().default(''),
  type: z.enum(['bug', 'feature', 'task']).default('bug'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['todo', 'in_progress', 'done']).default('todo'),
  assigneeId: z.string().optional(),
  labelsRaw: z.string().optional().default(''),
  dueDate: z.string().optional()
});

export const TicketFormModal = ({
  isOpen,
  onClose,
  projectId,
  projectKey,
  defaultStatus = 'todo',
  members = []
}) => {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'bug',
      priority: 'medium',
      status: defaultStatus,
      assigneeId: '',
      labelsRaw: '',
      dueDate: ''
    }
  });

  const onSubmit = async (values) => {
    setServerError('');
    setSubmitting(true);

    try {
      const labels = values.labelsRaw
        ? values.labelsRaw
            .split(',')
            .map((l) => l.trim().toLowerCase())
            .filter(Boolean)
            .slice(0, 5)
        : [];

      const payload = {
        title: values.title,
        description: values.description,
        type: values.type,
        priority: values.priority,
        status: values.status,
        assigneeId: values.assigneeId ? values.assigneeId : null,
        labels,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null
      };

      const created = await ticketsApi.createTicket(projectId, payload);

      toast.success(`Created ticket ${created.key}`);
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
      queryClient.invalidateQueries({ queryKey: ['tickets', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });

      reset();
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Ticket" maxWidth="max-w-xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {serverError}
          </div>
        )}

        <Input
          label="Title *"
          placeholder="Summary of the issue or feature"
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          label="Description"
          placeholder="Add detailed context, repro steps, or acceptance criteria..."
          rows={4}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Type" {...register('type')}>
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </Select>

          <Select label="Priority" {...register('priority')}>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </Select>

          <Select label="Status" {...register('status')}>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Assignee" {...register('assigneeId')}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user?._id || m.user?.id} value={m.user?._id || m.user?.id}>
                {m.user?.name}
              </option>
            ))}
          </Select>

          <Input
            label="Due Date"
            type="date"
            {...register('dueDate')}
          />
        </div>

        <Input
          label="Labels (comma-separated, max 5)"
          placeholder="frontend, auth, bug"
          {...register('labelsRaw')}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create Ticket
          </Button>
        </div>
      </form>
    </Modal>
  );
};
