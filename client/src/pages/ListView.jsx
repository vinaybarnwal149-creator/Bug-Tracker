import React, { useState } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets.api.js';
import { FilterBar } from '../components/tickets/FilterBar.jsx';
import { TicketTable } from '../components/tickets/TicketTable.jsx';
import { TicketDetailDrawer } from '../components/tickets/TicketDetailDrawer.jsx';
import { Spinner } from '../components/ui/FeedbackStates.jsx';

export const ListView = () => {
  const { projectId } = useParams();
  const { currentProject } = useOutletContext();

  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets', projectId, filters, page],
    queryFn: () => ticketsApi.getTickets(projectId, { ...filters, page, limit: 20 }),
    enabled: Boolean(projectId)
  });

  const tickets = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 20, total: 0, totalPages: 1 };
  const myRole = currentProject?.myRole || 'viewer';

  return (
    <div className="space-y-4">
      <FilterBar
        members={currentProject?.members || []}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters);
          setPage(1);
        }}
      />

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <TicketTable
          tickets={tickets}
          meta={meta}
          onPageChange={setPage}
          onSelectTicket={setSelectedTicket}
        />
      )}

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
    </div>
  );
};
