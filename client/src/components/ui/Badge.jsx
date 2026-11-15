import React from 'react';
import { cn } from '../../lib/utils.js';

export const Badge = ({
  children,
  variant = 'default',
  className
}) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
      variants[variant] || variants.default,
      className
    )}>
      {children}
    </span>
  );
};
