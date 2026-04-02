import React from 'react';
import { Shield, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutPublicPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/login" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Shield className="h-4 w-4 text-[#a5c422]" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">DeepGuard AI</p>
            <p className="text-[10px] text-slate-500">Deepfake Threat Intelligence</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-xs text-slate-300">
          <Link to="/about" className="hover:text-slate-50">
            About
          </Link>
          <Link to="/mission" className="hover:text-slate-50">
            Our mission
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-100 shadow-sm hover:border-slate-500 hover:bg-slate-900"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a5c422]">
              About DeepGuard
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              A detection surface designed for security and fraud teams.
            </h1>
            <p className="max-w-xl text-sm text-slate-300">
              DeepGuard AI gives SOC analysts, fraud investigators, and trust &amp; safety teams a
              dedicated console to inspect high‑risk media, detect deepfake manipulation, and
              operationalize response playbooks across their organisation.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Built for security
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Role-aware access controls and audit‑ready telemetry for every investigation.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Model transparency
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Confidence scoring, timelines and frame‑level context to support human review.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Operational focus
                </p>
                <p className="mt-1 text-xs text-slate-300">
                  Triage queues and history views that fit directly into your existing workflows.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#a5c422]" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Why teams choose DeepGuard
              </p>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#8aaa10]" />
                <p>
                  <span className="font-medium text-slate-100">Signal quality:</span> Per‑frame
                  deepfake scores and temporal aggregation designed for casework.
                </p>
              </li>
              <li className="flex gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#8aaa10]" />
                <p>
                  <span className="font-medium text-slate-100">Analyst experience:</span> Minimal,
                  low‑noise UI that keeps investigators focused on evidence, not tooling.
                </p>
              </li>
              <li className="flex gap-2">
                <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[#8aaa10]" />
                <p>
                  <span className="font-medium text-slate-100">Enterprise posture:</span> Designed
                  to plug into existing identity, logging and compliance controls.
                </p>
              </li>
            </ul>
          </div>
        </section>

        <section className="flex flex-col items-start gap-4 rounded-xl border border-slate-800 bg-slate-950/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Ready when you are
            </p>
            <p className="text-sm text-slate-200">
              Start in minutes with analyst accounts, then grow into full case management.
            </p>
          </div>
          <div className="flex gap-2 text-xs">
            <Link
              to="/login"
              className="rounded-lg bg-[#a5c422] px-3 py-1.5 font-medium text-slate-950 shadow-sm hover:bg-[#8aaa10]"
            >
              Open analyst console
            </Link>
            <Link
              to="/mission"
              className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-1.5 text-slate-200 hover:border-slate-500 hover:bg-slate-900"
            >
              Learn about our mission
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

