import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { KanbanColumn } from './KanbanColumn.jsx';
import { TicketCard } from './TicketCard.jsx';
import { ticketsApi } from '../../api/tickets.api.js';

export const KanbanBoard = ({
  boardData,
  onMoveSuccess,
  isDraggable = true,
  canCreateTicket = false,
  onAddTicket,
  onSelectTicket
}) => {
  const [activeTicket, setActiveTicket] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5
      }
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const findColumnOfTicket = (ticketId) => {
    for (const [status, list] of Object.entries(boardData)) {
      if (list.some((t) => (t.id || t._id) === ticketId)) {
        return status;
      }
    }
    return null;
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const fromCol = findColumnOfTicket(active.id);
    if (fromCol) {
      const ticket = boardData[fromCol].find((t) => (t.id || t._id) === active.id);
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const sourceStatus = findColumnOfTicket(activeId);
    if (!sourceStatus) return;

    // Determine target column
    let targetStatus = null;
    let targetIndex = 0;

    if (['todo', 'in_progress', 'done'].includes(overId)) {
      targetStatus = overId;
      targetIndex = boardData[targetStatus].length;
    } else {
      targetStatus = findColumnOfTicket(overId);
      if (!targetStatus) return;
      targetIndex = boardData[targetStatus].findIndex((t) => (t.id || t._id) === overId);
    }

    if (!targetStatus) return;

    // Filter out the moving ticket from the target column if it's already there
    const targetColumnTickets = boardData[targetStatus].filter(
      (t) => (t.id || t._id) !== activeId
    );

    // Compute neighbors
    const prevTicket = targetIndex > 0 ? targetColumnTickets[targetIndex - 1] : null;
    const nextTicket = targetIndex < targetColumnTickets.length ? targetColumnTickets[targetIndex] : null;

    const afterTicketId = prevTicket ? (prevTicket.id || prevTicket._id) : null;
    const beforeTicketId = nextTicket ? (nextTicket.id || nextTicket._id) : null;

    try {
      const res = await ticketsApi.moveTicket(activeId, {
        status: targetStatus,
        afterTicketId,
        beforeTicketId
      });

      onMoveSuccess?.(res?.meta?.rebalanced);
    } catch (err) {
      toast.error(err.message || 'Failed to move ticket');
      onMoveSuccess?.(true); // force reload to restore original state
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start min-h-[calc(100vh-220px)]">
        <KanbanColumn
          status="todo"
          label="To Do"
          tickets={boardData.todo || []}
          isDraggable={isDraggable}
          canCreateTicket={canCreateTicket}
          onAddTicket={onAddTicket}
          onSelectTicket={onSelectTicket}
        />
        <KanbanColumn
          status="in_progress"
          label="In Progress"
          tickets={boardData.in_progress || []}
          isDraggable={isDraggable}
          canCreateTicket={canCreateTicket}
          onAddTicket={onAddTicket}
          onSelectTicket={onSelectTicket}
        />
        <KanbanColumn
          status="done"
          label="Done"
          tickets={boardData.done || []}
          isDraggable={isDraggable}
          canCreateTicket={canCreateTicket}
          onAddTicket={onAddTicket}
          onSelectTicket={onSelectTicket}
        />
      </div>

      <DragOverlay>
        {activeTicket ? (
          <div className="rotate-2 scale-105 shadow-2xl">
            <TicketCard ticket={activeTicket} isDraggable={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
