import React, { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  FileText,
  Heart,
  LineChart as LineChartIcon,
  Radar
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Link } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';

interface AnalyticsSummary {
  totals: {
    total_analyses: number;
    last_diagnosis: string | null;
    last_diagnosis_at: string | null;
    model_accuracy: number;
    most_frequent_condition: string;
    avg_confidence: number;
    avg_processing_ms: number;
  };
  by_condition: { label: string; value: number }[];
  trend: { label: string; analyses: number }[];
  recent: {
    id: number;
    file_name: string;
    prediction: string;
    confidence: number;
    created_at: string;
  }[];
}

export const DashboardHome: React.FC = () => {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<AnalyticsSummary>('/analytics/summary');
        setSummary(res.data);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    void fetchAnalytics();
  }, []);

  const totals = summary?.totals;
  const avgConfidencePct = totals ? Math.round(totals.avg_confidence * 100) : 0;
  const accuracyPct = totals ? Math.round(totals.model_accuracy * 100) : 0;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

  const handleDownloadReport = async (recordId: number) => {
    try {
      // The API route is /api/report/{id}
      const response = await apiClient.get(`/report/${recordId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DeepGuard_Report_${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Failed to download report", err);
      alert("Désolé, impossible de télécharger le rapport. Vérifiez votre connexion.");
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <div className="card space-y-3 p-4">
          <p className="metric-label">Total ECG analyses</p>
          <p className="metric-value">
            {totals ? totals.total_analyses.toLocaleString() : '—'}
          </p>
          <p className="text-[11px] text-[#999]">
            All ECG files evaluated by the model.
          </p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="metric-label">Last diagnosis</p>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-[#a5c422]" />
            <p className="metric-value">
              {totals?.last_diagnosis ?? '—'}
            </p>
          </div>
          <p className="text-[11px] text-[#999]">
            {totals?.last_diagnosis_at
              ? formatDate(totals.last_diagnosis_at)
              : 'No analyses yet'}
          </p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="metric-label">Model accuracy</p>
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-[#a5c422]" />
            <p className="metric-value">{accuracyPct}%</p>
          </div>
          <p className="text-[11px] text-[#999]">
            Current reported model performance.
          </p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="metric-label">Most frequent condition</p>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#a5c422]" />
            <p className="metric-value">
              {totals?.most_frequent_condition ?? '—'}
            </p>
          </div>
          <p className="text-[11px] text-[#999]">
            Most detected across your analyses.
          </p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="card space-y-4 p-4">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#a5c422]" />
              <p className="text-xs font-medium uppercase tracking-wide text-[#555]">
                Weekly analysis trend
              </p>
            </div>
            <p className="text-[11px] text-[#999]">Last 7 days</p>
          </header>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={(summary?.trend ?? []).map((d) => ({ ...d, analyses: d.analyses }))}
                margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
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
                  dataKey="analyses"
                  stroke="#a5c422"
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
                <LineChartIcon className="h-4 w-4 text-[#a5c422]" />
                <p className="text-xs font-medium uppercase tracking-wide text-[#555]">
                  By condition
                </p>
              </div>
            </header>
            <div className="h-64 pb-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(summary?.by_condition ?? []).map(d => ({ ...d, label: d.label ?? 'Unanalyzed' }))}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={46}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {(summary?.by_condition ?? []).map((entry, i) => {
                      const colors = ['#22c55e', '#f97316', '#a5c422', '#a855f7', '#eab308', '#ef4444'];
                      return (
                        <Cell key={entry.label ?? 'Unanalyzed'} fill={colors[i % colors.length]} />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e5e5e5',
                      borderRadius: 8,
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: '#333' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={60}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', color: '#555', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card space-y-3 p-4">
            <header className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#a5c422]" />
                <p className="text-xs font-medium uppercase tracking-wide text-[#555]">
                  Average confidence
                </p>
              </div>
            </header>
            <p className="metric-value">{avgConfidencePct}%</p>
            <p className="text-[11px] text-[#999]">
              Mean model confidence across your analyses.
            </p>
          </div>
        </div>
      </section>

      <section className="card space-y-3 p-4">
        <header className="flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#555]">
            Recent activity
          </p>
        </header>
        <div className="overflow-hidden rounded-lg border border-[#e5e5e5]">
          <table className="min-w-full divide-y divide-[#e5e5e5] text-xs">
            <thead className="bg-[#f9f9f9]">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[#999]">
                  Date
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[#999]">
                  ECG file
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[#999]">
                  Prediction
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-[#999]">
                  Confidence
                </th>
                <th className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-wide text-[#999]">
                  Report
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5] bg-white">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[#999]">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && (!summary?.recent || summary.recent.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-[#999]">
                    No recent analyses.
                  </td>
                </tr>
              )}
              {!loading &&
                summary?.recent?.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-[#f5f5f5]">
                    <td className="px-3 py-2 text-[11px] text-[#555]">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-[#333] font-medium">{row.file_name}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          row.prediction === 'Normal'
                            ? 'bg-[#eafaea] text-[#16a34a]'
                            : 'bg-[#fef2f2] text-[#dc2626]'
                        }`}
                      >
                        {row.prediction}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-[#555]">
                      {Math.round(row.confidence * 100)}%
                    </td>
                    <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => handleDownloadReport(row.id)}
                      className="inline-flex items-center gap-1 rounded bg-[#a5c422] px-2 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#8ea31d]"
                    >
                      <FileText className="h-3 w-3" />
                      PDF
                    </button>
                  </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
