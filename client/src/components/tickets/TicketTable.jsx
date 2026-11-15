import React from 'react';
import { Bug, Sparkles, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '../ui/Avatar.jsx';
import { PRIORITIES, STATUSES } from '../../lib/constants.js';
import { formatRelativeDate, cn } from '../../lib/utils.js';

export const TicketTable = ({
  tickets = [],
  meta = {},
  onPageChange,
  onSelectTicket
}) => {
  const typeIcons = {
    bug: <Bug className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />,
    feature: <Sparkles className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />,
    task: <CheckCircle className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
  };

  const statusPills = {
    todo: 'bg-slate-100 text-slate-700 border-slate-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    done: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  };

  const statusLabels = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done'
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-28">Key</th>
                <th className="py-3 px-4 min-w-[240px]">Title</th>
                <th className="py-3 px-4 w-28">Type</th>
                <th className="py-3 px-4 w-28">Priority</th>
                <th className="py-3 px-4 w-32">Status</th>
                <th className="py-3 px-4 w-36">Assignee</th>
                <th className="py-3 px-4 w-28 text-right">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => {
                const priorityObj = PRIORITIES.find((p) => p.id === t.priority) || PRIORITIES[1];

                return (
                  <tr
                    key={t.id || t._id}
                    onClick={() => onSelectTicket(t)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                      {t.key}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 line-clamp-1">
                        {t.title}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 capitalize text-slate-600">
                        {typeIcons[t.type] || typeIcons.bug}
                        <span>{t.type}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", priorityObj.badgeColor)}>
                        {priorityObj.label}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", statusPills[t.status])}>
                        {statusLabels[t.status] || t.status}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {t.assignee ? (
                        <div className="flex items-center gap-1.5 truncate">
                          <Avatar
                            name={t.assignee.name}
                            avatarColor={t.assignee.avatarColor}
                            size="xs"
                          />
                          <span className="truncate text-slate-700">{t.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-400">
                      {formatRelativeDate(t.updatedAt)}
                    </td>
                  </tr>
                );
              })}

              {tickets.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-xs text-slate-500 font-medium">No tickets yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Tickets will appear here once created.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Bar */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing {(meta.page - 1) * meta.limit + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} tickets
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              onClick={() => onPageChange(meta.page + 1)}
              disabled={meta.page >= meta.totalPages}
              className="p-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
