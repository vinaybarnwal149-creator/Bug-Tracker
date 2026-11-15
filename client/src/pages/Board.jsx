import React, { useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets.api.js';
import { KanbanBoard } from '../components/kanban/KanbanBoard.jsx';
import { FilterBar } from '../components/tickets/FilterBar.jsx';
import { TicketDetailDrawer } from '../components/tickets/TicketDetailDrawer.jsx';
import { TicketFormModal } from '../components/tickets/TicketFormModal.jsx';
import { Spinner } from '../components/ui/FeedbackStates.jsx';
import { can } from '../lib/permissions.js';

export const Board = () => {
  const { projectId } = useParams();
  const { currentProject } = useOutletContext();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({});
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [columnDefaultStatus, setColumnDefaultStatus] = useState('todo');

  const myRole = currentProject?.myRole || 'viewer';
  const canMove = can(myRole, 'move_ticket');
  const canCreate = can(myRole, 'create_ticket');

  const { data: boardData = { todo: [], in_progress: [], done: [] }, isLoading, refetch } = useQuery({
    queryKey: ['board', projectId, filters],
    queryFn: () => ticketsApi.getBoard(projectId, filters),
    enabled: Boolean(projectId)
  });

  const handleAddTicketFromColumn = (status) => {
    setColumnDefaultStatus(status);
    setIsAddModalOpen(true);
  };

  const handleMoveSuccess = (rebalanced) => {
    if (rebalanced) {
      refetch();
    } else {
      queryClient.invalidateQueries({ queryKey: ['board', projectId] });
    }
    queryClient.invalidateQueries({ queryKey: ['project-stats', projectId] });
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <FilterBar
        members={currentProject?.members || []}
        onFiltersChange={setFilters}
      />

      {/* Kanban Board Area */}
      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <KanbanBoard
          boardData={boardData}
          isDraggable={canMove}
          canCreateTicket={canCreate}
          onAddTicket={handleAddTicketFromColumn}
          onSelectTicket={setSelectedTicket}
          onMoveSuccess={handleMoveSuccess}
        />
      )}

      {/* Ticket Detail Drawer */}
      {selectedTicket && (
        <TicketDetailDrawer
          ticketId={selectedTicket.id || selectedTicket._id}
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          projectRole={myRole}
          members={currentProject?.members || []}
          onDeleted={() => {
            setSelectedTicket(null);
            refetch();
          }}
        />
      )}

      {/* Column Add Ticket Modal */}
      {projectId && currentProject && (
        <TicketFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          projectId={projectId}
          projectKey={currentProject.key}
          defaultStatus={columnDefaultStatus}
          members={currentProject.members || []}
        />
      )}
    </div>
  );
};
