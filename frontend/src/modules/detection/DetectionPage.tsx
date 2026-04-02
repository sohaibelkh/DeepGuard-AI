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
  reliability_score?: number;
  is_reliable?: boolean;
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
  'Atrial Fibrillation': '#a5c422',
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
      <div className="h-48 w-full rounded-xl border border-[#e5e5e5] bg-white shadow-sm overflow-hidden p-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={signalData} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="index" stroke="#999" fontSize={11} />
            <YAxis stroke="#999" fontSize={11} />
            <Tooltip
              contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: 8 }}
              labelStyle={{ fontSize: 11, color: '#333' }}
            />
            <Line type="monotone" dataKey="value" stroke="#a5c422" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }, [signalData]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f7d4] ring-1 ring-[#a5c422]/20">
            <Activity className="h-5 w-5 text-[#a5c422]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-base font-semibold tracking-tight text-[#333]">ECG Diagnosis</h1>
            <p className="text-xs text-[#999]">
              Upload ECG data, select a model, and run AI-powered cardiac diagnosis.
            </p>
          </div>
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left column: upload + model selector */}
        <section className="space-y-4">
          <div className="card p-5 space-y-4">
            <UploadArea disabled={submitting} file={file} error={error} onFileSelected={handleFileSelected} />

            {/* Model selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium uppercase tracking-wide text-[#999]">
                Model
              </label>
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="dg-input pr-10"
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
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#999]" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 text-xs text-[#999]">
              <p className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-[#999]" />
                <span>Results stored in your history with full explainability.</span>
              </p>
              <button
                type="button"
                disabled={!file || submitting}
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#a5c422] px-5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#8aaa10] disabled:cursor-not-allowed disabled:bg-[#ddd]"
              >
                {submitting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#999]">
              Signal Preview
            </p>
            {previewChart}
            {!file && (
              <div className="flex h-32 items-center justify-center rounded-xl border border-[#e5e5e5] bg-white p-4 text-xs text-[#999]">
                <p>Upload an ECG file to see the signal preview.</p>
              </div>
            )}
          </div>
        </section>

        {/* Right column: results */}
        <section className="space-y-4">
          {!result && !submitting && (
            <div className="flex h-48 items-center justify-center rounded-xl border border-[#e5e5e5] bg-white p-4 text-xs text-[#999]">
              <p>Results will appear here after diagnosis.</p>
            </div>
          )}

          {result && (
            <>
              {/* Prediction card */}
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#999]">
                    Diagnosis Result
                  </p>
                  {result.is_reliable === false && (
                    <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-0.5 text-[10px] font-bold text-red-500 ring-1 ring-red-200">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      LOW RELIABILITY
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-bold" style={{ color: CLASS_COLORS[result.prediction] || '#333' }}>
                        {result.prediction}
                      </p>
                    </div>
                    <p className="text-xs text-[#999]">
                      Model: {result.model_used} · {result.processing_time_ms.toFixed(0)}ms
                    </p>
                  </div>
                  <div className="flex gap-8 text-right">
                    <div className="space-y-0.5">
                      <p className="text-2xl font-bold text-[#333]">
                        {Math.round(result.confidence * 100)}%
                      </p>
                      <p className="text-[11px] text-[#999]">Confidence</p>
                    </div>
                    {result.reliability_score !== undefined && (
                      <div className="space-y-0.5">
                        <p className={`text-2xl font-bold ${result.is_reliable ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {Math.round(result.reliability_score * 100)}%
                        </p>
                        <p className="text-[11px] text-[#999]">Reliability</p>
                      </div>
                    )}
                  </div>
                </div>
                {result.is_reliable === false && (
                  <p className="pt-1 text-[10px] italic text-red-400">
                    * Low clinical reliability detected. The signal may be too noisy or the pattern is highly uncertain. Manual cardiologist review is recommended.
                  </p>
                )}
              </div>

              {/* Per-class confidence bars */}
              {classProbs.length > 0 && (
                <div className="card p-5 space-y-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#999]">
                    Class Probabilities
                  </p>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={classProbs} layout="vertical" margin={{ left: 90, right: 10, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                        <XAxis type="number" stroke="#999" fontSize={10} domain={[0, 100]} unit="%" />
                        <YAxis type="category" dataKey="label" stroke="#555" fontSize={10} width={85} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e5e5', borderRadius: 8 }}
                          formatter={(v: number) => [`${v.toFixed(1)}%`, 'Probability']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {classProbs.map((entry) => (
                            <Cell key={entry.label} fill={CLASS_COLORS[entry.label] || '#999'} />
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
