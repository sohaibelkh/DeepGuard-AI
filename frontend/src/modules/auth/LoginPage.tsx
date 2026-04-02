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
      title="Sign in to CardioAI"
      subtitle="Access the ECG cardiac diagnosis console with your credentials."
    >
      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="form-error">
            <AlertCircle />
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
        <div className="auth-security-note">
          <ShieldCheck />
          <span>Sessions are protected with short-lived tokens.</span>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="auth-submit-btn"
        >
          {submitting ? (
            <>
              <span className="spinner-small" />
              Signing you in…
            </>
          ) : (
            <span>Sign in</span>
          )}
        </button>
        <p className="auth-hint">
          No account yet?{' '}
          <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
};
