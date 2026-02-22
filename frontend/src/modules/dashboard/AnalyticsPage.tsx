import React, { useEffect, useState } from 'react';
import { Activity, BarChart3, PieChart as PieChartIcon, Shield } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { apiClient } from '../../lib/apiClient';

interface AnalyticsSummary {
  totals: {
    total_scans: number;
    image_scans: number;
    video_scans: number;
    fake_detections: number;
    real_detections: number;
    avg_confidence: number;
    avg_processing_ms: number;
  };
  by_type: { type: string; scans: number }[];
  by_prediction: { label: string; value: number }[];
  trend: { label: string; scans: number }[];
}

export const AnalyticsPage: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<AnalyticsSummary>('/analytics/summary');
        setSummary(res.data);
      } finally {
        setLoading(false);
      }
    };
    void fetchAnalytics();
  }, []);

  const totals = summary?.totals;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Shield className="h-4 w-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-semibold tracking-tight text-slate-50">
              Risk analytics
            </h1>
            <p className="text-xs text-slate-400">
              Explore deepfake detection activity across asset types and time windows.
            </p>
          </div>
        </div>
        {totals && (
          <p className="text-[11px] text-slate-500">
            {totals.total_scans.toLocaleString()} scans analysed
          </p>
        )}
      </header>

      {loading && (
        <div className="card p-4 text-xs text-slate-400">
          Fetching analytics for your workspace…
        </div>
      )}

      {!loading && (
        <>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
            <div className="card space-y-4 p-4">
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-sky-400" />
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Weekly scan trend
                  </p>
                </div>
              </header>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={summary?.trend ?? []}
                    margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#020617',
                        borderColor: '#1f2937',
                        borderRadius: 8
                      }}
                      labelStyle={{ fontSize: 11, color: '#e5e7eb' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="scans"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="card space-y-3 p-4">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-sky-400" />
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Real vs fake mix
                    </p>
                  </div>
                </header>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary?.by_prediction ?? []}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={38}
                        outerRadius={64}
                        paddingAngle={3}
                      >
                        {(summary?.by_prediction ?? []).map((entry) => (
                          <Cell
                            key={entry.label}
                            fill={entry.label === 'Fake' ? '#f97316' : '#22c55e'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#1f2937',
                          borderRadius: 8
                        }}
                        labelStyle={{ fontSize: 11, color: '#e5e7eb' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card space-y-3 p-4">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-sky-400" />
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Traffic by asset type
                    </p>
                  </div>
                </header>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summary?.by_type ?? []}
                      margin={{ left: -20, right: 10, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="type" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#1f2937',
                          borderRadius: 8
                        }}
                        labelStyle={{ fontSize: 11, color: '#e5e7eb' }}
                      />
                      <Bar dataKey="scans" radius={[4, 4, 0, 0]} fill="#38bdf8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

