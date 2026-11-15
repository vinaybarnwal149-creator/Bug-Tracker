import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce.js';
import { PRIORITIES, TYPES, STATUSES } from '../../lib/constants.js';

export const FilterBar = ({ members = [], onFiltersChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [qInput, setQInput] = useState(searchParams.get('q') || '');
  const debouncedQ = useDebounce(qInput, 300);

  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [priority, setPriority] = useState(searchParams.get('priority') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [assignee, setAssignee] = useState(searchParams.get('assignee') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || '-createdAt');

  // Sync debounced search to URL and parent
  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);

    if (debouncedQ) nextParams.set('q', debouncedQ);
    else nextParams.delete('q');

    if (status) nextParams.set('status', status);
    else nextParams.delete('status');

    if (priority) nextParams.set('priority', priority);
    else nextParams.delete('priority');

    if (type) nextParams.set('type', type);
    else nextParams.delete('type');

    if (assignee) nextParams.set('assignee', assignee);
    else nextParams.delete('assignee');

    if (sort && sort !== '-createdAt') nextParams.set('sort', sort);
    else nextParams.delete('sort');

    setSearchParams(nextParams, { replace: true });

    onFiltersChange?.({
      q: debouncedQ,
      status,
      priority,
      type,
      assignee,
      sort
    });
  }, [debouncedQ, status, priority, type, assignee, sort]);

  const hasActiveFilters = Boolean(qInput || status || priority || type || assignee || (sort && sort !== '-createdAt'));

  const handleClear = () => {
    setQInput('');
    setStatus('');
    setPriority('');
    setType('');
    setAssignee('');
    setSort('-createdAt');
  };

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs mb-5 space-y-3">
      <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        {/* Search input with debouncing */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search tickets by key, title, or description..."
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {qInput && (
            <button
              onClick={() => setQInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>

          {/* Assignee filter */}
          <select
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Assignees</option>
            <option value="me">Assigned to Me</option>
            <option value="unassigned">Unassigned</option>
            {members.map((m) => (
              <option key={m.user?._id || m.user?.id} value={m.user?._id || m.user?.id}>
                {m.user?.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="-createdAt">Newest first</option>
            <option value="createdAt">Oldest first</option>
            <option value="-updatedAt">Recently updated</option>
            <option value="dueDate">Due date</option>
          </select>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
