import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  FileText,
  History,
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

  const handleDownloadReport = async (recordId: number) => {
    try {
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
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f7d4] ring-1 ring-[#a5c422]/20">
            <History className="h-5 w-5 text-[#a5c422]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold tracking-tight text-[#333]">
              Analysis History
            </h1>
            <p className="text-xs text-[#999]">
              Review past ECG analyses and predictions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-[#777] bg-white border border-[#e5e5e5] px-3 py-1.5 rounded-full shadow-sm">
          <Clock className="h-3.5 w-3.5 text-[#a5c422]" />
          <span>{total.toLocaleString()} Analyses</span>
        </div>
      </header>

      <section className="card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="inline-flex items-center gap-2 rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] px-3 py-1.5">
            <Filter className="h-3.5 w-3.5 text-[#777]" />
            <span className="text-[11px] font-bold uppercase tracking-wide text-[#999]">
              Filters
            </span>
          </div>

          <select
            value={predictionFilter}
            onChange={(e) => {
              setPage(1);
              setPredictionFilter(e.target.value);
            }}
            className="dg-input w-40"
          >
            <option value="all">All Predictions</option>
            {PREDICTION_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 px-3 py-1 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg">
            <span className="text-[11px] font-bold text-[#999] uppercase">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setPage(1);
                setStartDate(e.target.value);
              }}
              className="bg-transparent text-xs text-[#333] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg">
            <span className="text-[11px] font-bold text-[#999] uppercase">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setPage(1);
                setEndDate(e.target.value);
              }}
              className="bg-transparent text-xs text-[#333] outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="ml-auto rounded-lg border border-[#e5e5e5] bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#a5c422] shadow-sm transition hover:bg-[#f0f7d4]"
          >
            Reset Filters
          </button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#e5e5e5] shadow-sm">
          <table className="min-w-full divide-y divide-[#e5e5e5] text-xs">
            <thead className="bg-[#f9f9f9]">
              <tr>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#999]"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {sortKey === 'created_at' && (
                       <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#999]">
                  ECG File
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#999]">
                  Prediction
                </th>
                <th
                  className="cursor-pointer px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-[#999]"
                  onClick={() => handleSort('confidence')}
                >
                  <div className="flex items-center gap-1.5">
                    <span>Confidence</span>
                    {sortKey === 'confidence' && (
                       <span className="text-[10px]">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-[#999]">
                  Report
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5] bg-white">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-xs text-[#999]"
                  >
                    <div className="flex items-center justify-center gap-2">
                       <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#eee] border-t-[#a5c422]" />
                       <span>Loading records…</span>
                    </div>
                  </td>
                </tr>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-xs text-[#999]"
                  >
                    No analyses match the current filters.
                  </td>
                </tr>
              ) : (
                sortedRows.map((row) => {
                  const confidencePct = Math.round(row.confidence * 100);
                  return (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-[#f9f9f9]"
                    >
                      <td className="px-4 py-3 text-[11px] text-[#555]">
                        {formatTimestamp(row.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f9f9f9] border border-[#e5e5e5]">
                            <FileText className="h-4 w-4 text-[#777]" />
                          </div>
                          <span className="text-[11px] font-semibold text-[#333]">
                            {row.file_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="inline-flex rounded-full bg-[#f0f7d4] px-3 py-0.5 text-[10px] font-bold text-[#a5c422] ring-1 ring-[#a5c422]/20">
                          {row.prediction}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-[11px] font-bold text-[#333]">
                        {confidencePct}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDownloadReport(row.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#a5c422] px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-[#8ea31d]"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] text-red-600 font-medium">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] font-medium text-[#999]">
            Page {page} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#777] shadow-sm transition hover:bg-[#f9f9f9] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#777] shadow-sm transition hover:bg-[#f9f9f9] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
