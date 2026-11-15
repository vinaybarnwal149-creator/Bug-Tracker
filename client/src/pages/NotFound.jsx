import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-2xl mb-4">
        404
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        The page or project you requested does not exist, or you may not have permission to view it.
      </p>
      <NavLink to="/dashboard">
        <Button>Return to Dashboard</Button>
      </NavLink>
    </div>
  );
};
