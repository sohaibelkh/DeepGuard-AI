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
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f7d4] ring-1 ring-[#a5c422]/20">
            <PieChartIcon className="h-5 w-5 text-[#a5c422]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold tracking-tight text-[#333]">
              Diagnostic Analytics
            </h1>
            <p className="text-xs text-[#999]">
              Explore cardiac diagnostic activity across conditions and time windows.
            </p>
          </div>
        </div>
        {totals && (
          <div className="bg-white border border-[#e5e5e5] px-3 py-1.5 rounded-full shadow-sm">
             <p className="text-[11px] font-bold text-[#777]">
              {totals.total_scans.toLocaleString()} analyses processed
            </p>
          </div>
        )}
      </header>

      {loading && (
        <div className="card p-8 flex flex-col items-center justify-center gap-3 text-[#999]">
           <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#eee] border-t-[#a5c422]" />
           <p className="text-xs font-medium">Fetching analytics for your workspace…</p>
        </div>
      )}

      {!loading && (
        <>
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
            <div className="card p-5 space-y-4">
              <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#a5c422]" />
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
                    Weekly Diagnostic Trend
                  </p>
                </div>
                <p className="text-[10px] font-bold text-[#999] bg-[#f9f9f9] px-2 py-0.5 rounded-full">Last 7 days</p>
              </header>
              <div className="h-64 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl overflow-hidden p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={summary?.trend ?? []}
                    margin={{ left: -20, right: 10, top: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="label" stroke="#999" fontSize={11} />
                    <YAxis stroke="#999" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e5e5',
                        borderRadius: 8
                      }}
                      labelStyle={{ fontSize: 11, color: '#333' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="scans"
                      stroke="#a5c422"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#a5c422', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#8aaa10', stroke: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="card p-5 space-y-4">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#a5c422]" />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
                      Diagnosis Summary
                    </p>
                  </div>
                </header>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary?.by_prediction ?? []}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {(summary?.by_prediction ?? []).map((entry, i) => (
                          <Cell
                            key={entry.label}
                            fill={i === 0 ? '#a5c422' : '#f97316'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e5e5e5',
                          borderRadius: 8
                        }}
                        labelStyle={{ fontSize: 11, color: '#333' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card p-5 space-y-4">
                <header className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#a5c422]" />
                    <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
                       Traffic By Modality
                    </p>
                  </div>
                </header>
                <div className="h-36 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl overflow-hidden p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={summary?.by_type ?? []}
                      margin={{ left: -20, right: 10, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                      <XAxis dataKey="type" stroke="#999" fontSize={11} />
                      <YAxis stroke="#999" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderColor: '#e5e5e5',
                          borderRadius: 8
                        }}
                        labelStyle={{ fontSize: 11, color: '#333' }}
                      />
                      <Bar dataKey="scans" radius={[6, 6, 0, 0]} fill="#a5c422" barSize={32} />
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
