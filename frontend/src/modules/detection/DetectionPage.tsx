import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Activity, Shield, ChevronDown } from 'lucide-react';
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
import { UploadArea } from './UploadArea';
import { ExplainabilityPanel } from '../ecg/ExplainabilityPanel';
import { RecommendationCard } from '../ecg/RecommendationCard';

interface PredictResponse {
  id: number;
  prediction: string;
  confidence: number;
  class_probabilities: Record<string, number>;
  model_used: string;
  processing_time_ms: number;
  recommendations: any;
  created_at: string;
}

interface ModelInfo {
  name: string;
  display_name: string;
  type: string;
  description: string;
}

function parseECGFile(content: string): { index: number; value: number }[] {
  const lines = content.trim().split(/\r?\n/).filter(Boolean);
  const points: { index: number; value: number }[] = [];
  let index = 0;
  const maxPoints = 1000;
  for (const line of lines) {
    if (index >= maxPoints) break;
    const parts = line.split(/[\s,;]+/).filter(Boolean);
    for (const part of parts) {
      const num = parseFloat(part);
      if (!Number.isNaN(num)) {
        points.push({ index, value: num });
        index += 1;
        if (index >= maxPoints) break;
      }
    }
  }
  return points;
}

const CLASS_COLORS: Record<string, string> = {
  'Normal': '#22c55e',
  'Arrhythmia': '#f97316',
  'Atrial Fibrillation': '#38bdf8',
  'Myocardial Infarction': '#ef4444',
  'Tachycardia': '#a855f7',
  'Bradycardia': '#eab308',
};

export const DetectionPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [signalData, setSignalData] = useState<{ index: number; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('hybrid_cnn_lstm');
  const [explanation, setExplanation] = useState<any>(null);
  const [loadingExplain, setLoadingExplain] = useState(false);

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await apiClient.get<{ models: ModelInfo[] }>('/models/list');
        setModels(res.data.models);
      } catch {
        // fallback
        setModels([]);
      }
    };
    void fetchModels();
  }, []);

  useEffect(() => {
    if (!file) {
      setSignalData([]);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = (reader.result as string) || '';
      setSignalData(parseECGFile(text));
    };
    reader.onerror = () => setSignalData([]);
    reader.readAsText(file);
  }, [file]);

  const validateFile = (selected: File): string | null => {
    const ext = selected.name.toLowerCase().split('.').pop() || '';
    if (!['csv', 'txt'].includes(ext)) {
      return 'Unsupported format. Use .csv or .txt.';
    }
    return null;
  };

  const handleFileSelected = (selected: File) => {
    setError(null);
    const validationError = validateFile(selected);
    if (validationError) {
      setFile(null);
      setResult(null);
      setExplanation(null);
      setError(validationError);
      return;
    }
    setFile(selected);
    setResult(null);
    setExplanation(null);
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    setError(null);
    setSubmitting(true);
    setResult(null);
    setExplanation(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post<PredictResponse>(
        `/predict?model_name=${selectedModel}`,
        formData
      );
      setResult(response.data);

      // Auto-fetch explainability
      if (response.data.id) {
        setLoadingExplain(true);
        try {
          const explainRes = await apiClient.get(`/explain/${response.data.id}`);
          setExplanation(explainRes.data.explanation);
        } catch {
          // Non-critical
        } finally {
          setLoadingExplain(false);
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ??
        'Unable to complete analysis. Please verify the file and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const classProbs = result?.class_probabilities
    ? Object.entries(result.class_probabilities)
        .map(([label, value]) => ({ label, value: Math.round(value * 10000) / 100 }))
        .sort((a, b) => b.value - a.value)
    : [];

  const previewChart = useMemo(() => {
    if (signalData.length === 0) return null;
    return (
      <div className="h-48 w-full rounded-lg border border-slate-800 bg-slate-950/60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={signalData} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="index" stroke="#64748b" fontSize={11} />
            <YAxis stroke="#64748b" fontSize={11} />
            <Tooltip
              contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', borderRadius: 8 }}
              labelStyle={{ fontSize: 11, color: '#e5e7eb' }}
            />
            <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }, [signalData]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Shield className="h-4 w-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-base font-semibold tracking-tight">ECG Diagnosis</h1>
            <p className="text-xs text-slate-400">
              Upload ECG data, select a model, and run AI-powered cardiac diagnosis.
            </p>
          </div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
          <Activity className="h-4 w-4 text-slate-400" />
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left column: upload + model selector */}
        <section className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5 shadow-subtle space-y-4">
            <UploadArea disabled={submitting} file={file} error={error} onFileSelected={handleFileSelected} />

            {/* Model selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Model
              </label>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="h-9 w-full appearance-none rounded-md border border-slate-700 bg-slate-950 pl-3 pr-8 text-xs text-slate-100 shadow-sm outline-none transition focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  {models.length > 0
                    ? models.map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.display_name} ({m.type === 'classical' ? 'ML' : 'DL'})
                        </option>
                      ))
                    : (
                      <>
                        <option value="hybrid_cnn_lstm">CNN + LSTM Hybrid (DL)</option>
                        <option value="cnn">1D CNN (DL)</option>
                        <option value="lstm">BiLSTM (DL)</option>
                        <option value="svm">SVM (ML)</option>
                        <option value="random_forest">Random Forest (ML)</option>
                        <option value="knn">KNN (ML)</option>
                      </>
                    )}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 text-xs text-slate-500">
              <p className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                <span>Results stored in your history with full explainability.</span>
              </p>
              <button
                type="button"
                disabled={!file || submitting}
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-xs font-medium text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {submitting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-slate-900 border-t-slate-50" />
                    <span>Analyzing…</span>
                  </>
                ) : (
                  <span>Run Diagnosis</span>
                )}
              </button>
            </div>
          </div>

          {/* Signal preview */}
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Signal Preview
            </p>
            {previewChart}
            {!file && (
              <div className="flex h-32 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
                <p>Upload an ECG file to see the signal preview.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right column: results */}
        <section className="space-y-4">
          {!result && !submitting && (
            <div className="flex h-48 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
              <p>Results will appear here after diagnosis.</p>
            </div>
          )}

          {result && (
            <>
              {/* Prediction card */}
              <div className="card space-y-3 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Diagnosis Result
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold" style={{ color: CLASS_COLORS[result.prediction] || '#e2e8f0' }}>
                      {result.prediction}
                    </p>
                    <p className="text-xs text-slate-400">
                      Model: {result.model_used} · {result.processing_time_ms.toFixed(0)}ms
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold text-slate-50">
                      {Math.round(result.confidence * 100)}%
                    </p>
                    <p className="text-[11px] text-slate-500">Confidence</p>
                  </div>
                </div>
              </div>

              {/* Per-class confidence bars */}
              {classProbs.length > 0 && (
                <div className="card space-y-3 p-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Class Probabilities
                  </p>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classProbs} layout="vertical" margin={{ left: 90, right: 10, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis type="number" stroke="#64748b" fontSize={10} domain={[0, 100]} unit="%" />
                        <YAxis type="category" dataKey="label" stroke="#64748b" fontSize={10} width={85} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#020617', borderColor: '#1f2937', borderRadius: 8 }}
                          formatter={(v: number) => [`${v.toFixed(1)}%`, 'Probability']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {classProbs.map((entry) => (
                            <Cell key={entry.label} fill={CLASS_COLORS[entry.label] || '#64748b'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Explainability */}
              <ExplainabilityPanel explanation={explanation} loading={loadingExplain} />

              {/* Recommendations */}
              <RecommendationCard recommendation={result.recommendations} />
            </>
          )}
        </section>
      </main>
    </div>
  );
};
