import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Bug,
  Sparkles,
  CheckCircle,
  Calendar,
  MessageSquare,
  Paperclip,
  GripVertical
} from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { PRIORITIES } from '../../lib/constants.js';
import { cn } from '../../lib/utils.js';

export const TicketCard = ({
  ticket,
  isDraggable = true,
  onClick
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: ticket.id || ticket._id,
    disabled: !isDraggable
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const priorityObj = PRIORITIES.find((p) => p.id === ticket.priority) || PRIORITIES[1];

  const typeIcons = {
    bug: <Bug className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />,
    feature: <Sparkles className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />,
    task: <CheckCircle className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
  };

  const isOverdue = ticket.dueDate && ticket.status !== 'done' && new Date(ticket.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs hover:shadow-md transition-all group relative cursor-pointer select-none",
        isDragging && "opacity-40 shadow-xl rotate-1 scale-102 border-indigo-400 z-50",
        !isDraggable && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Drag handle & Key */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {typeIcons[ticket.type] || typeIcons.bug}
          <span className="text-[11px] font-mono font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">
            {ticket.key}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium border", priorityObj.badgeColor)}>
            {priorityObj.label}
          </span>
          {isDraggable && (
            <div
              {...attributes}
              {...listeners}
              className="text-slate-300 hover:text-slate-600 p-0.5 cursor-grab active:cursor-grabbing rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug mb-3 group-hover:text-indigo-600 transition-colors">
        {ticket.title}
      </h4>

      {/* Labels */}
      {ticket.labels?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {ticket.labels.slice(0, 2).map((label, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200"
            >
              #{label}
            </span>
          ))}
          {ticket.labels.length > 2 && (
            <span className="text-[10px] text-slate-400">
              +{ticket.labels.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-400 text-xs">
        <div className="flex items-center gap-3">
          {ticket.dueDate && (
            <div className={cn(
              "flex items-center gap-1 text-[11px]",
              isOverdue ? "text-rose-600 font-semibold" : "text-slate-500"
            )}>
              <Calendar className="w-3 h-3" />
              <span>{new Date(ticket.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}

          {ticket.commentCount > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <MessageSquare className="w-3 h-3" />
              <span>{ticket.commentCount}</span>
            </div>
          )}

          {ticket.attachments?.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Paperclip className="w-3 h-3" />
              <span>{ticket.attachments.length}</span>
            </div>
          )}
        </div>

        {ticket.assignee ? (
          <Avatar
            name={ticket.assignee.name}
            avatarColor={ticket.assignee.avatarColor}
            size="xs"
          />
        ) : (
          <div className="w-5 h-5 rounded-full border border-dashed border-slate-300 text-slate-400 flex items-center justify-center text-[10px]">
            —
          </div>
        )}
      </div>
    </div>
  );
};
