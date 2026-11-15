import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckSquare } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setServerError('');
    setSubmitting(true);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = (email) => {
    setValue('email', email);
    setValue('password', 'Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <NavLink to="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
            <CheckSquare className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-2xl text-slate-900 tracking-tight">TrackFlow</span>
        </NavLink>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Sign in to your account</h2>
        <p className="mt-1 text-xs text-slate-500">
          Or{' '}
          <NavLink to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
            create a new account
          </NavLink>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-slate-200">
          {serverError && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            <Button type="submit" loading={submitting} className="w-full">
              Sign In
            </Button>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleDemoFill('owner@demo.com')}
              className="w-full flex items-center justify-center gap-2 text-xs py-2 px-3 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors shadow-xs"
            >
              <span>Auto-Fill Demo Account</span>
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">owner@demo.com</code> &bull; <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">Password123!</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
