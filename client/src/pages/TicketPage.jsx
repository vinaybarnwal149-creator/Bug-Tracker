import React from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { TicketDetailDrawer } from '../components/tickets/TicketDetailDrawer.jsx';

export const TicketPage = () => {
  const { projectId, ticketKey } = useParams();
  const { currentProject } = useOutletContext();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(`/projects/${projectId}/board`);
  };

  return (
    <TicketDetailDrawer
      ticketId={ticketKey}
      isOpen={true}
      onClose={handleClose}
      projectRole={currentProject?.myRole || 'viewer'}
      members={currentProject?.members || []}
      onDeleted={handleClose}
    />
  );
};
