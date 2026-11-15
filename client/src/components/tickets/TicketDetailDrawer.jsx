import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  User,
  Tag,
  Paperclip,
  Trash2,
  Copy,
  Check,
  UploadCloud,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { Drawer } from '../ui/Drawer.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Button } from '../ui/Button.jsx';
import { CommentList } from '../comments/CommentList.jsx';
import { ConfirmDialog } from '../ui/ConfirmDialog.jsx';
import { ticketsApi } from '../../api/tickets.api.js';
import { PRIORITIES, TYPES, STATUSES } from '../../lib/constants.js';
import { formatExactDate } from '../../lib/utils.js';
import { can } from '../../lib/permissions.js';
import { useAuth } from '../../hooks/useAuth.js';

export const TicketDetailDrawer = ({
  ticketId,
  isOpen,
  onClose,
  projectRole = 'viewer',
  members = [],
  onDeleted
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descInput, setDescInput] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: () => ticketsApi.getTicket(ticketId),
    enabled: Boolean(ticketId && isOpen)
  });

  useEffect(() => {
    if (ticket) {
      setTitleInput(ticket.title);
      setDescInput(ticket.description || '');
    }
  }, [ticket]);

  const updateMutation = useMutation({
    mutationFn: (data) => ticketsApi.updateTicket(ticketId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['ticket', ticketId], updated);
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket updated');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update ticket');
    }
  });

  const assignMutation = useMutation({
    mutationFn: (assigneeId) => ticketsApi.assignTicket(ticketId, assigneeId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['ticket', ticketId], updated);
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Assignee updated');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update assignee');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => ticketsApi.deleteTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['project-stats'] });
      toast.success('Ticket deleted');
      setIsDeleteModalOpen(false);
      onClose();
      onDeleted?.();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete ticket');
    }
  });

  if (!ticket && isLoading) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} title="Loading ticket...">
        <div className="py-12 flex justify-center text-slate-400">Loading...</div>
      </Drawer>
    );
  }

  if (!ticket) return null;

  const canEdit = can(projectRole, 'edit_ticket', ticket, user?.id);
  const canAssign = can(projectRole, 'assign_ticket', ticket, user?.id);
  const canDelete = can(projectRole, 'delete_ticket', ticket, user?.id);
  const canUpload = can(projectRole, 'upload_attachment', ticket, user?.id);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/projects/${ticket.project}/tickets/${ticket.key}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Ticket link copied to clipboard');
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingFiles(true);
    try {
      await ticketsApi.uploadAttachments(ticketId, files);
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Attachment uploaded');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      await ticketsApi.deleteAttachment(ticketId, attachmentId);
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] });
      toast.success('Attachment removed');
    } catch (err) {
      toast.error(err.message || 'Failed to delete attachment');
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      title={
        <div className="flex items-center gap-2">
          <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs font-semibold">
            {ticket.key}
          </span>
          <span className="text-slate-400 font-normal text-xs">&bull; {ticket.type}</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>

          {canDelete && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Cols: Title, Description, Attachments, Comments */}
          <div className="md:col-span-2 space-y-6">
            {/* Title */}
            <div>
              {isEditingTitle && canEdit ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    className="w-full text-lg font-bold text-slate-900 border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={120}
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingTitle(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        updateMutation.mutate({ title: titleInput.trim() });
                        setIsEditingTitle(false);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <h2
                  onClick={() => canEdit && setIsEditingTitle(true)}
                  className={`text-lg font-bold text-slate-900 ${
                    canEdit ? 'hover:bg-slate-50 cursor-pointer p-1 -m-1 rounded' : ''
                  }`}
                  title={canEdit ? 'Click to edit title' : ''}
                >
                  {ticket.title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Description
              </span>
              {isEditingDesc && canEdit ? (
                <div className="space-y-2">
                  <textarea
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    rows={5}
                    maxLength={5000}
                    className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingDesc(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        updateMutation.mutate({ description: descInput.trim() });
                        setIsEditingDesc(false);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => canEdit && setIsEditingDesc(true)}
                  className={`text-xs text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[4rem] p-3 rounded-lg border border-slate-100 bg-slate-50/50 ${
                    canEdit ? 'hover:bg-slate-100/70 cursor-pointer' : ''
                  }`}
                  title={canEdit ? 'Click to edit description' : ''}
                >
                  {ticket.description || <span className="italic text-slate-400">No description provided. Click to add context.</span>}
                </div>
              )}
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Attachments ({ticket.attachments?.length || 0} / 5)
                </span>
                {canUpload && (ticket.attachments?.length || 0) < 5 && (
                  <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFiles}
                    />
                  </label>
                )}
              </div>

              {ticket.attachments?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ticket.attachments.map((att) => (
                    <div
                      key={att.id || att._id}
                      className="relative group border border-slate-200 rounded-lg overflow-hidden bg-slate-50"
                    >
                      <a href={att.url} target="_blank" rel="noopener noreferrer">
                        <img
                          src={att.url}
                          alt={att.fileName}
                          className="w-full h-24 object-cover hover:scale-105 transition-transform"
                        />
                      </a>
                      <div className="p-1.5 flex items-center justify-between bg-white text-[10px] text-slate-600 border-t border-slate-100">
                        <span className="truncate max-w-[80px]" title={att.fileName}>{att.fileName}</span>
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteAttachment(att.id || att._id)}
                            className="text-slate-400 hover:text-rose-600"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No attachments attached.</p>
              )}
            </div>

            {/* Comments */}
            <div className="pt-4 border-t border-slate-100">
              <CommentList ticketId={ticket.id || ticket._id} projectRole={projectRole} />
            </div>
          </div>

          {/* Right Col: Metadata Sidebar */}
          <div className="space-y-5 bg-slate-50/80 p-4 rounded-xl border border-slate-200 h-fit">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Properties
            </span>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Status</label>
              {canEdit ? (
                <select
                  value={ticket.status}
                  onChange={(e) => updateMutation.mutate({ status: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {STATUSES.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs font-semibold capitalize text-slate-800">{ticket.status?.replace('_', ' ')}</p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Priority</label>
              {canEdit ? (
                <select
                  value={ticket.priority}
                  onChange={(e) => updateMutation.mutate({ priority: e.target.value })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium capitalize"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs font-semibold capitalize text-slate-800">{ticket.priority}</p>
              )}
            </div>

            {/* Assignee */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Assignee</label>
              {canAssign ? (
                <select
                  value={ticket.assignee?.id || ticket.assignee?._id || ''}
                  onChange={(e) => assignMutation.mutate(e.target.value || null)}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user?._id || m.user?.id} value={m.user?._id || m.user?.id}>
                      {m.user?.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-2">
                  {ticket.assignee ? (
                    <>
                      <Avatar name={ticket.assignee.name} avatarColor={ticket.assignee.avatarColor} size="xs" />
                      <span className="text-xs font-medium text-slate-800">{ticket.assignee.name}</span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Unassigned</span>
                  )}
                </div>
              )}
            </div>

            {/* Reporter */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Reporter</label>
              <div className="flex items-center gap-2">
                <Avatar name={ticket.reporter?.name} avatarColor={ticket.reporter?.avatarColor} size="xs" />
                <span className="text-xs font-medium text-slate-800">{ticket.reporter?.name}</span>
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Due Date</label>
              {canEdit ? (
                <input
                  type="date"
                  value={ticket.dueDate ? new Date(ticket.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => updateMutation.mutate({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 font-medium"
                />
              ) : (
                <p className="text-xs text-slate-800 font-medium">
                  {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'None'}
                </p>
              )}
            </div>

            {/* Timestamps */}
            <div className="pt-3 border-t border-slate-200/80 text-[11px] text-slate-400 space-y-1">
              <p>Created: {formatExactDate(ticket.createdAt)}</p>
              <p>Updated: {formatExactDate(ticket.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete Ticket"
        message={`Are you sure you want to permanently delete ticket ${ticket.key}? This action will also delete all comments and attachments.`}
        confirmLabel="Delete Ticket"
        confirmVariant="danger"
        loading={deleteMutation.isPending}
      />
    </Drawer>
  );
};
