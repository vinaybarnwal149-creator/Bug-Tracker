import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { TicketCard } from './TicketCard.jsx';
import { cn } from '../../lib/utils.js';

export const KanbanColumn = ({
  status,
  label,
  tickets = [],
  isDraggable = true,
  canCreateTicket = false,
  onAddTicket,
  onSelectTicket
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: status
  });

  const ticketIds = tickets.map((t) => t.id || t._id);

  const statusColors = {
    todo: 'border-t-slate-400 bg-slate-50/60',
    in_progress: 'border-t-blue-500 bg-blue-50/20',
    done: 'border-t-emerald-500 bg-emerald-50/20'
  };

  const statusPills = {
    todo: 'bg-slate-200 text-slate-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-emerald-100 text-emerald-800'
  };

  return (
    <div className={cn(
      "flex flex-col rounded-xl border border-slate-200 bg-slate-50/70 p-3 h-full min-w-[300px] flex-1 border-t-4",
      statusColors[status] || statusColors.todo,
      isOver && "ring-2 ring-indigo-500 bg-indigo-50/30"
    )}>
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-slate-800">{label}</h3>
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", statusPills[status])}>
            {tickets.length}
          </span>
        </div>

        {canCreateTicket && (
          <button
            onClick={() => onAddTicket(status)}
            title={`Add ticket to ${label}`}
            className="text-slate-400 hover:text-indigo-600 hover:bg-slate-200/60 p-1 rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cards List container */}
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto space-y-2.5 min-h-[150px] pr-0.5"
      >
        <SortableContext items={ticketIds} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id || ticket._id}
              ticket={ticket}
              isDraggable={isDraggable}
              onClick={() => onSelectTicket(ticket)}
            />
          ))}
        </SortableContext>

        {tickets.length === 0 && (
          <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 p-3 text-center bg-white/40">
            <span className="text-xs text-slate-400 font-medium">No tickets yet</span>
            {canCreateTicket && (
              <button
                type="button"
                onClick={() => onAddTicket(status)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add ticket</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
