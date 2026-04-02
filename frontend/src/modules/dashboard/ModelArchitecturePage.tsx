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
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f7d4] ring-1 ring-[#a5c422]/20">
            <Cpu className="h-5 w-5 text-[#a5c422]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold tracking-tight text-[#333]">
              Model Architecture
            </h1>
            <p className="text-xs text-[#999]">
              Deep learning pipeline for ECG time-series classification.
            </p>
          </div>
        </div>
      </header>

      <section className="card p-6 space-y-5">
        <header className="flex items-center gap-2">
           <Layers className="h-4 w-4 text-[#a5c422]" />
           <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
            Diagnostic Pipeline
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-3">
          {STEPS.map((step, i) => (
            <React.Fragment key={step}>
              <div className="rounded-xl border border-[#e5e5e5] bg-[#fdfdfd] px-4 py-2.5 text-xs font-bold text-[#333] shadow-sm ring-1 ring-inset ring-[#eee]">
                {step}
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-[#ccc]" />
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#f0f7d4]">
               <Layers className="h-4 w-4 text-[#a5c422]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
              CNN Feature Extraction
            </p>
          </div>
          <p className="text-xs text-[#777] leading-relaxed">
            1D convolutions capture local patterns in the ECG signal (e.g. QRS complex,
            P and T waves) without hand-crafted features. Filters learn discriminative
            motifs across the time axis, acting as a feature extractor before the
            sequential layer.
          </p>
        </div>
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#f0f7d4]">
               <Layers className="h-4 w-4 text-[#a5c422]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
              LSTM Temporal Dependency
            </p>
          </div>
          <p className="text-xs text-[#777] leading-relaxed">
            ECG is a time-series; the order of events matters. LSTM layers model long-range
            dependencies and temporal context, so the model can use rhythm and sequence
            information (e.g. RR intervals, recurring patterns) for classification.
          </p>
        </div>
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#f0f7d4]">
               <Layers className="h-4 w-4 text-[#a5c422]" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
              Softmax Probability
            </p>
          </div>
          <p className="text-xs text-[#777] leading-relaxed">
            The task is multi-class (e.g. Normal, Arrhythmia, Atrial Fibrillation, etc.).
            A dense layer projects to one logit per class; softmax converts these to
            probabilities that sum to 1, giving a clear confidence score per class.
          </p>
        </div>
      </section>
    </div>
  );
};
