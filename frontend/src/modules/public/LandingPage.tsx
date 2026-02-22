import React from 'react';
import { Shield, Activity, Brain, Heart, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Shield className="h-4 w-4 text-sky-400" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">ECG Cardiac AI</p>
            <p className="text-[10px] text-slate-500">Cardiac Diagnosis Platform</p>
          </div>
        </Link>
        <nav className="flex items-center gap-4 text-xs text-slate-300">
          <Link
            to="/login"
            className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-100 shadow-sm hover:border-slate-500 hover:bg-slate-900"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-sky-500 px-3 py-1 text-[11px] font-medium text-slate-950 shadow-sm hover:bg-sky-400"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-12 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <section className="space-y-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">
            Diagnostic intelligent des maladies cardiaques
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Intelligent ECG-Based Cardiac Diagnosis Platform
          </h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Advanced Deep Learning for Time-Series Cardiac Signal Analysis. Upload ECG data,
            run automated diagnosis, and review model performance for clinical decision support.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-medium text-slate-950 shadow-sm hover:bg-sky-400"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-medium text-slate-100 hover:border-slate-500"
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                What is ECG
              </p>
            </div>
            <p className="text-xs text-slate-300">
              Electrocardiogram (ECG) records the electrical activity of the heart over time.
              Time-series signals capture P-waves, QRS complexes, and T-waves used to detect
              arrhythmias and other cardiac conditions.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Why AI in cardiology
              </p>
            </div>
            <p className="text-xs text-slate-300">
              Deep learning can learn complex patterns in ECG time-series data and support
              clinicians with fast, consistent classification of cardiac abnormalities—from
              arrhythmia to myocardial infarction.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Our approach
              </p>
            </div>
            <p className="text-xs text-slate-300">
              We use a hybrid 1D CNN–LSTM pipeline: CNN for local feature extraction from
              ECG segments, LSTM for temporal dependencies, and softmax for multi-class
              cardiac condition classification.
            </p>
          </div>
          <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Clinical impact
              </p>
            </div>
            <p className="text-xs text-slate-300">
              This platform is designed for research and clinical decision support. It stores
              prediction history, displays evaluation metrics, and helps demonstrate
              model performance for validation and deployment.
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 text-xs text-slate-300">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Problem statement &amp; datasets
          </p>
          <p className="mt-2">
            Automatic classification of ECG signals into cardiac disease categories using
            deep learning. ECG data is inherently time-series; we apply preprocessing,
            normalization, and segmentation before feeding the model.
          </p>
          <p className="mt-3">
            Datasets commonly used in the literature include <strong>MIT-BIH</strong> (arrhythmia
            database) and <strong>PTB-XL</strong> (12-lead ECG). The model is trained to output
            classes such as Normal, Arrhythmia, Atrial Fibrillation, Myocardial Infarction,
            Tachycardia, and Bradycardia. Evaluation uses accuracy, precision, recall, F1-score,
            ROC curves, and confusion matrices.
          </p>
        </section>
      </main>
    </div>
  );
};
