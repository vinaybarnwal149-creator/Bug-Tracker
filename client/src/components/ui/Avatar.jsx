import React from 'react';
import { cn, getInitials } from '../../lib/utils.js';

export const Avatar = ({
  name,
  avatarColor,
  size = 'md',
  className
}) => {
  const sizes = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };

  const initials = getInitials(name);
  const bgColor = avatarColor || '#4F46E5';

  return (
    <div
      title={name}
      style={{ backgroundColor: bgColor }}
      className={cn(
        "rounded-full flex items-center justify-center font-semibold text-white uppercase select-none ring-2 ring-white flex-shrink-0 shadow-xs",
        sizes[size] || sizes.md,
        className
      )}
    >
      {initials}
    </div>
  );
};

export const AvatarGroup = ({ users = [], max = 4, size = 'sm' }) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className="flex -space-x-1.5 overflow-hidden items-center">
      {visible.map((u, i) => (
        <Avatar
          key={u.id || u._id || i}
          name={u.name}
          avatarColor={u.avatarColor}
          size={size}
        />
      ))}
      {remaining > 0 && (
        <div className="w-7 h-7 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[11px] font-medium text-slate-600">
          +{remaining}
        </div>
      )}
    </div>
  );
};
