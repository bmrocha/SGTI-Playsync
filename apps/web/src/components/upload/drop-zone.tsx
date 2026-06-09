'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileVideo, FileImage, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DropZoneProps {
  onFilesAccepted: (files: File[]) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  multiple?: boolean;
  className?: string;
  activeClassName?: string;
  variant?: 'default' | 'mini';
  children?: React.ReactNode;
}

export function DropZone({
  onFilesAccepted,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
  },
  maxSize = 1024 * 1024 * 1024, // 1GB
  multiple = true,
  className,
  activeClassName,
  variant = 'default',
  children,
}: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesAccepted(acceptedFiles);
      }
    },
    [onFilesAccepted],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections: _fileRejections,
  } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`
                relative border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer
                ${className || ''}
                ${
                  isDragActive && !isDragReject
                    ? activeClassName || 'border-brand-main bg-brand-main/10 scale-[1.02]'
                    : isDragReject
                      ? 'border-red-500 bg-red-500/10'
                      : !activeClassName &&
                        (variant === 'mini' ? 'p-4 flex items-center justify-center' : 'p-8') +
                          ' border-border hover:border-brand-main/50 hover:bg-brand-main/5'
                }
            `}
    >
      <input {...getInputProps()} />

      {children ? (
        children
      ) : (
        <div
          className={`flex flex-col items-center justify-center ${variant === 'mini' ? 'gap-1' : 'gap-3'} text-center h-full w-full`}
        >
          {/* Icon */}
          <div
            className={`
                        rounded-full flex items-center justify-center transition-all duration-300
                        ${variant === 'mini' ? 'w-8 h-8' : 'w-12 h-12'}
                        ${
                          isDragActive && !isDragReject
                            ? 'bg-brand-main/20 scale-110'
                            : isDragReject
                              ? 'bg-red-500/20'
                              : 'bg-slate-100 dark:bg-white/5'
                        }
                    `}
          >
            {isDragReject ? (
              <X className={`${variant === 'mini' ? 'w-4 h-4' : 'w-6 h-6'} text-red-500`} />
            ) : (
              <Upload
                className={`${variant === 'mini' ? 'w-4 h-4' : 'w-6 h-6'} transition-colors ${
                  isDragActive ? 'text-brand-main' : 'text-slate-400'
                }`}
              />
            )}
          </div>

          {/* Text */}
          <div className="flex flex-col items-center max-w-sm">
            {isDragReject ? (
              <p className="text-sm font-bold text-red-500">Arquivo não suportado</p>
            ) : isDragActive ? (
              <p className="text-sm font-bold text-brand-main">Solte aqui para enviar</p>
            ) : (
              <>
                <p
                  className={cn(
                    'font-bold tracking-tight',
                    variant === 'mini' ? 'text-xs' : 'text-[13px] uppercase',
                  )}
                >
                  {variant === 'mini'
                    ? 'Arraste ou clique'
                    : 'Arraste arquivos ou clique para selecionar'}
                </p>
                {variant !== 'mini' && (
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <p className="text-[10px] font-medium text-slate-400">
                      Suporta imagens e vídeos (máx. 1GB cada)
                    </p>
                    <div className="flex items-center gap-3 mt-1 opacity-60">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                        <FileImage className="w-3 h-3" />
                        <span>Fotos e Gifs</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                        <FileVideo className="w-3 h-3" />
                        <span>Vídeos MP4/MKV</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
