import React from 'react';
import {
  HeartPulse,
  Stethoscope,
  Activity,
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';

interface Recommendation {
  urgency: string;
  urgency_level: number;
  title: string;
  summary: string;
  recommendations: string[];
  follow_up: string;
  confidence_note?: string;
  disclaimer?: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation
}) => {
  if (!recommendation) return null;

  const urgencyColors: Record<string, string> = {
    routine: 'text-emerald-500 bg-emerald-50 ring-emerald-200',
    moderate: 'text-amber-500 bg-amber-50 ring-amber-200',
    urgent: 'text-red-500 bg-red-50 ring-red-200',
    unknown: 'text-slate-500 bg-slate-50 ring-slate-200'
  };

  const urgencyLabel = recommendation.urgency?.toUpperCase() || 'UNKNOWN';

  return (
    <div className="card p-5 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-[#a5c422]" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
            Clinical Decision Support
          </p>
        </div>
        <div className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tighter ring-1 ${urgencyColors[recommendation.urgency] || urgencyColors.unknown}`}>
           {urgencyLabel} Priority
        </div>
      </header>

      <section className="space-y-4">
        {recommendation.summary && (
          <div className="rounded-xl border border-[#f0f7d4] bg-[#f0f7d4]/20 p-4 text-xs font-medium text-[#555] leading-relaxed shadow-inner">
            <div className="flex items-center gap-2 mb-1.5">
               <Info className="h-3.5 w-3.5 text-[#a5c422]" />
               <p className="text-[10px] font-bold uppercase tracking-tight text-[#a5c422]">Summary</p>
            </div>
            {recommendation.summary}
          </div>
        )}

        {(recommendation.recommendations?.length ?? 0) > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#999]">
               <Activity className="h-3 w-3" />
               <span>Medical Recommendations</span>
            </div>
            <ul className="space-y-1.5 pl-5">
              {recommendation.recommendations.map((item, i) => (
                <li key={i} className="relative text-[11px] font-medium text-[#333] leading-relaxed">
                  <span className="absolute -left-4 top-1.5 h-1 w-1 rounded-full bg-[#a5c422]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendation.follow_up && (
          <div className="space-y-2">
             <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-[#999]">
               <HeartPulse className="h-3 w-3" />
               <span>Recommended Follow-up</span>
            </div>
            <div className="flex items-start gap-2 rounded-lg border border-[#f0f0f0] bg-[#fcfcfc] p-3 text-[11px] font-semibold text-[#555]">
              <ChevronRight className="h-4 w-4 shrink-0 text-[#a5c422]" />
              {recommendation.follow_up}
            </div>
          </div>
        )}
      </section>

      {recommendation.confidence_note && (
        <p className="text-[10px] text-[#999] italic italic border-t border-[#f0f0f0] pt-3">
          Note: {recommendation.confidence_note}
        </p>
      )}

      <footer>
         <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[10px] italic text-amber-700 font-medium shadow-sm">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            <p>
              {recommendation.disclaimer || "AI-generated clinical support only. Not a medical prescription. Always consult a certified cardiologist."}
            </p>
         </div>
      </footer>
    </div>
  );
};
