import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Shield, User, Lock } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../auth/AuthContext';
import { AuthUser } from '../auth/types';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
    }
  }, [user]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!fullName.trim() || !email.trim()) {
      setProfileError('Name and email are required.');
      return;
    }

    setProfileSubmitting(true);
    try {
      const res = await apiClient.put<{ user: AuthUser }>('/profile', {
        full_name: fullName.trim(),
        email: email.trim()
      });
      updateUser(res.data.user);
      setProfileSuccess('Profile updated successfully.');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        'Unable to update your profile details. Please try again.';
      setProfileError(msg);
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Use at least 8 characters for your new password.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccess('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        'Unable to update your password. Check your current password and try again.';
      setPasswordError(msg);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Shield className="h-4 w-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-semibold tracking-tight text-slate-50">
              Profile
            </h1>
            <p className="text-xs text-slate-400">
              Manage your account and password.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <form onSubmit={handleProfileSubmit} className="card space-y-4 p-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Profile details
            </p>
            <p className="text-xs text-slate-500">
              Your name and email for this platform.
            </p>
          </div>

          {profileError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-900/70 bg-red-950/40 px-3 py-2 text-[11px] text-red-100">
              <AlertCircle className="h-3.5 w-3.5" />
              <p>{profileError}</p>
            </div>
          )}
          {profileSuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-900/70 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <p>{profileSuccess}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-300">Full name</label>
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/70 px-2">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none"
                placeholder="Your full name"
                autoComplete="name"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-300">Email</label>
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/70 px-2">
              <Mail className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
          >
            {profileSubmitting ? 'Saving changes…' : 'Save changes'}
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="card space-y-4 p-4">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Password
            </p>
            <p className="text-xs text-slate-500">
              Update your login password.
            </p>
          </div>

          {passwordError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-900/70 bg-red-950/40 px-3 py-2 text-[11px] text-red-100">
              <AlertCircle className="h-3.5 w-3.5" />
              <p>{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-900/70 bg-emerald-950/40 px-3 py-2 text-[11px] text-emerald-100">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <p>{passwordSuccess}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-300">
              Current password
            </label>
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/70 px-2">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-300">New password</label>
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/70 px-2">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-slate-300">
              Confirm new password
            </label>
            <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950/70 px-2">
              <Lock className="h-3.5 w-3.5 text-slate-500" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-8 w-full bg-transparent text-xs text-slate-100 outline-none"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-800/70"
          >
            {passwordSubmitting ? 'Updating password…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
};

