import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  UserCheck,
  LogOut,
  X,
  CheckSquare,
  Plus
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import { Avatar } from '../ui/Avatar.jsx';
import { cn } from '../../lib/utils.js';

export const Sidebar = ({
  projects = [],
  currentProjectId,
  onNewProject,
  isOpen,
  onClose
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navClass = ({ isActive }) =>
    cn(
      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
      isActive
        ? "bg-indigo-50 text-indigo-700 font-semibold"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      {/* Brand logo & title */}
      <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">TrackFlow</span>
        </NavLink>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main navigation links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div className="space-y-1">
          <NavLink to="/dashboard" className={navClass} onClick={onClose}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/projects" className={navClass} onClick={onClose}>
            <FolderKanban className="w-4 h-4" />
            <span>All Projects</span>
          </NavLink>
        </div>

        {/* User projects list */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              My Projects
            </span>
            <button
              onClick={() => {
                if (onClose) onClose();
                onNewProject?.();
              }}
              title="New Project"
              className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {projects.map((p) => {
              const isActive = currentProjectId === p.id;
              return (
                <NavLink
                  key={p.id}
                  to={`/projects/${p.id}/board`}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors group",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-5 h-5 rounded bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      {p.key?.slice(0, 2)}
                    </span>
                    <span className="truncate">{p.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {p.key}
                  </span>
                </NavLink>
              );
            })}

            {projects.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400 italic">No projects yet</p>
            )}
          </div>
        </div>
      </div>

      {/* User profile & logout footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 shadow-xs">
          <NavLink to="/profile" className="flex items-center gap-2.5 min-w-0" onClick={onClose}>
            <Avatar name={user?.name} avatarColor={user?.avatarColor} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-60 h-screen sticky top-0 flex-shrink-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile drawer sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onClose}
          />
          <div className="fixed inset-y-0 left-0 w-64 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
