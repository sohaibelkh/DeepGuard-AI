import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Mail, Shield, User, Lock, Save } from 'lucide-react';
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
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f7d4] ring-1 ring-[#a5c422]/20">
            <User className="h-5 w-5 text-[#a5c422]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold tracking-tight text-[#333]">
              Account Profile
            </h1>
            <p className="text-xs text-[#999]">
              Manage your personal information and account security.
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <form onSubmit={handleProfileSubmit} className="card p-6 space-y-5">
          <div className="space-y-1">
             <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#a5c422]" />
              <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
                General Information
              </p>
            </div>
            <p className="text-[11px] text-[#999]">
              Update your name and primary email address.
            </p>
          </div>

          {profileError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{profileError}</p>
            </div>
          )}
          {profileSuccess && (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[11px] font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>{profileSuccess}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#777]">Full name</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e5e5e5] bg-[#fcfcfc] px-3.5 focus-within:border-[#a5c422] focus-within:ring-1 focus-within:ring-[#a5c422]/30 transition shadow-inner">
              <User className="h-4 w-4 text-[#999]" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-10 w-full bg-transparent text-xs font-semibold text-[#333] outline-none"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#777]">Email address</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e5e5e5] bg-[#fcfcfc] px-3.5 focus-within:border-[#a5c422] focus-within:ring-1 focus-within:ring-[#a5c422]/30 transition shadow-inner">
              <Mail className="h-4 w-4 text-[#999]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full bg-transparent text-xs font-semibold text-[#333] outline-none"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a5c422] px-5 py-2 text-xs font-bold text-white shadow-md transition hover:bg-[#8aaa10] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {profileSubmitting ? (
               <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
               <Save className="h-3.5 w-3.5" />
            )}
            <span>{profileSubmitting ? 'Saving changes…' : 'Save changes'}</span>
          </button>
        </form>

        <form onSubmit={handlePasswordSubmit} className="card p-6 space-y-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#a5c422]" />
               <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
                Security Settings
              </p>
            </div>
            <p className="text-[11px] text-[#999]">
              Change your password and secure your account.
            </p>
          </div>

          {passwordError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-medium text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{passwordError}</p>
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-[11px] font-medium text-emerald-600">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>{passwordSuccess}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#777]">Current password</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e5e5e5] bg-[#fcfcfc] px-3.5 focus-within:border-[#a5c422] focus-within:ring-1 focus-within:ring-[#a5c422]/30 transition shadow-inner">
              <Lock className="h-4 w-4 text-[#999]" />
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-10 w-full bg-transparent text-xs font-semibold text-[#333] outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#777]">New password</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e5e5e5] bg-[#fcfcfc] px-3.5 focus-within:border-[#a5c422] focus-within:ring-1 focus-within:ring-[#a5c422]/30 transition shadow-inner">
              <Lock className="h-4 w-4 text-[#999]" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-10 w-full bg-transparent text-xs font-semibold text-[#333] outline-none"
                placeholder="New password (8+ chars)"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wide text-[#777]">Confirm new password</label>
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e5e5e5] bg-[#fcfcfc] px-3.5 focus-within:border-[#a5c422] focus-within:ring-1 focus-within:ring-[#a5c422]/30 transition shadow-inner">
              <Lock className="h-4 w-4 text-[#999]" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 w-full bg-transparent text-xs font-semibold text-[#333] outline-none"
                placeholder="Confirm password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white border border-[#e5e5e5] px-5 py-2 text-xs font-bold text-[#555] shadow-sm transition hover:bg-[#f9f9f9] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {passwordSubmitting ? (
               <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#eee] border-t-[#777]" />
            ) : (
               <Lock className="h-3.5 w-3.5" />
            )}
            <span>{passwordSubmitting ? 'Updating…' : 'Update password'}</span>
          </button>
        </form>
      </section>
    </div>
  );
};
