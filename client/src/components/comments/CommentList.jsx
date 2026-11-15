import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '../../api/comments.api.js';
import { CommentComposer } from './CommentComposer.jsx';
import { CommentItem } from './CommentItem.jsx';
import { Spinner } from '../ui/FeedbackStates.jsx';
import { can } from '../../lib/permissions.js';

export const CommentList = ({ ticketId, projectRole = 'viewer' }) => {
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', ticketId],
    queryFn: () => commentsApi.getComments(ticketId),
    enabled: Boolean(ticketId)
  });

  const createMutation = useMutation({
    mutationFn: ({ body, parentId }) => commentsApi.createComment(ticketId, { body, parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    }
  });

  const editMutation = useMutation({
    mutationFn: ({ commentId, body }) => commentsApi.updateComment(commentId, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentsApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
    }
  });

  const canAdd = can(projectRole, 'add_comment');

  return (
    <div className="space-y-6">
      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
        Activity & Comments ({comments.length})
      </h3>

      {canAdd && (
        <div className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-200">
          <CommentComposer
            onSubmit={(body) => createMutation.mutateAsync({ body })}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner size="md" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-slate-400 italic text-center py-6">
          No comments yet. Start the conversation!
        </p>
      ) : (
        <div className="space-y-4 divide-y divide-slate-100">
          {comments.map((comment) => (
            <div key={comment.id || comment._id} className="pt-4 first:pt-0">
              <CommentItem
                comment={comment}
                projectRole={projectRole}
                onReply={(body, parentId) => createMutation.mutateAsync({ body, parentId })}
                onEdit={(commentId, body) => editMutation.mutateAsync({ commentId, body })}
                onDelete={(commentId) => deleteMutation.mutateAsync(commentId)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
