'use client';

import Image from 'next/image';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Trash2,
  Eye,
  Upload,
  FileImage,
  FileVideo,
  FileAudio,
  Check,
  Loader2,
  X,
  Grid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/lib/theme-store';
import { DropZone } from '@/components/upload/drop-zone';
import { notifyError, notifySuccess } from '@/lib/notification-store';
import { useSystemStore } from '@/lib/system-store';
import { ConfirmModal, useConfirm } from '@/components/modals/confirm-modal';
import { Pagination } from '@/components/ui/pagination';

export interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
  uploaded_at: string;
  usage?: Array<{
    playlist_name: string;
    playlist_id: string;
    company_name?: string;
    company_id?: string;
  }>;
}

interface MediaGalleryProps {
  onSelect?: (files: MediaFile[]) => void;
  multiSelect?: boolean;
  className?: string;
}

export function MediaGallery({ onSelect, multiSelect = false, className }: MediaGalleryProps) {
  const { theme } = useThemeStore();
  const { confirm, confirmProps } = useConfirm();
  const uploadLimit = useSystemStore((s) => s.uploadLimit);
  const uploadLimitVideo = useSystemStore((s) => s.uploadLimitVideo);
  const fetchSettings = useSystemStore((s) => s.fetchSettings);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch Files
  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/media-library?limit=${limit}&page=${page}`;
      if (search) url += `&search=${search}`;
      if (typeFilter !== 'all') url += `&type=${typeFilter}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        setFiles(data.data);
        setTotalItems(data.pagination?.total || data.data.length);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      notifyError('Erro', 'Falha ao carregar galeria.');
    } finally {
      setLoading(false);
    }
  }, [limit, page, search, typeFilter]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle Delete
  const handleDelete = (id: string) => {
    confirm({
      title: 'Excluir Arquivo',
      message:
        'Tem certeza que deseja excluir este arquivo permanentemente? Esta ação não pode ser desfeita.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/media-library?id=${id}`, { method: 'DELETE' });
          if (res.ok) {
            notifySuccess('Sucesso', 'Arquivo excluído.');
            setFiles((prev) => prev.filter((f) => f.id !== id));
            if (selectedFiles.includes(id)) {
              setSelectedFiles((prev) => prev.filter((fid) => fid !== id));
            }
          } else {
            notifyError('Erro', 'Falha ao excluir arquivo.');
          }
        } catch (error) {
          console.error('Delete error:', error);
          notifyError('Erro', 'Erro de conexão.');
        }
      },
    });
  };

  // Handle Upload
  const handleUpload = async (fileList: File[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    const toPositiveInt = (value: unknown): number | null => {
      const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
      if (!Number.isFinite(n)) return null;
      const asInt = Math.floor(n);
      if (asInt <= 0) return null;
      return asInt;
    };

    const defaultImageLimitMb = 500;
    const defaultVideoLimitMb = 1024;
    const imageLimitMb = toPositiveInt(uploadLimit) ?? defaultImageLimitMb;
    const videoLimitMb = toPositiveInt(uploadLimitVideo) ?? defaultVideoLimitMb;

    const allowedFiles: File[] = [];
    for (const file of fileList) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const isVideo =
        file.type?.startsWith('video') ||
        ['mp4', 'webm', 'mov', 'mkv', 'm4v', 'avi', 'wmv', 'flv', 'ogg'].includes(ext);
      const limitMb = isVideo ? videoLimitMb : imageLimitMb;
      const maxBytes = limitMb * 1024 * 1024;
      if (file.size > maxBytes) {
        notifyError('Erro', `${file.name} excede o limite de ${limitMb}MB`);
        continue;
      }
      allowedFiles.push(file);
    }

    if (allowedFiles.length === 0) {
      setIsUploading(false);
      setUploadProgress(0);
      return;
    }

    // Process sequentially to track progress better
    for (let i = 0; i < allowedFiles.length; i++) {
      const file = allowedFiles[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = (event.loaded / event.total) * 100;
              // Calculate total progress based on current file index and its progress
              const totalProgress = (i * 100 + percentComplete) / allowedFiles.length;
              setUploadProgress(totalProgress);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              let message = `Falha ao enviar ${file.name}`;
              try {
                const data = JSON.parse(xhr.responseText);
                if (data?.error) {
                  message = String(data.error);
                  // Log additional error details for debugging
                  if (xhr.status === 500) {
                    console.error(`[Upload Error] ${file.name}:`, {
                      status: xhr.status,
                      error: data.error,
                      response: data,
                    });
                  }
                }
              } catch {
                // If we can't parse the response, use status-based messages
                if (xhr.status === 413) {
                  message = `Arquivo muito grande. O servidor recusou o upload.`;
                } else if (xhr.status === 500) {
                  message = `Erro interno do servidor ao enviar ${file.name}. Verifique os logs do servidor.`;
                }
              }
              reject(new Error(message));
            }
          });

          xhr.addEventListener('error', () => reject(new Error('Network error')));
          xhr.open('POST', '/api/upload');
          xhr.send(formData);
        });
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        notifyError(
          'Erro',
          error instanceof Error ? error.message : `Falha ao enviar ${file.name}`,
        );
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    fetchFiles();
    notifySuccess('Sucesso', 'Arquivos enviados com sucesso!');
  };

  // Selection Logic
  const toggleSelection = (file: MediaFile) => {
    if (onSelect) {
      if (multiSelect) {
        setSelectedFiles((prev) =>
          prev.includes(file.id) ? prev.filter((id) => id !== file.id) : [...prev, file.id],
        );
      } else {
        setSelectedFiles([file.id]);
        onSelect([file]); // Auto-select single
      }
    } else {
      setPreviewFile(file);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Layout Decision: Using a responsive grid that adapts to screen width
  // - Grid columns change from 2 to 6 based on breakpoint
  // - Aspect ratio is maintained for consistency
  // - Selection state uses ring/border logic for visibility
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar: Kept sticky/fixed at top for easy access to filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 shrink-0">
        {/* Search: Full width on mobile, flexible on desktop */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar arquivos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg border outline-none transition-all',
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-800 focus:border-brand-main',
            )}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {[
            { id: 'all', label: 'Todos', icon: Grid },
            { id: 'image', label: 'Imagens', icon: FileImage },
            { id: 'video', label: 'Vídeos', icon: FileVideo },
            { id: 'audio', label: 'Áudios', icon: FileAudio },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id as 'all' | 'image' | 'video' | 'audio')}
              className={cn(
                'px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all border',
                typeFilter === f.id
                  ? 'bg-brand-main text-white border-brand-main'
                  : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:text-brand-main',
              )}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Area (Small) */}
      <div className="mb-6 shrink-0">
        <DropZone
          onFilesAccepted={handleUpload}
          accept={{
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov', '.avi', '.mkv'],
            'audio/*': ['.mp3', '.wav', '.ogg'],
          }}
          multiple={true}
          className="h-24 border-dashed"
          variant="mini"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-75">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-brand-main animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-bold text-sm">Nenhum arquivo encontrado</p>
            <p className="text-xs opacity-70">Faça upload ou ajuste os filtros</p>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-4 pb-4',
              viewMode === 'grid'
                ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
                : 'grid-cols-1',
            )}
          >
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => toggleSelection(file)}
                className={cn(
                  'group relative rounded-xl overflow-hidden border transition-all cursor-pointer hover:shadow-lg',
                  selectedFiles.includes(file.id)
                    ? 'ring-2 ring-brand-main border-transparent'
                    : theme === 'dark'
                      ? 'bg-white/5 border-white/10 hover:border-white/20'
                      : 'bg-white border-slate-200 hover:border-brand-main/30',
                )}
              >
                {/* Preview */}
                <div className="aspect-square bg-slate-100 dark:bg-black/20 relative overflow-hidden">
                  {file.mime_type.startsWith('image') ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={file.url}
                        alt={file.original_name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                  ) : file.mime_type.startsWith('video') ? (
                    <video src={file.url} className="w-full h-full object-cover opacity-80" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileAudio className="w-12 h-12 text-slate-400" />
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(file);
                      }}
                      className="p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!onSelect && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file.id);
                        }}
                        className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {onSelect && (
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                          selectedFiles.includes(file.id)
                            ? 'bg-brand-main border-brand-main'
                            : 'border-white',
                        )}
                      >
                        {selectedFiles.includes(file.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Type Badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-sm">
                    {file.mime_type.split('/')[0]}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4
                    className="text-xs font-bold truncate mb-1 text-slate-700 dark:text-slate-200"
                    title={file.original_name}
                  >
                    {file.original_name}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>{formatSize(file.size)}</span>
                    <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                  </div>

                  {/* Playlist & Company Linkage */}
                  {file.usage && file.usage.length > 0 ? (
                    <div className="mt-2 flex flex-col gap-1 border-t border-slate-100 dark:border-white/5 pt-2">
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Vinculado a:
                      </span>
                      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-0.5 custom-scrollbar">
                        {file.usage.map((u, idx) => (
                          <div
                            key={idx}
                            className="inline-flex flex-col w-full p-1 px-1.5 rounded bg-brand-main/10 border border-brand-main/20 text-brand-main leading-tight"
                            title={`Playlist: ${u.playlist_name} | Empresa: ${u.company_name || 'Sem empresa'}`}
                          >
                            <span className="truncate text-[9px]">
                              <strong className="font-bold">Playlist:</strong> {u.playlist_name}
                            </span>
                            {u.company_name && (
                              <span className="opacity-80 text-[9px] truncate font-medium border-t border-brand-main/10 mt-0.5 pt-0.5">
                                <strong className="font-bold">Empresa:</strong> {u.company_name}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-1 border-t border-slate-100 dark:border-white/5 pt-2 text-[9px] text-slate-400 dark:text-slate-500 italic">
                      <span>Não vinculado a playlists</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 shrink-0">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
            itemsPerPage={limit}
          />
        </div>
      )}

      {/* Upload Progress Overlay */}
      {isUploading && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center flex-col animate-fadeIn">
          <Loader2 className="w-10 h-10 text-brand-main animate-spin mb-4" />
          <p className="text-white font-bold mb-2">Enviando Arquivos...</p>
          <div className="w-64 h-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-main transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-9000 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewFile(null)}
              className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-black shadow-2xl border border-white/10">
              {previewFile.mime_type.startsWith('image') ? (
                <Image
                  src={previewFile.url}
                  alt={previewFile.original_name}
                  width={1920}
                  height={1080}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              ) : previewFile.mime_type.startsWith('video') ? (
                <video
                  src={previewFile.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh]"
                />
              ) : (
                <div className="p-20 text-center">
                  <FileAudio className="w-24 h-24 text-slate-500 mx-auto mb-4" />
                  <p className="text-white text-lg">{previewFile.original_name}</p>
                  <audio src={previewFile.url} controls className="mt-4" />
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <h3 className="text-white font-bold text-lg">{previewFile.original_name}</h3>
              <p className="text-white/50 text-sm">
                {formatSize(previewFile.size)} •{' '}
                {new Date(previewFile.uploaded_at).toLocaleString()}
              </p>

              {/* Associated Playlists & Companies */}
              {previewFile.usage && previewFile.usage.length > 0 ? (
                <div className="mt-4 max-w-lg mx-auto bg-white/5 border border-white/10 rounded-xl p-3">
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mb-2">
                    Playlists e Empresas Vinculadas
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center max-h-32 overflow-y-auto custom-scrollbar">
                    {previewFile.usage.map((u, idx) => (
                      <div
                        key={idx}
                        className="inline-flex flex-col items-center p-1.5 px-3 rounded bg-brand-main/20 border border-brand-main/35 text-brand-main leading-tight font-medium"
                      >
                        <span className="text-[11px]">
                          <strong className="font-bold">Playlist:</strong> {u.playlist_name}
                        </span>
                        {u.company_name && (
                          <span className="opacity-80 text-[11px] font-medium border-t border-brand-main/15 mt-0.5 pt-0.5">
                            <strong className="font-bold">Empresa:</strong> {u.company_name}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-white/30 text-xs italic">
                  Este arquivo não está vinculado a nenhuma playlist no momento
                </p>
              )}

              <a
                href={previewFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-brand-main hover:underline text-xs uppercase font-bold tracking-wider"
              >
                Abrir Original
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Custom Confirmation Modal */}
      <ConfirmModal {...confirmProps} />
    </div>
  );
}
