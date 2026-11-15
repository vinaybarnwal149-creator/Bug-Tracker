import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../ui/Modal.jsx';
import { Input } from '../ui/Input.jsx';
import { Textarea } from '../ui/Textarea.jsx';
import { Button } from '../ui/Button.jsx';
import { projectsApi } from '../../api/projects.api.js';

const projectFormSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(80, 'Title cannot exceed 80 characters'),
  key: z.string().trim().regex(/^[A-Z]{2,5}$/, 'Key must be 2 to 5 uppercase letters (A-Z)'),
  description: z.string().max(1000).optional().default('')
});

export const ProjectFormModal = ({ isOpen, onClose, onCreated }) => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: '',
      key: '',
      description: ''
    }
  });

  const titleVal = watch('title');

  // Auto-suggest key from title
  useEffect(() => {
    if (titleVal && !watch('keyManuallyEdited')) {
      const words = titleVal.trim().toUpperCase().split(/\s+/);
      let suggestedKey = '';
      if (words.length >= 2) {
        suggestedKey = words.slice(0, 3).map((w) => w[0]).join('');
      } else if (words[0]?.length >= 2) {
        suggestedKey = words[0].slice(0, 3);
      }
      suggestedKey = suggestedKey.replace(/[^A-Z]/g, '').slice(0, 4);
      if (suggestedKey.length >= 2) {
        setValue('key', suggestedKey, { shouldValidate: true });
      }
    }
  }, [titleVal, setValue, watch]);

  const onSubmit = async (values) => {
    setServerError('');
    setSubmitting(true);
    try {
      const created = await projectsApi.createProject(values);
      reset();
      onClose();
      onCreated?.();
      navigate(`/projects/${created.id}/board`);
    } catch (err) {
      setServerError(err.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Project" maxWidth="max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {serverError}
          </div>
        )}

        <Input
          label="Project Title *"
          placeholder="e.g. Website Revamp"
          error={errors.title?.message}
          {...register('title')}
        />

        <Input
          label="Project Key *"
          placeholder="e.g. WEB (2-5 uppercase letters)"
          error={errors.key?.message}
          helperText="Used as prefix for tickets (e.g. WEB-1, WEB-2)"
          {...register('key', {
            onChange: (e) => {
              setValue('key', e.target.value.toUpperCase());
              setValue('keyManuallyEdited', true);
            }
          })}
        />

        <Textarea
          label="Description"
          placeholder="What is this project about?"
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
