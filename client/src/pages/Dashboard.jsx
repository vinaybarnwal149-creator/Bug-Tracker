import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  FolderKanban,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { projectsApi } from '../api/projects.api.js';
import { ProjectCard } from '../components/projects/ProjectCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, Spinner } from '../components/ui/FeedbackStates.jsx';
import { ProjectFormModal } from '../components/projects/ProjectFormModal.jsx';

export const Dashboard = () => {
  const { user } = useAuth();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects
  });

  // Calculate totals across all user projects
  let totalOpen = 0;
  let totalInProgress = 0;
  let totalDone = 0;

  for (const p of projects) {
    totalOpen += (p.ticketCounts?.todo || 0);
    totalInProgress += (p.ticketCounts?.in_progress || 0);
    totalDone += (p.ticketCounts?.done || 0);
  }

  return (
    <div className="space-y-8">
      {/* Welcome Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Here is a summary of your active projects and team progress.
          </p>
        </div>

        <Button onClick={() => setIsNewProjectModalOpen(true)} className="shadow-xs self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Projects</span>
            <FolderKanban className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">To Do</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalOpen}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalInProgress}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalDone}</p>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Your Projects</h2>
          <NavLink to="/projects" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            View all ({projects.length}) <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Spinner size="lg" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start organizing issues and collaborating with your team."
            action={
              <Button onClick={() => setIsNewProjectModalOpen(true)} size="lg" className="shadow-xs">
                <Plus className="w-4 h-4" />
                <span>Create your first project</span>
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* My Open Tickets Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">My open tickets</h2>
        </div>

        <EmptyState
          icon={CheckCircle2}
          title="No open tickets"
          description="You have no open tickets assigned to you across your active projects."
          className="bg-white"
        />
      </div>

      <ProjectFormModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreated={() => refetch()}
      />
    </div>
  );
};
