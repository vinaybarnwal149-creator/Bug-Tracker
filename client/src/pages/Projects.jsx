import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, FolderKanban } from 'lucide-react';
import { projectsApi } from '../api/projects.api.js';
import { ProjectCard } from '../components/projects/ProjectCard.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState, Spinner } from '../components/ui/FeedbackStates.jsx';
import { ProjectFormModal } from '../components/projects/ProjectFormModal.jsx';

export const Projects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: projects = [], isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your issue tracker workspaces and member permissions.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="You are not a member of any projects yet. Create one to get started."
          action={
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>Create project</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <ProjectFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => refetch()}
      />
    </div>
  );
};
