import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { AvatarGroup } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';

export const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  const totalTickets = (project.ticketCounts?.todo || 0) +
                       (project.ticketCounts?.in_progress || 0) +
                       (project.ticketCounts?.done || 0);

  const doneTickets = project.ticketCounts?.done || 0;
  const progressPercent = totalTickets > 0 ? Math.round((doneTickets / totalTickets) * 100) : 0;

  const roleColors = {
    owner: 'primary',
    manager: 'warning',
    developer: 'success',
    viewer: 'default'
  };

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}/board`)}
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-xs">
              {project.key?.slice(0, 3)}
            </span>
            <div>
              <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {project.title}
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {project.key}
              </span>
            </div>
          </div>
          <Badge variant={roleColors[project.myRole] || 'default'} className="capitalize">
            {project.myRole}
          </Badge>
        </div>

        <p className="text-xs text-slate-500 line-clamp-2 min-h-[2rem] mb-4">
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-[11px] font-medium text-slate-500 mb-1">
            <span>Progress ({progressPercent}%)</span>
            <span>{doneTickets} / {totalTickets} done</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Footer: Members and Action */}
        <div className="flex items-center justify-between pt-1">
          <AvatarGroup
            users={project.members?.map((m) => m.user).filter(Boolean) || []}
            max={4}
            size="sm"
          />
          <span className="text-xs text-indigo-600 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            View Board <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
};
