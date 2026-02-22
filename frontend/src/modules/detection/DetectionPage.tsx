import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Activity, Shield } from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { apiClient } from '../../lib/apiClient';
import { UploadArea } from './UploadArea';
import { DetectionResult, DetectionResultCard } from './DetectionResultCard';

interface AnalysisResponse {
  prediction: string;
  confidence: number;
  id?: number;
  created_at?: string;
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

export const DetectionPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [signalData, setSignalData] = useState<{ index: number; value: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

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
    const maxBytes = 20 * 1024 * 1024;
      // if (selected.size > maxBytes) {
      //   return 'File exceeds 20 MB limit.';
      // }
    return null;
  };

  const handleFileSelected = (selected: File) => {
    setError(null);
    const validationError = validateFile(selected);
    if (validationError) {
      setFile(null);
      setResult(null);
      setError(validationError);
      return;
    }
    setFile(selected);
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!file || submitting) return;
    setError(null);
    setSubmitting(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post<AnalysisResponse>('/analysis', formData);
      const data = response.data;
      setResult({
        prediction: data.prediction as DetectionResult['prediction'],
        confidence: data.confidence
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        'Unable to complete analysis. Please verify the file and try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const previewChart = useMemo(() => {
    if (signalData.length === 0) return null;
    return (
      <div className="h-48 w-full rounded-lg border border-slate-800 bg-slate-950/60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={signalData}
            margin={{ left: -20, right: 10, top: 5, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="index" stroke="#64748b" fontSize={11} />
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
              dataKey="value"
              stroke="#38bdf8"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }, [signalData]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-4xl">
        <header className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
              <Shield className="h-4 w-4 text-sky-400" />
            </div>
            <div className="space-y-0.5">
              <h1 className="text-base font-semibold tracking-tight">ECG diagnosis</h1>
              <p className="text-xs text-slate-400">
                Upload ECG time-series data (CSV or TXT) and run deep learning analysis.
              </p>
            </div>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Activity className="h-4 w-4 text-slate-400" />
          </div>
        </header>

        <main className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)]">
          <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/70 p-5 shadow-subtle">
            <UploadArea
              disabled={submitting}
              file={file}
              error={error}
              onFileSelected={handleFileSelected}
            />
            <div className="flex items-center justify-between gap-3 pt-1 text-xs text-slate-500">
              <p className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                <span>Files are processed for diagnosis; results are stored in your history.</span>
              </p>
              <button
                type="button"
                disabled={!file || submitting}
                onClick={handleSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950 shadow-sm transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
              >
                {submitting ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-slate-900 border-t-slate-50" />
                    <span>Running diagnosis…</span>
                  </>
                ) : (
                  <span>Run diagnosis</span>
                )}
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              Signal preview
            </p>
            {previewChart}
            {!file && (
              <div className="flex h-32 items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500">
                <p>Upload an ECG file to see a signal preview and run diagnosis.</p>
              </div>
            )}
            {result && <DetectionResultCard result={result} />}
          </section>
        </main>
      </div>
    </div>
  );
};
