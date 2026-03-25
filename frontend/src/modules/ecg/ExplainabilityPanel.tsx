import React from 'react';
import { BarChart3, Sparkles } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface Feature {
  name: string;
  importance: number;
  value: number;
}

interface Region {
  start: number;
  end: number;
  importance: number;
  label?: string;
}

interface Explanation {
  method: string;
  model_name: string;
  features?: Feature[];
  regions?: Region[];
  heatmap?: number[];
  summary: string;
}

interface Props {
  explanation: Explanation | null;
  loading?: boolean;
}

export const ExplainabilityPanel: React.FC<Props> = ({ explanation, loading }) => {
  if (loading) {
    return (
      <div className="card space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Explainability
          </p>
        </div>
        <div className="flex h-32 items-center justify-center text-xs text-slate-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
          <span className="ml-2">Generating explanation…</span>
        </div>
      </div>
    );
  }

  if (!explanation) return null;

  const isFeatureBased = explanation.method === 'feature_importance';

  return (
    <div className="card space-y-4 p-4">
      <header className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-400" />
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          AI Explainability — {explanation.model_name}
        </p>
      </header>

      {/* Summary text */}
      <p className="rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-300 leading-relaxed">
        {explanation.summary}
      </p>

      {isFeatureBased && explanation.features && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Feature Importance
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={explanation.features.slice(0, 10)}
                layout="vertical"
                margin={{ left: 80, right: 10, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis type="number" stroke="#64748b" fontSize={10} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1f2937',
                    borderRadius: 8,
                  }}
                  labelStyle={{ fontSize: 11, color: '#e5e7eb' }}
                  formatter={(value: number) => [
                    `${(value * 100).toFixed(1)}%`,
                    'Importance',
                  ]}
                />
                <Bar dataKey="importance" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!isFeatureBased && explanation.heatmap && (
        <div className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            Signal Region Importance Heatmap
          </p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={explanation.heatmap.map((v, i) => ({ i, importance: v }))}
                margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="i" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} domain={[0, 1]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1f2937',
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="importance"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  fill="#f59e0b"
                  fillOpacity={0.1}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {explanation.regions && (
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Key Regions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {explanation.regions.slice(0, 6).map((r, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-900/40 bg-amber-950/30 px-2 py-0.5 text-[11px] text-amber-300"
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{
                        backgroundColor: `rgba(245, 158, 11, ${r.importance})`,
                      }}
                    />
                    {r.label || `Region ${r.start}-${r.end}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
