import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { projectsApi } from '../api/projects.api.js';
import { Input } from '../components/ui/Input.jsx';
import { Textarea } from '../components/ui/Textarea.jsx';
import { Button } from '../components/ui/Button.jsx';
import { MemberTable } from '../components/projects/MemberTable.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { can } from '../lib/permissions.js';
import { useAuth } from '../hooks/useAuth.js';

const generalSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(80),
  description: z.string().max(1000).optional().default('')
});

export const Settings = () => {
  const { projectId } = useParams();
  const { currentProject, refetchProjects } = useOutletContext();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('general');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);

  const myRole = currentProject?.myRole || 'viewer';
  const isOwner = myRole === 'owner';
  const canEdit = can(myRole, 'edit_project');
  const canLeave = can(myRole, 'leave_project');

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(generalSchema),
    values: {
      title: currentProject?.title || '',
      description: currentProject?.description || ''
    }
  });

  const onSaveGeneral = async (values) => {
    setSavingGeneral(true);
    try {
      await projectsApi.updateProject(projectId, values);
      toast.success('Project details updated');
      refetchProjects?.();
    } catch (err) {
      toast.error(err.message || 'Failed to update project');
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleDeleteProject = async () => {
    try {
      await projectsApi.deleteProject(projectId);
      toast.success('Project deleted');
      refetchProjects?.();
      navigate('/projects');
    } catch (err) {
      toast.error(err.message || 'Failed to delete project');
    }
  };

  const handleLeaveProject = async () => {
    try {
      await projectsApi.removeMember(projectId, user?.id);
      toast.success('You have left the project');
      refetchProjects?.();
      navigate('/projects');
    } catch (err) {
      toast.error(err.message || 'Failed to leave project');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Project Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage {currentProject?.title} settings, member roles, and project lifecycle.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          General
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Members ({currentProject?.members?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('danger')}
          className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'danger'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-rose-600'
          }`}
        >
          Danger Zone
        </button>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <form onSubmit={handleSubmit(onSaveGeneral)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Project Title"
              error={errors.title?.message}
              disabled={!canEdit}
              {...register('title')}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Project Key (Immutable)
              </label>
              <input
                value={currentProject?.key || ''}
                disabled
                className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 font-mono"
              />
            </div>
          </div>

          <Textarea
            label="Project Description"
            rows={4}
            error={errors.description?.message}
            disabled={!canEdit}
            {...register('description')}
          />

          {canEdit && (
            <div className="flex justify-end pt-3">
              <Button type="submit" loading={savingGeneral}>
                Save Changes
              </Button>
            </div>
          )}
        </form>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <MemberTable
          projectId={projectId}
          members={currentProject?.members || []}
          myRole={myRole}
          onUpdated={() => refetchProjects?.()}
        />
      )}

      {/* Danger Zone Tab */}
      {activeTab === 'danger' && (
        <div className="bg-white rounded-xl border border-rose-200 divide-y divide-rose-100 shadow-xs overflow-hidden">
          {canLeave && (
            <div className="p-6 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Leave Project</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  You will lose access to this project's board, and all your assigned tickets will be unassigned.
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setIsLeaveModalOpen(true)}>
                Leave Project
              </Button>
            </div>
          )}

          {isOwner && (
            <div className="p-6 flex items-center justify-between bg-rose-50/30">
              <div>
                <h4 className="text-sm font-semibold text-rose-900">Delete Project</h4>
                <p className="text-xs text-rose-600 mt-0.5">
                  Permanently deletes the project, tickets, comments, and attachments. This cannot be undone.
                </p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
                Delete Project
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you absolutely sure? All tickets and comments under "${currentProject?.title}" will be permanently wiped.`}
        confirmLabel="Delete Project"
        confirmVariant="danger"
        confirmTextMatch={currentProject?.title}
      />

      <ConfirmDialog
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveProject}
        title="Leave Project"
        message="Are you sure you want to leave this project? You will need an invite to rejoin."
        confirmLabel="Leave Project"
        confirmVariant="danger"
      />
    </div>
  );
};
