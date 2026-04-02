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
  }, [status]);

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
    disconnected: 'text-[#999]',
    connecting: 'text-amber-500',
    connected: 'text-emerald-500',
    done: 'text-[#a5c422]',
  };

  const statusLabels: Record<ConnStatus, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting…',
    connected: 'Live Streaming',
    done: 'Stream Complete',
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f7d4] ring-1 ring-[#a5c422]/20">
            <Radio className="h-5 w-5 text-[#a5c422]" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-sm font-bold tracking-tight text-[#333]">
              Live ECG Monitor
            </h1>
            <p className="text-xs text-[#999]">
              Simulated real-time ECG signal streaming via WebSocket.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white border border-[#e5e5e5] px-4 py-2 rounded-xl shadow-sm">
          <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${statusColors[status]}`}>
            {status === 'connected' ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span>{statusLabels[status]}</span>
          </div>
          {status === 'connected' ? (
            <button
              onClick={disconnect}
              className="rounded-lg border border-red-100 bg-red-50 px-4 py-1.5 text-xs font-bold text-red-500 transition hover:bg-red-100 shadow-sm"
            >
              Stop
            </button>
          ) : (
            <button
              onClick={connect}
              className="rounded-lg bg-[#a5c422] px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:bg-[#8aaa10]"
            >
              Start Stream
            </button>
          )}
        </div>
      </header>

      {/* Stats row */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5 space-y-3">
          <p className="metric-label">Heart Rate</p>
          <div className="flex items-center gap-3">
            <Heart className={`h-6 w-6 ${status === 'connected' ? 'animate-pulse text-red-500' : 'text-[#999]'}`} />
            <p className="text-3xl font-bold text-[#333]">
              {heartRate > 0 ? `${Math.round(heartRate)}` : '—'}
            </p>
            <span className="text-xs font-bold text-[#999] bg-[#f9f9f9] px-2 py-0.5 rounded-full">BPM</span>
          </div>
        </div>
        <div className="card p-5 space-y-3">
          <p className="metric-label">Samples Received</p>
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-[#a5c422]" />
            <p className="text-3xl font-bold text-[#333]">{data.length > 0 ? data[data.length - 1].index : 0}</p>
          </div>
        </div>
        <div className="card p-5 space-y-3">
          <p className="metric-label">Stream Progress</p>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-[#333]">{progress.toFixed(1)}%</p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f0f0f0]">
              <div
                className="h-full rounded-full bg-[#a5c422] transition-all duration-300 shadow-sm"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Live ECG Chart */}
      <section className="card p-5 space-y-4">
        <header className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#a5c422]" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#555]">
            ECG Signal
          </p>
          {status === 'connected' && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-200">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              LIVE FEED
            </span>
          )}
        </header>
        <div className="h-80 w-full bg-[#fcfcfc] border border-[#f0f0f0] rounded-xl overflow-hidden p-2">
          {data.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-[#999] italic">
              <p>Press "Start Stream" to begin real-time ECG visualization.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="index" stroke="#999" fontSize={10} tickCount={6} />
                <YAxis stroke="#999" fontSize={10} domain={['auto', 'auto']} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#a5c422"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="card p-5 text-xs text-[#777] leading-relaxed bg-white/50 border-dashed border-[#e5e5e5]">
        <p>
          <strong className="text-[#333]">How it works:</strong> The backend splits a stored
          ECG recording into small chunks and streams them via WebSocket at ~100ms intervals,
          simulating a real-time ECG monitor feed from a physical sensor. The chart displays a
          sliding window of the latest {MAX_VISIBLE} data points.
        </p>
      </section>
    </div>
  );
};
