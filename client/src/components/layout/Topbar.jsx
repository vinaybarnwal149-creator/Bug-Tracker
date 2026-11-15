import React from 'react';
import { NavLink, useParams, useLocation } from 'react-router-dom';
import {
  Menu,
  Plus,
  Kanban,
  ListFilter,
  Settings,
  ChevronRight
} from 'lucide-react';
import { Button } from '../ui/Button.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { can } from '../../lib/permissions.js';

export const Topbar = ({
  onMenuToggle,
  projects = [],
  currentProject,
  onCreateTicket
}) => {
  const { user } = useAuth();
  const { projectId } = useParams();
  const location = useLocation();

  const isProjectPage = Boolean(projectId && currentProject);
  const myRole = currentProject?.myRole || 'viewer';
  const canCreate = can(myRole, 'create_ticket');

  return (
    <header className="h-14 bg-white border-b border-slate-200 sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center text-xs font-medium text-slate-500">
          <NavLink to="/projects" className="hover:text-slate-900">
            Projects
          </NavLink>
          {isProjectPage && (
            <>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400" />
              <span className="font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-xs">
                {currentProject.title}
              </span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                {currentProject.key}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Center: Navigation tabs for active project */}
      {isProjectPage && (
        <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <NavLink
            to={`/projects/${projectId}/board`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </NavLink>
          <NavLink
            to={`/projects/${projectId}/list`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>List</span>
          </NavLink>
          <NavLink
            to={`/projects/${projectId}/settings`}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                isActive
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`
            }
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </NavLink>
        </div>
      )}

      {/* Right: Action buttons & user profile */}
      <div className="flex items-center gap-3">
        {isProjectPage && canCreate && (
          <Button
            size="sm"
            onClick={onCreateTicket}
            className="shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Ticket</span>
          </Button>
        )}

        <NavLink to="/profile" title={user?.name}>
          <Avatar name={user?.name} avatarColor={user?.avatarColor} size="sm" />
        </NavLink>
      </div>
    </header>
  );
};
