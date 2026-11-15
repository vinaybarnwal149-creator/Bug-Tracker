export const STATUSES = [
  { id: 'todo', label: 'To Do', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'done', label: 'Done', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
];

export const PRIORITIES = [
  { id: 'low', label: 'Low', badgeColor: 'bg-slate-100 text-slate-600 border-slate-200', iconColor: 'text-slate-400' },
  { id: 'medium', label: 'Medium', badgeColor: 'bg-blue-100 text-blue-700 border-blue-200', iconColor: 'text-blue-500' },
  { id: 'high', label: 'High', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200', iconColor: 'text-amber-500' },
  { id: 'critical', label: 'Critical', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200', iconColor: 'text-rose-600' }
];

export const TYPES = [
  { id: 'bug', label: 'Bug', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'feature', label: 'Feature', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'task', label: 'Task', color: 'text-sky-600 bg-sky-50 border-sky-200' }
];

export const ROLES = [
  { id: 'owner', label: 'Owner', description: 'Full control including project deletion' },
  { id: 'manager', label: 'Manager', description: 'Can manage members, settings, and all tickets' },
  { id: 'developer', label: 'Developer', description: 'Can create, work on, move, and edit own tickets' },
  { id: 'viewer', label: 'Viewer', description: 'Read-only access to board and tickets' }
];
