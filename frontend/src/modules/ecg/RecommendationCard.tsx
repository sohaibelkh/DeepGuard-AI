import React from 'react';
import { AlertTriangle, CheckCircle, Stethoscope } from 'lucide-react';

interface Recommendation {
  urgency: string;
  urgency_level: number;
  title: string;
  summary: string;
  recommendations: string[];
  follow_up: string;
  confidence_note: string;
  confidence?: number;
  disclaimer: string;
}

interface Props {
  recommendation: Recommendation | null;
}

export const RecommendationCard: React.FC<Props> = ({ recommendation }) => {
  if (!recommendation) return null;

  const urgencyConfig: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    routine: {
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-800/50',
      text: 'text-emerald-400',
      icon: <CheckCircle className="h-4 w-4 text-emerald-400" />,
    },
    moderate: {
      bg: 'bg-amber-950/30',
      border: 'border-amber-800/50',
      text: 'text-amber-400',
      icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
    },
    urgent: {
      bg: 'bg-red-950/30',
      border: 'border-red-800/50',
      text: 'text-red-400',
      icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
    },
  };

  const cfg = urgencyConfig[recommendation.urgency] || urgencyConfig.moderate;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 space-y-3`}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-sky-400" />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Medical Recommendation
          </p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
          {cfg.icon}
          <span className="capitalize">{recommendation.urgency}</span>
        </div>
      </header>

      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-1">
          {recommendation.title}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {recommendation.summary}
        </p>
      </div>

      {recommendation.confidence_note && (
        <p className="text-[11px] text-slate-400 italic">
          {recommendation.confidence_note}
        </p>
      )}

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
          Recommendations
        </p>
        <ul className="space-y-1">
          {recommendation.recommendations.map((rec, i) => (
            <li key={i} className="flex gap-2 text-xs text-slate-300">
              <span className="mt-0.5 text-slate-500">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-slate-800/50 bg-slate-950/40 p-2.5">
        <p className="text-[11px] text-slate-400">
          <strong className="text-slate-300">Follow-up:</strong> {recommendation.follow_up}
        </p>
      </div>

      <p className="text-[10px] text-slate-500 leading-relaxed">
        {recommendation.disclaimer}
      </p>
    </div>
  );
};
