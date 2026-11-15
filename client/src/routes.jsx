import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { Spinner } from './components/ui/FeedbackStates.jsx';

const Landing = lazy(() => import('./pages/Landing.jsx').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login.jsx').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register.jsx').then(m => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx').then(m => ({ default: m.Dashboard })));
const Projects = lazy(() => import('./pages/Projects.jsx').then(m => ({ default: m.Projects })));
const Board = lazy(() => import('./pages/Board.jsx').then(m => ({ default: m.Board })));
const ListView = lazy(() => import('./pages/ListView.jsx').then(m => ({ default: m.ListView })));
const TicketPage = lazy(() => import('./pages/TicketPage.jsx').then(m => ({ default: m.TicketPage })));
const Settings = lazy(() => import('./pages/Settings.jsx').then(m => ({ default: m.Settings })));
const Profile = lazy(() => import('./pages/Profile.jsx').then(m => ({ default: m.Profile })));
const NotFound = lazy(() => import('./pages/NotFound.jsx').then(m => ({ default: m.NotFound })));

const LoadingFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <Spinner size="lg" />
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const ProjectRedirect = () => {
  const { projectId } = useParams();
  return <Navigate to={`/projects/${projectId}/board`} replace />;
};

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <Register />
            </PublicOnlyRoute>
          }
        />

        {/* Authenticated Workspace Pages */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectRedirect />} />
          <Route path="/projects/:projectId/board" element={<Board />} />
          <Route path="/projects/:projectId/list" element={<ListView />} />
          <Route path="/projects/:projectId/tickets/:ticketKey" element={<TicketPage />} />
          <Route path="/projects/:projectId/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};
