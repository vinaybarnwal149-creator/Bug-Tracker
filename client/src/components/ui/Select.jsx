import React from 'react';
import { cn } from '../../lib/utils.js';

export const Select = React.forwardRef(({
  label,
  error,
  helperText,
  className,
  id,
  children,
  ...props
}, ref) => {
  const selectId = id || props.name;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          "w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors",
          error ? "border-rose-300 text-rose-900 focus:ring-rose-500" : "border-slate-300 text-slate-900",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>
      )}
      {!error && helperText && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
