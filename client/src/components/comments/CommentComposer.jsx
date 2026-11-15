import React, { useState } from 'react';
import { Button } from '../ui/Button.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { useAuth } from '../../hooks/useAuth.js';

export const CommentComposer = ({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
  submitLabel = "Comment",
  autoFocus = false
}) => {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!body.trim() || submitting) return;

    setSubmitting(true);
    try {
      await onSubmit(body.trim());
      setBody('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="flex gap-3">
      <Avatar name={user?.name} avatarColor={user?.avatarColor} size="sm" className="mt-1" />
      <div className="flex-1 space-y-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          autoFocus={autoFocus}
          maxLength={2000}
          className="w-full text-xs p-3 rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {body.length} / 2000 &bull; <kbd className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">Ctrl+Enter</kbd> to submit
          </span>

          <div className="flex gap-2">
            {onCancel && (
              <Button size="sm" variant="ghost" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
            )}
            <Button size="sm" onClick={handleSubmit} disabled={!body.trim()} loading={submitting}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
