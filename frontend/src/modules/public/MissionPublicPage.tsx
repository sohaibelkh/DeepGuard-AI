import React from 'react';
import { Shield, Target, Globe2, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MissionPublicPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/login" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Shield className="h-4 w-4 text-sky-400" />
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

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <section className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">
            Our mission
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Make synthetic media abuse observable, measurable, and actionable.
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Deepfake content is no longer a novelty problem. It&apos;s a live signal in fraud,
            social engineering, and reputation attacks. DeepGuard AI exists to give defenders the
            same level of visibility and tooling around deepfakes that they already expect for
            network, endpoint, and identity threats.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Precision over volume
              </p>
            </div>
            <p className="text-xs text-slate-300">
              We focus on high‑fidelity signals analysts can trust, not generic &quot;AI
              detection&quot; scores.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Human‑centered workflows
              </p>
            </div>
            <p className="text-xs text-slate-300">
              Detection is only useful when it feeds real investigations, hand‑offs, and takedown
              actions.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Partnership with defenders
              </p>
            </div>
            <p className="text-xs text-slate-300">
              We build with early‑stage SOC and fraud teams to keep the product grounded in real
              cases, not demos.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 text-xs text-slate-300">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            How DeepGuard fits
          </p>
          <p className="mt-2">
            Our goal isn&apos;t to replace your existing security stack. It&apos;s to add a missing
            dimension: media integrity. By treating deepfakes as a first‑class signal next to
            identity, device, and network telemetry, organisations can spot synthetic abuse early
            and respond with confidence.
          </p>
          <p className="mt-3">
            Whether you&apos;re defending a marketplace, financial services, or a public brand,
            DeepGuard gives your teams one place to triage, investigate and report on deepfake
            activity.
          </p>
        </section>
      </main>
    </div>
  );
};

