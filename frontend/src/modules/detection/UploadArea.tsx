import React, { DragEvent } from 'react';
import { Upload, Activity } from 'lucide-react';

interface UploadAreaProps {
  disabled: boolean;
  file: File | null;
  error: string | null;
  onFileSelected: (file: File) => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  disabled,
  file,
  error,
  onFileSelected
}) => {
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled) return;
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) {
      onFileSelected(droppedFile);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/50 px-6 py-7 text-center text-sm text-slate-300 transition hover:border-sky-500 hover:bg-slate-900/60"
      >
        <input
          type="file"
          accept=".csv,.txt"
          disabled={disabled}
          onChange={handleInputChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <div className="mb-3 flex items-center justify-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-700">
            <Upload className="h-4 w-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            <Activity className="h-3.5 w-3.5 text-slate-500" />
            <span>ECG upload</span>
          </div>
        </div>
        <p className="text-sm text-slate-100">Drop an ECG file or browse</p>
        <p className="mt-1 text-xs text-slate-500">
          Supported formats: CSV, TXT. Max 500 MB.
        </p>
        {file && (
          <p className="mt-3 text-xs text-sky-400">
            Ready to analyze: <span className="font-medium">{file.name}</span>
          </p>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
};
