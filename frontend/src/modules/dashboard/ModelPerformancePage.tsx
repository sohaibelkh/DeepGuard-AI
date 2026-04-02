import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  LineChart as LineChartIcon,
  Shield,
  ChevronDown
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
  cnn: '#a5c422',
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
      <div className="card p-12 flex flex-col items-center justify-center gap-3 text-[#999]">
         <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#eee] border-t-[#a5c422]" />
         <p className="text-xs font-medium">Loading model metrics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f7d4] ring-1 ring-[#a5c422]/20">
            <LineChartIcon className="h-5 w-5 text-[#a5c422]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold tracking-tight text-[#333]">
              Model Performance
            </h1>
            <p className="text-xs text-[#999]">
              Evaluation metrics, ROC curves, confusion matrix, and model comparison.
            </p>
          </div>
        </div>
        <div className="relative">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="dg-input w-48 pr-10"
          >
            {models.map((m) => (
              <option key={m.model_name} value={m.model_name}>
                {m.display_name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#999]" />
        </div>
      </header>

      {/* Metric cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5 space-y-3">
          <p className="metric-label">Accuracy</p>
          <p className="metric-value">{selectedModel ? Math.round(selectedModel.accuracy * 1000) / 10 : 0}%</p>
          <p className="text-[11px] text-[#999]">Overall correct predictions</p>
        </div>
        <div className="card p-5 space-y-3">
          <p className="metric-label">Precision</p>
          <p className="metric-value">{selectedModel ? Math.round(selectedModel.precision * 1000) / 10 : 0}%</p>
          <p className="text-[11px] text-[#999]">Positive prediction quality</p>
        </div>
        <div className="card p-5 space-y-3">
          <p className="metric-label">Recall</p>
          <p className="metric-value">{selectedModel ? Math.round(selectedModel.recall * 1000) / 10 : 0}%</p>
          <p className="text-[11px] text-[#999]">Sensitivity (critical for medical)</p>
        </div>
        <div className="card p-5 space-y-3">
          <p className="metric-label">F1-Score</p>
          <p className="metric-value">{selectedModel ? Math.round(selectedModel.f1_score * 1000) / 10 : 0}%</p>
          <p className="text-[11px] text-[#999]">Harmonic mean of P and R</p>
        </div>
      </section>

      {/* ROC + Confusion Matrix */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5 space-y-4">
          <header className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#a5c422]" />
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
              ROC Curve — {selectedModel?.display_name}
            </p>
          </header>
          <div className="h-72 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl overflow-hidden p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis
                  dataKey="fpr"
                  stroke="#999"
                  fontSize={11}
                  tickFormatter={(v) => (v * 100).toFixed(0) + '%'}
                />
                <YAxis
                  stroke="#999"
                  fontSize={11}
                  tickFormatter={(v) => (v * 100).toFixed(0) + '%'}
                  domain={[0, 1]}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: 8 }}
                  formatter={(v: number) => [(v * 100).toFixed(1) + '%', 'TPR']}
                  labelFormatter={(l) => 'FPR: ' + (Number(l) * 100).toFixed(1) + '%'}
                />
                <Line type="monotone" dataKey="tpr" stroke="#a5c422" strokeWidth={3} dot={false} name="TPR" />
                <Line type="step" dataKey="fpr" stroke="#ddd" strokeDasharray="5 5" strokeWidth={1} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <header className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#a5c422]" />
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
              Confusion Matrix — {selectedModel?.display_name}
            </p>
          </header>
          <div className="overflow-x-auto rounded-xl border border-[#e5e5e5]">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#f9f9f9]">
                  <th className="border-b border-r border-[#e5e5e5] p-2.5 text-[#999] font-bold uppercase">Pred \ True</th>
                  {ECG_CLASSES.map((c) => (
                    <th key={c} className="border-b border-r border-[#e5e5e5] p-2.5 text-[#999] font-bold uppercase">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {cm.map((row, i) => (
                  <tr key={i}>
                    <td className="border-b border-r border-[#e5e5e5] bg-[#fdfdfd] p-2.5 font-bold text-[#555]">
                      {ECG_CLASSES[i]}
                    </td>
                    {row.map((cell, j) => {
                      const intensity = maxVal > 0 ? cell / maxVal : 0;
                      const bg =
                        i === j
                          ? intensity > 0.3
                            ? 'bg-[#f0f7d4]'
                            : 'bg-[#fafdcf]'
                          : intensity > 0.1
                            ? 'bg-red-50'
                            : 'bg-white';
                      const text = i === j ? 'text-[#a5c422] font-bold' : 'text-[#777]';
                      return (
                        <td key={j} className={`border-b border-r border-[#e5e5e5] p-2.5 text-center ${bg} ${text}`}>
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
      <section className="card p-5 space-y-4">
        <header className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-[#a5c422]" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
            Model Metrics Comparison
          </p>
        </header>
        <div className="h-72 bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl overflow-hidden p-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ left: -10, right: 10, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
              <XAxis dataKey="metric" stroke="#999" fontSize={11} />
              <YAxis stroke="#999" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: 8 }}
                labelStyle={{ fontSize: 11, color: '#333' }}
              />
              {models.map((m) => (
                <Bar
                  key={m.model_name}
                  dataKey={m.display_name}
                  fill={MODEL_COLORS[m.model_name] || '#999'}
                  radius={[4, 4, 0, 0]}
                  barSize={selected === m.model_name ? 36 : 24}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          {models.map((m) => (
            <span
              key={m.model_name}
              className="inline-flex items-center gap-2 text-[11px] font-medium text-[#777] bg-white border border-[#e5e5e5] px-3 py-1 rounded-full shadow-sm"
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: MODEL_COLORS[m.model_name] || '#999' }}
              />
              {m.display_name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};
