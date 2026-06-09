'use client';

import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export interface UploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

interface UploadProgressListProps {
  uploads: UploadProgress[];
  onRemove?: (index: number) => void;
}

export function UploadProgressList({ uploads, onRemove }: UploadProgressListProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-bold text-text-dark mb-2">
        Enviando arquivos ({uploads.filter((u) => u.status === 'uploading').length}/{uploads.length}
        )
      </h3>
      {uploads.map((upload, index) => (
        <div
          key={`${upload.file.name}-${index}`}
          className="bg-panel-bg border border-border rounded-lg p-3 animate-slideUp"
        >
          <div className="flex items-center gap-3">
            {/* Status Icon */}
            <div className="shrink-0">
              {upload.status === 'uploading' && (
                <Loader2 className="w-5 h-5 text-brand-main animate-spin" />
              )}
              {upload.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              {upload.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
            </div>

            {/* File Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-dark truncate">{upload.file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-border/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      upload.status === 'success'
                        ? 'bg-green-500'
                        : upload.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-brand-main'
                    }`}
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
                <span className="text-xs text-text-light font-medium">{upload.progress}%</span>
              </div>
              {upload.error && <p className="text-xs text-red-500 mt-1">{upload.error}</p>}
            </div>

            {/* Remove Button */}
            {onRemove && upload.status !== 'uploading' && (
              <button
                onClick={() => onRemove(index)}
                className="text-text-light hover:text-red-500 transition-colors"
                title="Remover"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
