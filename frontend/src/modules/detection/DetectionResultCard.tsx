import React from 'react';
import { Shield, Activity, Clock, ChevronRight } from 'lucide-react';

interface DetectionResultCardProps {
  prediction: string;
  confidence: number;
  model: string;
  timestamp: string;
  onClick?: () => void;
}

export const DetectionResultCard: React.FC<DetectionResultCardProps> = ({
  prediction,
  confidence,
  model,
  timestamp,
  onClick
}) => {
  const getProgressColor = (val: number) => {
    if (val > 0.85) return 'bg-[#a5c422]';
    if (val > 0.6) return 'bg-amber-400';
    return 'bg-red-400';
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <div
      onClick={onClick}
      className={`card relative flex cursor-pointer flex-col p-4 transition-all hover:bg-[#f9f9f9] group overflow-hidden ${
        onClick ? 'active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f7d4] ring-1 ring-[#a5c422]/20">
            <Shield className="h-3.5 w-3.5 text-[#a5c422]" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#999]">
             Latest Result
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#999]">
          <Clock className="h-3 w-3" />
          <span>{formatTime(timestamp)}</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-lg font-bold text-[#333] leading-tight group-hover:text-[#a5c422] transition-colors">{prediction}</p>
          <p className="text-[10px] font-medium text-[#777]">
            Model: <span className="text-[#a5c422]">{model}</span>
          </p>
        </div>
        <div className="text-right flex flex-col items-end gap-1.5">
           <div className="flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-[#a5c422]" />
              <p className="text-base font-black text-[#333]">
                {Math.round(confidence * 100)}%
              </p>
           </div>
           {/* Mini progress bar */}
           <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[#f0f0f0] shadow-inner">
             <div
               className={`h-full rounded-full transition-all duration-500 ${getProgressColor(confidence)} shadow-sm`}
               style={{ width: `${Math.round(confidence * 100)}%` }}
             />
           </div>
        </div>
      </div>

      <div className="absolute top-1/2 -right-1 translate-y-[-50%] p-2 opacity-0 group-hover:opacity-100 group-hover:right-2 transition-all">
         <ChevronRight className="h-4 w-4 text-[#a5c422]" />
      </div>
    </div>
  );
};
