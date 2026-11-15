import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth.js';
import { authApi } from '../api/auth.api.js';
import { Input } from '../components/ui/Input.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Avatar } from '../components/ui/Avatar.jsx';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60)
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [updatingName, setUpdatingName] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onUpdateProfile = async (values) => {
    setUpdatingName(true);
    try {
      const updated = await authApi.updateProfile(values);
      updateUser(updated);
      toast.success('Profile name updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setUpdatingName(false);
    }
  };

  const onUpdatePassword = async (values) => {
    setUpdatingPassword(true);
    try {
      await authApi.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      toast.success('Password changed successfully');
      resetPasswordForm();
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">User Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your account settings, display name, and security credentials.
        </p>
      </div>

      {/* Account Info & Display Name */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
          <Avatar name={user?.name} avatarColor={user?.avatarColor} size="lg" />
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{user?.name}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
          <Input
            label="Display Name"
            error={profileErrors.name?.message}
            {...registerProfile('name')}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={updatingName}>
              Save Name
            </Button>
          </div>
        </form>
      </div>

      {/* Change Password Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">Change Password</h3>

        <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            error={passwordErrors.currentPassword?.message}
            {...registerPassword('currentPassword')}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="At least 8 chars with letter & number"
            error={passwordErrors.newPassword?.message}
            {...registerPassword('newPassword')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            error={passwordErrors.confirmPassword?.message}
            {...registerPassword('confirmPassword')}
          />

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={updatingPassword}>
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
