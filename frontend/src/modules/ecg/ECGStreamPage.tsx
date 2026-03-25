import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Heart, Radio, Wifi, WifiOff } from 'lucide-react';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

interface ECGPoint {
  index: number;
  value: number;
}

type ConnStatus = 'disconnected' | 'connecting' | 'connected' | 'done';

export const ECGStreamPage: React.FC = () => {
  const [status, setStatus] = useState<ConnStatus>('disconnected');
  const [data, setData] = useState<ECGPoint[]>([]);
  const [heartRate, setHeartRate] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const MAX_VISIBLE = 600;

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatus('connecting');
    setData([]);
    setHeartRate(0);
    setProgress(0);

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${window.location.host}/api/ws/ecg-stream`);

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === 'ecg_data') {
        const newPoints: ECGPoint[] = msg.data.map((v: number, i: number) => ({
          index: msg.index + i,
          value: v,
        }));
        setData((prev) => {
          const merged = [...prev, ...newPoints];
          return merged.slice(-MAX_VISIBLE);
        });
        setHeartRate(msg.heart_rate || 0);
        setProgress(msg.progress || 0);
      } else if (msg.type === 'stream_end') {
        setStatus('done');
      }
    };

    ws.onerror = () => setStatus('disconnected');
    ws.onclose = () => {
      if (status !== 'done') setStatus('disconnected');
    };

    wsRef.current = ws;
  }, []);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('disconnected');
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const statusColors: Record<ConnStatus, string> = {
    disconnected: 'text-slate-500',
    connecting: 'text-amber-400',
    connected: 'text-emerald-400',
    done: 'text-sky-400',
  };

  const statusLabels: Record<ConnStatus, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting…',
    connected: 'Live Streaming',
    done: 'Stream Complete',
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 ring-1 ring-slate-700">
            <Radio className="h-4 w-4 text-sky-400" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-semibold tracking-tight text-slate-50">
              Live ECG Monitor
            </h1>
            <p className="text-xs text-slate-400">
              Simulated real-time ECG signal streaming via WebSocket.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${statusColors[status]}`}>
            {status === 'connected' ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            <span>{statusLabels[status]}</span>
          </div>
          {status === 'connected' ? (
            <button
              onClick={disconnect}
              className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-900/60"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={connect}
              className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950 shadow-sm transition hover:bg-sky-400"
            >
              Start Stream
            </button>
          )}
        </div>
      </header>

      {/* Stats row */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card space-y-2 p-4">
          <p className="metric-label">Heart Rate</p>
          <div className="flex items-center gap-2">
            <Heart className={`h-5 w-5 ${status === 'connected' ? 'animate-pulse text-red-400' : 'text-slate-500'}`} />
            <p className="metric-value">
              {heartRate > 0 ? `${Math.round(heartRate)}` : '—'}
            </p>
            <span className="text-xs text-slate-400">BPM</span>
          </div>
        </div>
        <div className="card space-y-2 p-4">
          <p className="metric-label">Samples Received</p>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-sky-400" />
            <p className="metric-value">{data.length > 0 ? data[data.length - 1].index : 0}</p>
          </div>
        </div>
        <div className="card space-y-2 p-4">
          <p className="metric-label">Stream Progress</p>
          <div className="space-y-2">
            <p className="metric-value">{progress.toFixed(1)}%</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-sky-500 transition-all duration-300"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Live ECG Chart */}
      <section className="card space-y-3 p-4">
        <header className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-sky-400" />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            ECG Signal
          </p>
          {status === 'connected' && (
            <span className="ml-auto flex items-center gap-1 text-[11px] text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              LIVE
            </span>
          )}
        </header>
        <div className="h-72 w-full">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-lg border border-slate-800 bg-slate-950/40 text-xs text-slate-500">
              <p>Press "Start Stream" to begin real-time ECG visualization.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="index" stroke="#64748b" fontSize={10} tickCount={6} />
                <YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22d3ee"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="card p-4 text-xs text-slate-400">
        <p>
          <strong className="text-slate-300">How it works:</strong> The backend splits a stored
          ECG recording into small chunks and streams them via WebSocket at ~100ms intervals,
          simulating a real-time ECG monitor feed from a physical sensor. The chart displays a
          sliding window of the latest {MAX_VISIBLE} data points.
        </p>
      </section>
    </div>
  );
};
