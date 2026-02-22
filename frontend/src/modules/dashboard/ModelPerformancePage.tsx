import React from 'react';
import { LineChart as LineChartIcon, Shield } from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const MOCK_ROC = [
  { fpr: 0, tpr: 0 },
  { fpr: 0.05, tpr: 0.42 },
  { fpr: 0.1, tpr: 0.68 },
  { fpr: 0.15, tpr: 0.82 },
  { fpr: 0.2, tpr: 0.88 },
  { fpr: 0.25, tpr: 0.92 },
  { fpr: 0.3, tpr: 0.94 },
  { fpr: 0.4, tpr: 0.96 },
  { fpr: 0.5, tpr: 0.97 },
  { fpr: 0.6, tpr: 0.98 },
  { fpr: 0.7, tpr: 0.99 },
  { fpr: 0.8, tpr: 0.995 },
  { fpr: 0.9, tpr: 1 },
  { fpr: 1, tpr: 1 }
];

const CLASSES = [
  'Normal',
  'Arrhythmia',
  'Atrial Fib.',
  'Myocard. Inf.',
  'Tachycardia',
  'Bradycardia'
];

const MOCK_CM: number[][] = [
  [420, 8, 2, 1, 3, 2],
  [5, 185, 12, 4, 2, 1],
  [3, 10, 98, 5, 2, 0],
  [2, 4, 6, 72, 3, 2],
  [4, 2, 1, 2, 88, 1],
  [1, 2, 0, 1, 2, 65]
];

export const ModelPerformancePage: React.FC = () => {
  const maxVal = Math.max(...MOCK_CM.flat());

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <LineChartIcon className="h-4 w-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-semibold tracking-tight text-slate-50">
              Model performance
            </h1>
            <p className="text-xs text-slate-400">
              Evaluation metrics, ROC curve, and confusion matrix (mock data).
            </p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card space-y-3 p-4">
          <p className="metric-label">Accuracy</p>
          <p className="metric-value">94.2%</p>
          <p className="text-[11px] text-slate-400">Overall correct predictions</p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="metric-label">Precision</p>
          <p className="metric-value">92.8%</p>
          <p className="text-[11px] text-slate-400">Positive prediction quality</p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="metric-label">Recall</p>
          <p className="metric-value">91.5%</p>
          <p className="text-[11px] text-slate-400">Sensitivity per class</p>
        </div>
        <div className="card space-y-3 p-4">
          <p className="metric-label">F1-score</p>
          <p className="metric-value">92.1%</p>
          <p className="text-[11px] text-slate-400">Harmonic mean of P and R</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card space-y-4 p-4">
          <header className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-sky-400" />
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              ROC curve
            </p>
          </header>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={MOCK_ROC}
                margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
              >
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
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#1f2937',
                    borderRadius: 8
                  }}
                  formatter={(value: number) => [(value * 100).toFixed(1) + '%', '']}
                  labelFormatter={(label) => 'FPR: ' + (Number(label) * 100).toFixed(1) + '%'}
                />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  name="TPR"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-slate-500">
            True Positive Rate vs False Positive Rate (mock).
          </p>
        </div>

        <div className="card space-y-4 p-4">
          <header className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4 text-sky-400" />
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Confusion matrix (6 classes)
            </p>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr>
                  <th className="border border-slate-700 bg-slate-900/80 p-1.5 text-slate-400">
                    Pred \ True
                  </th>
                  {CLASSES.map((c) => (
                    <th
                      key={c}
                      className="border border-slate-700 bg-slate-900/80 p-1.5 text-slate-400"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_CM.map((row, i) => (
                  <tr key={i}>
                    <td className="border border-slate-700 bg-slate-900/60 p-1.5 font-medium text-slate-300">
                      {CLASSES[i]}
                    </td>
                    {row.map((cell, j) => {
                      const intensity = maxVal > 0 ? cell / maxVal : 0;
                      const bg =
                        intensity > 0.7
                          ? 'bg-sky-900/60'
                          : intensity > 0.4
                            ? 'bg-slate-700/60'
                            : 'bg-slate-800/40';
                      return (
                        <td
                          key={j}
                          className={`border border-slate-700 p-1.5 text-center text-slate-200 ${bg}`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500">
            Rows: predicted class. Columns: true class. Mock values for display.
          </p>
        </div>
      </section>
    </div>
  );
};
