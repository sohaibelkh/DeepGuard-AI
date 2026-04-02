import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Lock, Mail, User } from 'lucide-react';
import { AuthShell } from '../../components/layout/AuthShell';
import { TextField } from '../../components/forms/TextField';
import { useAuth } from './AuthContext';

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
}

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const newErrors: FieldErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Required';
    if (!email.trim()) newErrors.email = 'Required';
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Required';
    if (password && password.length < 8)
      newErrors.password = 'Use at least 8 characters.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      let message = 'Unable to create your account. Please try again.';
      
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
      title="Create your CardioAI account"
      subtitle="Register to access the ECG cardiac diagnosis platform."
    >
      <form onSubmit={handleSubmit} noValidate>
        {formError && (
          <div className="form-error">
            <AlertCircle />
            <p>{formError}</p>
          </div>
        )}
        <TextField
          label="Full name"
          icon={User}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          disabled={submitting}
          error={errors.fullName}
          placeholder="Dr. Jean Dupont"
        />
        <TextField
          label="Email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={submitting}
          error={errors.email}
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          type="password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          disabled={submitting}
          error={errors.password}
          placeholder="At least 8 characters"
        />
        <button
          type="submit"
          disabled={submitting}
          className="auth-submit-btn"
        >
          {submitting ? (
            <>
              <span className="spinner-small" />
              Creating account…
            </>
          ) : (
            <span>Create account</span>
          )}
        </button>
        <p className="auth-hint">
          Already registered?{' '}
          <Link to="/login">Return to sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
};
