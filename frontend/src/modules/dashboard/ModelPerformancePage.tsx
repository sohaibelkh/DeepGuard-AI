import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  Shield,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiClient } from '../../lib/apiClient';

interface ModelMetrics {
  model_name: string;
  display_name: string;
  model_type: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  confusion_matrix: string | null;
  roc_data: string | null;
  per_class_metrics: string | null;
  training_samples: number | null;
  test_samples: number | null;
}

const MODEL_COLORS: Record<string, string> = {
  svm: '#f97316',
  random_forest: '#22c55e',
  knn: '#eab308',
  cnn: '#38bdf8',
  lstm: '#a855f7',
  hybrid_cnn_lstm: '#06b6d4',
};

const ECG_CLASSES = [
  'Normal', 'Arrhythmia', 'Atrial Fib.', 'Myocard. Inf.', 'Tachycardia', 'Bradycardia',
];

export const ModelPerformancePage: React.FC = () => {
  const [models, setModels] = useState<ModelMetrics[]>([]);
  const [selected, setSelected] = useState<string>('hybrid_cnn_lstm');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<{ models: ModelMetrics[] }>('/models/performance');
        setModels(res.data.models);
      } catch {
        setModels([]);
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const selectedModel = models.find((m) => m.model_name === selected) || models[0];

  const cm: number[][] = selectedModel?.confusion_matrix
    ? JSON.parse(selectedModel.confusion_matrix)
    : [];
  const rocData: { fpr: number; tpr: number }[] = selectedModel?.roc_data
    ? JSON.parse(selectedModel.roc_data)
    : [];
  const maxVal = cm.length > 0 ? Math.max(...cm.flat()) : 1;

  // Comparison bar chart data
  const comparisonMetrics = ['accuracy', 'precision', 'recall', 'f1_score'] as const;
  const comparisonData = comparisonMetrics.map((metric) => {
    const entry: any = { metric: metric === 'f1_score' ? 'F1' : metric.charAt(0).toUpperCase() + metric.slice(1) };
    models.forEach((m) => {
      entry[m.display_name] = Math.round((m[metric] || 0) * 1000) / 10;
    });
    return entry;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-500">
        Loading model metrics…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <LineChartIcon className="h-4 w-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-semibold tracking-tight text-slate-50">
              Model Performance
            </h1>
            <p className="text-xs text-slate-400">
              Evaluation metrics, ROC curves, confusion matrix, and model comparison.
            </p>
          </div>
        </div>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="h-8 appearance-none rounded-md border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none focus:border-sky-500"
        >
          {models.map((m) => (
            <option key={m.model_name} value={m.model_name}>
              {m.display_name}
            </option>
          ))}
        </select>
      </header>

      {/* Metric cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card space-y-3 p-4">
          <p className="metric-label">Accuracy</p>
          <p className="metric-value">{selectedModel ? Math.round(selectedModel.accuracy * 1000) / 10 : 0}%</p>
          <p className="text-[11px] text-slate-400">Overall correct predictions</p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="metric-label">Precision</p>
          <p className="metric-value">{selectedModel ? Math.round(selectedModel.precision * 1000) / 10 : 0}%</p>
          <p className="text-[11px] text-slate-400">Positive prediction quality</p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="metric-label">Recall</p>
          <p className="metric-value">{selectedModel ? Math.round(selectedModel.recall * 1000) / 10 : 0}%</p>
          <p className="text-[11px] text-slate-400">Sensitivity (critical for medical)</p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="metric-label">F1-Score</p>
          <p className="metric-value">{selectedModel ? Math.round(selectedModel.f1_score * 1000) / 10 : 0}%</p>
          <p className="text-[11px] text-slate-400">Harmonic mean of P and R</p>
        </div>
      </section>

      {/* ROC + Confusion Matrix */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-4 p-4">
          <header className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-400" />
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              ROC Curve — {selectedModel?.display_name}
            </p>
          </header>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="fpr"
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => (v * 100).toFixed(0) + '%'}
                />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickFormatter={(v) => (v * 100).toFixed(0) + '%'}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', borderRadius: 8 }}
                  formatter={(v: number) => [(v * 100).toFixed(1) + '%', '']}
                  labelFormatter={(l) => 'FPR: ' + (Number(l) * 100).toFixed(1) + '%'}
                />
                <Line type="monotone" dataKey="tpr" stroke="#38bdf8" strokeWidth={2} dot={false} name="TPR" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card space-y-4 p-4">
          <header className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4 text-sky-400" />
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Confusion Matrix — {selectedModel?.display_name}
            </p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  <th className="border border-slate-700 bg-slate-900/80 p-1.5 text-slate-400">Pred \ True</th>
                  {ECG_CLASSES.map((c) => (
                    <th key={c} className="border border-slate-700 bg-slate-900/80 p-1.5 text-slate-400">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cm.map((row, i) => (
                  <tr key={i}>
                    <td className="border border-slate-700 bg-slate-900/60 p-1.5 font-medium text-slate-300">
                      {ECG_CLASSES[i]}
                    </td>
                    {row.map((cell, j) => {
                      const intensity = maxVal > 0 ? cell / maxVal : 0;
                      const bg =
                        i === j
                          ? intensity > 0.3
                            ? 'bg-sky-900/60'
                            : 'bg-sky-950/40'
                          : intensity > 0.1
                            ? 'bg-red-950/40'
                            : 'bg-slate-800/40';
                      return (
                        <td key={j} className={`border border-slate-700 p-1.5 text-center text-slate-200 ${bg}`}>
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Model Comparison */}
      <section className="card space-y-4 p-4">
        <header className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-sky-400" />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Model Comparison
          </p>
        </header>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="metric" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', borderRadius: 8 }}
                labelStyle={{ fontSize: 11, color: '#e5e7eb' }}
              />
              {models.map((m) => (
                <Bar
                  key={m.model_name}
                  dataKey={m.display_name}
                  fill={MODEL_COLORS[m.model_name] || '#64748b'}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2">
          {models.map((m) => (
            <span
              key={m.model_name}
              className="inline-flex items-center gap-1.5 text-[11px] text-slate-400"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: MODEL_COLORS[m.model_name] || '#64748b' }}
              />
              {m.display_name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};
