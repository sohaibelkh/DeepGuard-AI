import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, ShieldCheck } from 'lucide-react';
import { AuthShell } from '../../components/layout/AuthShell';
import { TextField } from '../../components/forms/TextField';
import { useAuth } from './AuthContext';

interface LocationState {
  from?: { pathname: string };
}

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | undefined;

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!identifier.trim()) newErrors.identifier = 'Required';
    if (!password) newErrors.password = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      const redirectTo = state?.from?.pathname ?? '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let message = 'Unable to sign in. Check your credentials.';
      
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0 && detail[0].msg) {
        message = detail[0].msg;
      }
      
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your email and password to access the ECG diagnosis console."
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <p>{formError}</p>
          </div>
        )}
        <TextField
          label="Email"
          icon={Mail}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          autoComplete="email"
          disabled={submitting}
          error={errors.identifier}
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={submitting}
          error={errors.password}
          placeholder="••••••••"
        />
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
            <span>Sessions are protected with short-lived tokens.</span>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border border-slate-900 border-t-slate-50" />
              Signing you in…
            </span>
          ) : (
            <>
              <span>Sign in</span>
            </>
          )}
        </button>
        <p className="pt-1 text-xs text-slate-500">
          No account yet?{' '}
          <Link
            to="/register"
            className="font-medium text-sky-400 underline-offset-2 hover:text-sky-300 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
};

