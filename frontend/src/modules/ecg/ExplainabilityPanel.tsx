import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Info, Sparkles } from 'lucide-react';

interface ExplainabilityPanelProps {
  explanation: any;
  loading: boolean;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({
  explanation,
  loading
}) => {
  if (loading) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center gap-3 text-[#999]">
         <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#eee] border-t-[#a5c422]" />
         <p className="text-xs font-medium">Generating AI explanation…</p>
      </div>
    );
  }

  if (!explanation) return null;

  // Transform SHAP/LIME style importance data for the chart
  const importanceData = explanation.feature_importance
    ? Object.entries(explanation.feature_importance)
        .map(([name, value]) => ({
          name,
          value: Math.abs(value as number),
          original: value as number
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)
    : [];

  return (
    <div className="card p-5 space-y-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#a5c422]" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
            AI Decision Support (Explainability)
          </p>
        </div>
        <div className="group relative">
          <Info className="h-3.5 w-3.5 text-[#ccc] cursor-help" />
          <div className="absolute right-0 top-6 z-10 w-48 scale-0 rounded-lg bg-[#333] p-2 text-[10px] text-white shadow-xl transition-all group-hover:scale-100">
            SHAP (SHapley Additive exPlanations) values indicating which signal segments
            most influenced the model's prediction.
          </div>
        </div>
      </header>

      {importanceData.length > 0 && (
        <div className="space-y-3">
          <p className="text-[10px] font-medium text-[#777]">
            Top signal segments contributing to this diagnosis:
          </p>
          <div className="h-48 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl overflow-hidden p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={importanceData}
                layout="vertical"
                margin={{ left: 50, right: 10, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#757575"
                  fontSize={10}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e5e5e5',
                    borderRadius: 8
                  }}
                  cursor={{ fill: '#f9f9f9' }}
                  formatter={(v: number) => [v.toFixed(4), 'Importance']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {importanceData.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={entry.original > 0 ? '#a5c422' : '#f97316'}
                      fillOpacity={1 - i * 0.08}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {explanation.summary && (
        <div className="rounded-xl border border-[#f0f7d4] bg-[#f0f7d4]/30 p-4 text-xs italic text-[#555] leading-relaxed shadow-inner">
          <p className="font-bold text-[#a5c422] not-italic mb-1 uppercase tracking-tight text-[10px]">Model Insight:</p>
          "{explanation.summary}"
        </div>
      )}
    </div>
  );
};
