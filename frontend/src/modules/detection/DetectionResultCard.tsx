import React from 'react';
import { CheckCircle, Shield } from 'lucide-react';

export type PredictionLabel =
  | 'Normal'
  | 'Arrhythmia'
  | 'Atrial Fibrillation'
  | 'Myocardial Infarction'
  | 'Tachycardia'
  | 'Bradycardia';

export interface DetectionResult {
  prediction: PredictionLabel;
  confidence: number;
}

interface DetectionResultCardProps {
  result: DetectionResult;
}

export const DetectionResultCard: React.FC<DetectionResultCardProps> = ({ result }) => {
  const confidencePct = Math.round(result.confidence * 100);
  const isNormal = result.prediction === 'Normal';
  const statusColor = isNormal ? 'text-emerald-400' : 'text-amber-400';
  const statusBg = isNormal
    ? 'bg-emerald-950/40 border-emerald-900/70'
    : 'bg-amber-950/40 border-amber-900/70';

  return (
    <section className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-5 shadow-subtle transition">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Shield className="h-4 w-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Diagnosis result
            </p>
            <p className="text-sm text-slate-300">ECG analysis</p>
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusBg}`}
        >
          <CheckCircle className={`h-3.5 w-3.5 ${statusColor}`} />
          <span className={statusColor}>{result.prediction}</span>
        </div>
      </header>

      <div className="grid gap-4 text-xs text-slate-300 sm:grid-cols-2">
        <div className="space-y-1 rounded-lg bg-slate-900/70 p-3">
          <p className="metric-label">Prediction</p>
          <p className="flex items-center gap-1.5 text-sm font-medium text-slate-50">
            <span>{result.prediction}</span>
          </p>
        </div>

        <div className="space-y-1 rounded-lg bg-slate-900/70 p-3">
          <p className="metric-label">Model confidence</p>
          <p className="flex items-baseline gap-1 text-sm font-semibold text-slate-50">
            <span>{confidencePct}%</span>
            <span className="text-[11px] font-normal text-slate-400">
              probability for this class
            </span>
          </p>
        </div>
      </div>
    </section>
  );
};
