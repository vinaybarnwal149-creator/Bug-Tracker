import React, { useState } from 'react';
import { Reply, Edit2, Trash2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { CommentComposer } from './CommentComposer.jsx';
import { formatRelativeDate } from '../../lib/utils.js';
import { can } from '../../lib/permissions.js';
import { useAuth } from '../../hooks/useAuth.js';

export const CommentItem = ({
  comment,
  projectRole = 'viewer',
  onReply,
  onEdit,
  onDelete
}) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const canReply = can(projectRole, 'add_comment');
  const canEdit = can(projectRole, 'edit_comment', comment, user?.id);
  const canDelete = can(projectRole, 'delete_comment', comment, user?.id);

  const handleSaveEdit = async () => {
    if (!editBody.trim()) return;
    setSubmittingEdit(true);
    try {
      await onEdit(comment.id || comment._id, editBody.trim());
      setIsEditing(false);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleReplySubmit = async (text) => {
    await onReply(text, comment.id || comment._id);
    setIsReplying(false);
  };

  return (
    <div className="space-y-3 group">
      <div className="flex gap-3">
        <Avatar
          name={comment.author?.name}
          avatarColor={comment.author?.avatarColor}
          size="sm"
          className="mt-0.5"
        />

        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900">
                {comment.author?.name}
              </span>
              <span className="text-[11px] text-slate-400">
                {formatRelativeDate(comment.createdAt)}
              </span>
              {comment.editedAt && (
                <span className="text-[10px] text-slate-400 italic">(edited)</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canReply && (
                <button
                  onClick={() => setIsReplying((p) => !p)}
                  title="Reply"
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                >
                  <Reply className="w-3.5 h-3.5" />
                </button>
              )}
              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  title="Edit"
                  className="p-1 text-slate-400 hover:text-slate-700 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(comment.id || comment._id)}
                  title="Delete"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Body or Edit input */}
          {isEditing ? (
            <div className="space-y-2 mt-1">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={2}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={submittingEdit}
                  className="text-xs bg-indigo-600 text-white rounded px-2.5 py-1 font-medium hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {comment.body}
            </p>
          )}

          {/* Reply composer */}
          {isReplying && (
            <div className="mt-3 pl-4 border-l-2 border-indigo-200">
              <CommentComposer
                placeholder={`Replying to ${comment.author?.name}...`}
                submitLabel="Reply"
                autoFocus
                onCancel={() => setIsReplying(false)}
                onSubmit={handleReplySubmit}
              />
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies?.length > 0 && (
        <div className="pl-6 ml-3.5 border-l-2 border-slate-200 space-y-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id || reply._id}
              comment={reply}
              projectRole={projectRole}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
