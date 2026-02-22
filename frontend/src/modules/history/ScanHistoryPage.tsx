import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  FileText,
  Shield
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';

const PREDICTION_OPTIONS = [
  'Normal',
  'Arrhythmia',
  'Atrial Fibrillation',
  'Myocardial Infarction',
  'Tachycardia',
  'Bradycardia'
];

interface AnalysisRow {
  id: number;
  file_name: string;
  prediction: string;
  confidence: number;
  created_at: string;
}

interface AnalysisHistoryResponse {
  items: AnalysisRow[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

type SortKey = 'created_at' | 'confidence';
type SortDir = 'asc' | 'desc';

export const ScanHistoryPage: React.FC = () => {
  const [rows, setRows] = useState<AnalysisRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [predictionFilter, setPredictionFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    const fetchAnalyses = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, string | number> = {
          page,
          page_size: pageSize
        };
        if (predictionFilter !== 'all') {
          params.prediction = predictionFilter;
        }
        if (startDate) params.start = startDate;
        if (endDate) params.end = endDate;
        const response = await apiClient.get<AnalysisHistoryResponse>(
          '/history/analyses',
          { params }
        );
        setRows(response.data.items);
        setTotalPages(response.data.total_pages || 1);
        setTotal(response.data.total || 0);
      } catch (err: any) {
        const msg =
          err?.response?.data?.message ??
          'Unable to load analysis history. Please refresh or adjust filters.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    void fetchAnalyses();
  }, [predictionFilter, startDate, endDate, page, pageSize]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      if (sortKey === 'created_at') {
        const da = new Date(a.created_at).getTime();
        const db = new Date(b.created_at).getTime();
        return sortDir === 'asc' ? da - db : db - da;
      }
      if (sortKey === 'confidence') {
        return sortDir === 'asc'
          ? a.confidence - b.confidence
          : b.confidence - a.confidence;
      }
      return 0;
    });
    return copy;
  }, [rows, sortKey, sortDir]);

  const formatTimestamp = (value: string) =>
    new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

  const handleResetFilters = () => {
    setPredictionFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Shield className="h-4 w-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-semibold tracking-tight text-slate-50">
              Analysis history
            </h1>
            <p className="text-xs text-slate-400">
              Review past ECG analyses and predictions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Clock className="h-3.5 w-3.5" />
          <span>{total.toLocaleString()} analyses</span>
        </div>
      </header>

      <section className="card space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              Filters
            </span>
          </div>

          <select
            value={predictionFilter}
            onChange={(e) => {
              setPage(1);
              setPredictionFilter(e.target.value);
            }}
            className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">All predictions</option>
            {PREDICTION_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPage(1);
                setStartDate(e.target.value);
              }}
              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPage(1);
                setEndDate(e.target.value);
              }}
              className="rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="ml-auto rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 shadow-sm transition hover:border-slate-600 hover:bg-slate-900"
          >
            Reset
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950/80">
              <tr>
                <th
                  className="cursor-pointer px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500"
                  onClick={() => handleSort('created_at')}
                >
                  Date
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  ECG file
                </th>
                <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Prediction
                </th>
                <th
                  className="cursor-pointer px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-slate-500"
                  onClick={() => handleSort('confidence')}
                >
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/60">
              {loading && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-xs text-slate-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && sortedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-xs text-slate-500"
                  >
                    No analyses match the current filters.
                  </td>
                </tr>
              )}
              {!loading &&
                sortedRows.map((row) => {
                  const confidencePct = Math.round(row.confidence * 100);
                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-slate-900/80"
                    >
                      <td className="px-3 py-2 text-[11px] text-slate-300">
                        {formatTimestamp(row.created_at)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 ring-1 ring-slate-800">
                            <FileText className="h-3.5 w-3.5 text-slate-400" />
                          </div>
                          <span className="text-[11px] font-medium text-slate-100">
                            {row.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span className="inline-flex rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-200">
                          {row.prediction}
                        </span>
                      </td>
                      <td className="px-3 py-2 align-middle text-[11px] text-slate-100">
                        {confidencePct}%
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-900/70 bg-red-950/40 px-3 py-2 text-[11px] text-red-100">
            <AlertTriangle className="h-3.5 w-3.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
          <span>
            Page {page} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 shadow-sm transition hover:border-slate-600 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="mr-1 h-3 w-3" />
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-[11px] text-slate-300 shadow-sm transition hover:border-slate-600 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="ml-1 h-3 w-3" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
