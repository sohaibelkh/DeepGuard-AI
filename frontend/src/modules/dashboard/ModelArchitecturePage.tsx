import React from 'react';
import { ArrowRight, Cpu, Layers } from 'lucide-react';

const STEPS = [
  'ECG Signal',
  'Preprocessing',
  'Normalization',
  'Segmentation',
  '1D CNN',
  'LSTM',
  'Dense Layer',
  'Softmax Output'
];

export const ModelArchitecturePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Cpu className="h-4 w-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-semibold tracking-tight text-slate-50">
              Model architecture
            </h1>
            <p className="text-xs text-slate-400">
              Deep learning pipeline for ECG time-series classification.
            </p>
          </div>
        </div>
      </header>

      <section className="card space-y-4 p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Pipeline
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-medium text-slate-200">
                {step}
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-500" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Why CNN for feature extraction
            </p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            1D convolutions capture local patterns in the ECG signal (e.g. QRS complex,
            P and T waves) without hand-crafted features. Filters learn discriminative
            motifs across the time axis, acting as a feature extractor before the
            sequential layer.
          </p>
        </div>
        <div className="card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Why LSTM for time dependency
            </p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            ECG is a time-series; the order of events matters. LSTM layers model long-range
            dependencies and temporal context, so the model can use rhythm and sequence
            information (e.g. RR intervals, recurring patterns) for classification.
          </p>
        </div>
        <div className="card space-y-3 p-4">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Why softmax for classification
            </p>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            The task is multi-class (e.g. Normal, Arrhythmia, Atrial Fibrillation, etc.).
            A dense layer projects to one logit per class; softmax converts these to
            probabilities that sum to 1, giving a clear confidence score per class.
          </p>
        </div>
      </section>
    </div>
  );
};
