import React from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import {
  CheckSquare,
  ArrowRight,
  Kanban,
  Users,
  ShieldCheck,
  Zap,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/ui/Button.jsx';

export const Landing = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-20 px-6 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <CheckSquare className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg text-slate-900 tracking-tight">TrackFlow</span>
        </div>

        <div className="flex items-center gap-3">
          <NavLink to="/login">
            <Button variant="ghost" size="sm">Sign In</Button>
          </NavLink>
          <NavLink to="/register">
            <Button size="sm">Sign Up</Button>
          </NavLink>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
          <Zap className="w-3.5 h-3.5 text-indigo-600" />
          <span>Lightweight Jira & Linear Alternative for Agile Teams</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto mb-6">
          Track bugs. Manage issues. <span className="text-indigo-600">Ship faster.</span>
        </h1>

        <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          The modern issue tracking platform built for high-velocity software teams. Beautiful drag-and-drop Kanban boards, granular project permissions, and threaded discussions.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <NavLink to="/register">
            <Button size="lg" className="w-full sm:w-auto shadow-md">
              <span>Start Tracking Free</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </NavLink>
          <NavLink to="/login">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              View Live Demo
            </Button>
          </NavLink>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-8 border-t border-slate-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Kanban className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Interactive Kanban Board</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Drag and drop tickets across columns with optimistic updates, persistent positioning, and keyboard accessibility.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Role-Based Access Control</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enforce strict project roles: Owner, Manager, Developer, and Viewer. Server-side validation guarantees zero unauthorized modifications.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Threaded Discussions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Keep communication in context with threaded replies, markdown-friendly descriptions, and inline image attachments.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 px-6 text-center text-xs text-slate-400 bg-white">
        TrackFlow &copy; {new Date().getFullYear()}. All rights reserved. Built with React, Vite, Tailwind CSS, Express, and MongoDB.
      </footer>
    </div>
  );
};
