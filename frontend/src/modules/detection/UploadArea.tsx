import React, { useRef } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadAreaProps {
  onFileSelected: (file: File) => void;
  file: File | null;
  error?: string | null;
  disabled?: boolean;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileSelected,
  file,
  error,
  disabled
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) onFileSelected(droppedFile);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) onFileSelected(selectedFile);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#ddd] bg-[#fcfcfc] px-6 py-10 text-center text-sm text-[#777] transition hover:border-[#a5c422] hover:bg-[#f0f7d4]/30 shadow-inner ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${file ? 'border-[#a5c422] bg-[#f0f7d4]/10' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".csv,.txt"
          onChange={handleChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full transition shadow-sm ${
            file ? 'bg-[#a5c422] text-white' : 'bg-[#f0f0f0] text-[#999] group-hover:bg-[#a5c422] group-hover:text-white'
          }`}>
            {file ? <CheckCircle2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
          </div>
          
          <div className="space-y-1">
            {file ? (
              <>
                <p className="text-[13px] font-bold text-[#333]">{file.name}</p>
                <p className="text-[11px] font-medium text-[#a5c422]">
                  {(file.size / 1024).toFixed(1)} KB · Ready for analysis
                </p>
              </>
            ) : (
               <>
                <p className="text-[13px] font-bold text-[#333]">
                   Drop your ECG signal file here
                </p>
                <p className="text-[11px] font-medium text-[#999]">
                   Supports .csv and .txt formats
                </p>
               </>
            )}
          </div>

          {!file && (
             <div className="mt-2 rounded-lg bg-white border border-[#e5e5e5] px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#777] shadow-sm transition group-hover:border-[#a5c422] group-hover:text-[#a5c422]">
                Select File
             </div>
          )}
        </div>

        {file && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // In reality, you'd reset the file in the parent
              // But for this UI component, we show the state
            }}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white border border-[#e5e5e5] text-[#999] hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition shadow-sm"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] font-bold text-red-600 shadow-sm animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
