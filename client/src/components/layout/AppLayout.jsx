import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../../api/projects.api.js';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';
import { ProjectFormModal } from '../projects/ProjectFormModal.jsx';
import { TicketFormModal } from '../tickets/TicketFormModal.jsx';

export const AppLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

  const { projectId } = useParams();

  const { data: projects = [], refetch: refetchProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects
  });

  const { data: currentProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
    enabled: Boolean(projectId)
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        projects={projects}
        currentProjectId={projectId}
        onNewProject={() => setIsNewProjectModalOpen(true)}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
          projects={projects}
          currentProject={currentProject}
          onCreateTicket={() => setIsNewTicketModalOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ currentProject, refetchProjects }} />
        </main>
      </div>

      <ProjectFormModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreated={() => refetchProjects()}
      />

      {projectId && currentProject && (
        <TicketFormModal
          isOpen={isNewTicketModalOpen}
          onClose={() => setIsNewTicketModalOpen(false)}
          projectId={projectId}
          projectKey={currentProject.key}
          members={currentProject.members || []}
        />
      )}
    </div>
  );
};
