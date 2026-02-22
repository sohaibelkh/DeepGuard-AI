import React from 'react';
import { ShieldHalf, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../theme/ThemeProvider';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="relative hidden w-[420px] flex-col justify-between border-r border-slate-800 bg-slate-950/80 px-10 py-10 lg:flex">
        <div>
          <Link to="/" className="flex items-center gap-2 text-slate-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
              <ShieldHalf className="h-5 w-5 text-sky-400" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">ECG Cardiac AI</span>
              <span className="text-[11px] text-slate-400">Cardiac Diagnosis Platform</span>
            </div>
          </Link>
          <div className="mt-14 space-y-4">
            <h1 className="text-2xl font-semibold text-slate-50">
              Intelligent ECG-based cardiac diagnosis.
            </h1>
            <p className="text-sm leading-relaxed text-slate-400">
              Sign in to upload ECG time-series data, run deep learning analysis, and review
              prediction history and model performance.
            </p>
          </div>
        </div>
        <div className="space-y-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>Advanced deep learning for time-series cardiac signal analysis.</span>
          </div>
          <p className="text-[11px] text-slate-600">
            Sessions are protected with short-lived access tokens.
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <Link to="/" className="flex items-center gap-2 text-slate-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
                <ShieldHalf className="h-4 w-4 text-sky-400" />
              </div>
              <span className="text-sm font-semibold tracking-tight">ECG Cardiac AI</span>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-300 shadow-sm transition hover:border-slate-500 hover:bg-slate-900"
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          <div className="mb-6 space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-slate-50">{title}</h2>
            <p className="text-sm text-slate-400">{subtitle}</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-6 shadow-subtle">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

