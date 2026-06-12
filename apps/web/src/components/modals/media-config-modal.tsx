'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Check,
  Clock,
  Layout,
  Link2,
  Monitor,
  Trash2,
  X,
  RotateCw,
  Sparkles,
  Video,
  Youtube,
  HardDrive,
  Plus,
  Globe,
} from 'lucide-react';
import { MediaConfigLayoutTab } from './media-config-layout-tab';
import { MediaConfigScheduleTab } from './media-config-schedule-tab';
import { MediaItem, MediaType } from '@/lib/store';
import { MediaGallery, MediaFile } from '@/components/media/media-gallery';
import { LayoutType } from '@/lib/layouts';
import { LAYOUT_TEMPLATES } from '@/lib/layout-templates';
import { ZoneComposer } from '@/components/editor/zone-composer';
import { DropZone } from '@/components/upload/drop-zone';

import { LocationAutocomplete } from '@/components/inputs/location-autocomplete';
import { useThemeStore } from '@/lib/theme-store';

import { cn, generateUUID } from '@/lib/utils';
import { LayoutRenderer } from '@/components/player/layout-renderer';
import { notifyError, notifySuccess } from '@/lib/notification-store';
import { getBrazilianHolidays } from '@/lib/holidays';

interface MediaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MediaItem) => void;
  onAutoSave?: (item: MediaItem) => void;
  initialItem?: MediaItem | null; // If editing
}

type YoutubeQuality =
  | 'auto'
  | 'hd2160'
  | 'hd1440'
  | 'hd1080'
  | 'hd720'
  | 'large'
  | 'medium'
  | 'small'
  | 'tiny';

type YoutubePlayerConfig = {
  startSeconds?: number;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  quality?: YoutubeQuality;
  captionsEnabled?: boolean;
  captionsLang?: string;
  controls?: boolean;
};

export function MediaConfigModal({
  isOpen,
  onClose,
  onSave,
  onAutoSave,
  initialItem,
}: MediaConfigModalProps) {
  const { theme } = useThemeStore();

  // Basic Config
  const [duration, setDuration] = useState(10);
  const [rotation, setRotation] = useState(0);
  const [layout, setLayout] = useState<LayoutType>('single');

  // Scheduling
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDay, setAllDay] = useState(true);

  // Content State
  // For Multi-zone
  const [zoneDraft, setZoneDraft] = useState<
    Array<{ id: string; type: MediaType; url: string; name: string; file?: File } | null>
  >([]);
  const [composerKey, setComposerKey] = useState(0);

  // For Single Zone (Unified handling)
  const [singleUrl, setSingleUrl] = useState('');
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singlePreview, setSinglePreview] = useState<string>('');
  const [layoutTemplateId, setLayoutTemplateId] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [regionConfig, setRegionConfig] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'content' | 'layout' | 'schedule'>('content');
  const [urlType, setUrlType] = useState<'auto' | 'video' | 'youtube' | 'web'>('auto');
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Load initial item if editing
  const [isInitialized, setIsInitialized] = useState(false);
  const lastItemIdRef = useRef<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Restore active tab from localStorage
    const savedTab = localStorage.getItem('mediaConfigActiveTab') as
      | 'content'
      | 'layout'
      | 'schedule'
      | null;
    if (savedTab) setActiveTab(savedTab);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const currentId = initialItem?.id || 'new';

      // Always reset to content tab when opening modal
      setActiveTab('content');
      localStorage.removeItem('mediaConfigActiveTab');

      // Only initialize if we haven't initialized this specific item yet
      if (!isInitialized || lastItemIdRef.current !== currentId) {
        if (initialItem) {
          setDuration(initialItem.duration);
          setRotation(initialItem.rotation);
          setLayout(initialItem.layout || 'single');
          // Schedule
          setScheduleEnabled(initialItem.schedule.enabled);
          setDaysOfWeek(initialItem.schedule.daysOfWeek);
          setStartDate(initialItem.schedule.startDate || '');
          setEndDate(initialItem.schedule.endDate || '');
          setStartTime(initialItem.schedule.startTime || '');
          setEndTime(initialItem.schedule.endTime || '');
          setAllDay(initialItem.schedule.allDay);

          // Content
          setLayoutTemplateId(initialItem.layoutTemplateId || '');
          setRegionConfig(initialItem.regionConfig || {});
          if (initialItem.layout !== 'single' && initialItem.zones) {
            // Ensure zones have all required fields with proper defaults
            const normalizedZones = initialItem.zones.map((zone) => {
              if (!zone) return null;
              return {
                id: zone.id,
                type: zone.type,
                url: zone.url || '',
                name: zone.name || 'Untitled',
                rotation: zone.rotation,
              };
            });
            setZoneDraft(normalizedZones);
          } else {
            setSinglePreview(initialItem.url);
            setSingleUrl(
              initialItem.type === 'youtube' ||
                initialItem.type === 'video' ||
                initialItem.type === 'image' ||
                initialItem.type === 'web'
                ? initialItem.url
                : '',
            );

            // Infer URL type from item type
            if (initialItem.type === 'youtube') setUrlType('youtube');
            else if (initialItem.type === 'video') setUrlType('video');
            else if (initialItem.type === 'web') setUrlType('web');
            else setUrlType('auto');
          }
        } else {
          // Defaults for new item
          setDuration(10);
          setRotation(0);
          setLayout('single');
          setScheduleEnabled(false);
          setDaysOfWeek([]);
          setStartDate('');
          setEndDate('');
          setStartTime('');
          setEndTime('');
          setAllDay(true);
          setZoneDraft([]);
          setSingleUrl('');
          setLayoutTemplateId('');
          setRegionConfig({});
          setSingleFile(null);
          setSinglePreview('');
          setComposerKey((prev) => prev + 1);
          setUrlType('auto');
        }

        lastItemIdRef.current = currentId;
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(false);
    }
  }, [isOpen, initialItem, isInitialized]);

  // Persist tab change
  const handleTabChange = (tab: 'content' | 'layout' | 'schedule') => {
    setActiveTab(tab);
    localStorage.setItem('mediaConfigActiveTab', tab);
  };

  // Construct item helper
  const constructItem = useCallback(
    (
      overrideUrl?: string,
      overrideZones?: Array<{
        id: string;
        type: MediaType;
        url: string;
        name: string;
        rotation?: number;
      } | null>,
    ): MediaItem => {
      const finalLayout = layoutTemplateId ? 'single' : layout;
      const currentUrl = overrideUrl !== undefined ? overrideUrl : singleUrl || singlePreview;
      const currentZones = overrideZones !== undefined ? overrideZones : zoneDraft;

      let type: MediaType = 'image';

      if (finalLayout === 'single') {
        if (singleFile) {
          const isVideoFile =
            singleFile.type.startsWith('video') ||
            singleFile.name.match(/\.(mp4|webm|ogg|mov|mkv|m4v|avi|wmv|flv)$/i);
          type = isVideoFile ? 'video' : 'image';
        } else if (currentUrl) {
          if (urlType === 'youtube') type = 'youtube';
          else if (urlType === 'video') type = 'video';
          else if (urlType === 'web') type = 'web';
          else {
            if (isYoutube(currentUrl)) type = 'youtube';
            else if (currentUrl.match(/\.(mp4|webm|ogg|mov|mkv|m4v|avi|wmv|flv)$/i)) type = 'video';
            else if (currentUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) type = 'image';
            else type = 'web';
          }
        } else if (layoutTemplateId) {
          type = 'image';
        }
      } else {
        type = 'layout';
      }

      let finalUrlProcessed = currentUrl;
      if (type === 'youtube' && !currentUrl.startsWith('blob:')) {
        finalUrlProcessed = parseYoutubeVideoId(currentUrl) ?? currentUrl;
      }

      return {
        id: initialItem?.id || generateUUID(),
        type,
        url: finalLayout === 'single' ? finalUrlProcessed : '',
        name:
          initialItem?.name ||
          singleFile?.name ||
          (currentUrl ? 'URL Media' : layoutTemplateId ? 'Layout Template' : `Slide ${layout}`),
        duration,
        rotation,
        layout: finalLayout,
        zones: finalLayout === 'single' ? undefined : (currentZones as MediaItem['zones']),
        layoutTemplateId: layoutTemplateId || undefined,
        regionConfig: regionConfig,
        schedule: {
          startDate: startDate || null,
          endDate: endDate || null,
          startTime: allDay ? null : startTime || null,
          endTime: allDay ? null : endTime || null,
          allDay,
          daysOfWeek,
          enabled: scheduleEnabled,
        },
      };
    },
    [
      layoutTemplateId,
      layout,
      singleUrl,
      singlePreview,
      zoneDraft,
      singleFile,
      urlType,
      initialItem,
      duration,
      rotation,
      regionConfig,
      startDate,
      endDate,
      startTime,
      endTime,
      allDay,
      daysOfWeek,
      scheduleEnabled,
    ],
  );

  // Auto-save Effect
  useEffect(() => {
    if (!isInitialized || !initialItem || !onAutoSave) return;

    // Skip auto-save if there are pending file uploads (blob URLs)
    if (singleFile || (singleUrl && singleUrl.startsWith('blob:'))) return;
    if (zoneDraft.some((z) => z && z.url.startsWith('blob:'))) return;

    // Basic validation before auto-save
    if (layout === 'single' && !singleUrl && !layoutTemplateId && !singlePreview) return;
    if (layout !== 'single' && zoneDraft.length === 0) return;

    const timeoutId = setTimeout(() => {
      const item = constructItem();
      onAutoSave(item);
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timeoutId);
  }, [
    duration,
    rotation,
    layout,
    scheduleEnabled,
    daysOfWeek,
    startDate,
    endDate,
    startTime,
    endTime,
    allDay,
    zoneDraft,
    singleUrl,
    singlePreview,
    layoutTemplateId,
    regionConfig,
    urlType,
    isInitialized,
    initialItem,
    onAutoSave,
    singleFile,
    constructItem,
  ]);

  const handleSave = async () => {
    if (layout === 'single' && !singlePreview && !singleUrl && !layoutTemplateId) {
      if (!initialItem && !singleFile && !singleUrl) {
        notifyError('Conteúdo ausente', 'Adicione uma mídia ou URL.');
        return;
      }
    }

    if (layout !== 'single' && zoneDraft.length === 0) {
      notifyError('Layout incompleto', 'Configure as zonas do layout.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Force layout to single if template is selected to ensure URL preservation
    const finalLayout = layoutTemplateId ? 'single' : layout;

    let finalUrl = singleUrl || singlePreview;
    if (finalLayout === 'single' && singleFile) {
      try {
        const formData = new FormData();
        formData.append('file', singleFile);

        const response = await new Promise<unknown>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/upload');

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(progress);
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const data = JSON.parse(xhr.responseText);
                resolve(data);
              } catch {
                reject(new Error('Invalid response format'));
              }
            } else {
              let message = `Falha ao enviar ${singleFile.name}`;
              try {
                const data = JSON.parse(xhr.responseText);
                if (data?.error) message = String(data.error);
              } catch {}
              reject(new Error(message));
            }
          };

          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send(formData);
        });

        finalUrl = (response as { url: string }).url;
      } catch (error) {
        console.error('Upload error:', error);
        notifyError(
          'Erro no upload',
          error instanceof Error ? error.message : 'Falha ao enviar arquivo. Tente novamente.',
        );
        setIsUploading(false);
        return;
      }
    }

    // Preserve nulls to maintain grid positions
    let finalZones = [...zoneDraft];

    if (layout !== 'single' && finalZones.some((z) => z !== null)) {
      try {
        finalZones = await Promise.all(
          finalZones.map(async (zone) => {
            if (!zone) return null;

            if (zone.file) {
              const formData = new FormData();
              formData.append('file', zone.file);

              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });

              if (!uploadResponse.ok) {
                let message = `Falha ao enviar ${zone.name}`;
                try {
                  const err = await uploadResponse.json();
                  if (err?.error) message = String(err.error);
                } catch {}
                throw new Error(message);
              }

              const data = await uploadResponse.json();
              return { ...zone, url: data.url, file: undefined };
            }

            if (zone.url.startsWith('blob:')) {
              // Fetch the blob data
              const response = await fetch(zone.url);
              const blob = await response.blob();

              // Create a file from the blob
              const file = new File([blob], zone.name, { type: blob.type });
              const formData = new FormData();
              formData.append('file', file);

              // Upload using XHR to track progress if needed, or just fetch
              const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });

              if (!uploadResponse.ok) {
                let message = `Falha ao enviar ${zone.name}`;
                try {
                  const err = await uploadResponse.json();
                  if (err?.error) message = String(err.error);
                } catch {}
                throw new Error(message);
              }

              const data = await uploadResponse.json();
              return { ...zone, url: data.url, file: undefined };
            }
            return zone;
          }),
        );
      } catch (error) {
        console.error('Zone upload error:', error);
        notifyError(
          'Erro no upload',
          error instanceof Error
            ? `Falha ao enviar imagens das zonas: ${error.message}`
            : 'Falha ao enviar imagens das zonas. Verifique o tamanho dos arquivos.',
        );
        setIsUploading(false);
        return;
      }
    }

    // Validate that we are not saving blob URLs
    if (finalLayout === 'single' && finalUrl && finalUrl.startsWith('blob:')) {
      // This should have been handled by the upload logic above, but as a safety net:
      notifyError(
        'Erro de Persistência',
        'A mídia ainda é um arquivo local temporário. Tente fazer o upload novamente.',
      );
      setIsUploading(false);
      return;
    }

    const newItem = constructItem(
      finalUrl,
      finalZones as Array<{
        id: string;
        type: MediaType;
        url: string;
        name: string;
        rotation?: number;
      } | null>,
    );

    onSave(newItem);
    setIsUploading(false);
    onClose();
  };

  const handleSingleFile = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSingleFile(file);
      setSinglePreview(URL.createObjectURL(file));
      setSingleUrl('');

      // File type detection with MKV support
      if (
        file.type.startsWith('video') ||
        file.name.match(/\.(mp4|webm|ogg|mov|mkv|m4v|avi|wmv|flv)$/i)
      ) {
        setUrlType('video');
      } else {
        setUrlType('auto');
      }
    }
  };

  const handleSingleUrl = (val: string) => {
    setSingleUrl(val);
    setSinglePreview(val);
    setSingleFile(null);
  };

  const isYoutube = (url: string) =>
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    url.includes('youtube-nocookie.com') ||
    /^[a-zA-Z0-9_-]{11}$/.test(url.trim());

  const parseYoutubeVideoId = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/|live\/)([^#&?]*).*/;
      const match = trimmed.match(regExp);
      if (match && match[2] && match[2].length === 11) return match[2];
    } catch {
      return null;
    }
    return null;
  };

  const getYoutubeEmbedUrl = (url: string, config?: Partial<YoutubePlayerConfig>) => {
    if (!url) return '';
    const videoId = parseYoutubeVideoId(url);
    if (!videoId) return '';
    const originParam =
      typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
    const start = Number.isFinite(config?.startSeconds as number)
      ? `&start=${Math.max(0, Math.floor(config!.startSeconds!))}`
      : '';
    const controls = config?.controls === false ? 0 : 1;
    const muted = config?.muted ? 1 : 0;
    const quality = config?.quality ? `&vq=${encodeURIComponent(config.quality)}` : '';
    const ccLoad = config?.captionsEnabled ? '&cc_load_policy=1' : '';
    const ccLang = config?.captionsLang
      ? `&cc_lang_pref=${encodeURIComponent(config.captionsLang)}`
      : '';
    return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${muted}&controls=${controls}&fs=1&loop=1&playlist=${videoId}&playsinline=1&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1${originParam}${start}${quality}${ccLoad}${ccLang}`;
  };

  const handleGallerySelect = (files: MediaFile[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSingleUrl(file.url);
      setSinglePreview(file.url);
      setSingleFile(null); // Clear file since we use URL

      // Set type based on mime
      if (file.mime_type.startsWith('video')) setUrlType('video');
      else setUrlType('auto');

      setShowGalleryModal(false);
    }
  };

  const getPreviewContent = () => {
    if (!singlePreview) return null;

    let isVid = false;
    if (urlType === 'video') isVid = true;
    else if (urlType === 'youtube') isVid = false;
    else if (urlType === 'web') isVid = false;
    else {
      isVid =
        (singleFile?.type?.startsWith('video/') ?? false) ||
        /\.(mp4|webm|ogg|mov|mkv|m4v|avi|wmv|flv)$/i.test(singlePreview);
    }

    const isYt = urlType === 'youtube' || (urlType === 'auto' && isYoutube(singleUrl));

    const isImg =
      (singleFile?.type?.startsWith('image/') ?? false) ||
      /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(singlePreview);

    const isWeb = urlType === 'web' || (urlType === 'auto' && !isYt && !isVid && !isImg);

    if (isYt) {
      const ytConfig = (regionConfig.__youtube || {}) as Partial<YoutubePlayerConfig>;
      const embedUrl = getYoutubeEmbedUrl(singleUrl, ytConfig);

      if (embedUrl && embedUrl.includes('/embed/')) {
        return (
          <div className="w-full h-full bg-black">
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        );
      }

      return (
        <div className="w-full h-full flex items-center justify-center bg-black/40">
          <Youtube className="w-12 h-12 text-red-600 opacity-80" />
        </div>
      );
    }

    if (isWeb) {
      return (
        <div className="w-full h-full bg-white dark:bg-black relative">
          <iframe
            src={singlePreview}
            className="w-full h-full border-0"
            title="Web Preview"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
          />
        </div>
      );
    }

    if (isVid) {
      return (
        <video
          src={singlePreview}
          className="w-full h-full object-contain"
          style={{ transform: `rotate(${rotation}deg)` }}
          controls
        />
      );
    }

    return (
      <div className="relative w-full h-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${singlePreview})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(18px) brightness(0.8)',
            transform: `scale(1.12) rotate(${rotation}deg)`,
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={singlePreview}
          alt="Preview"
          className="relative z-10 w-full h-full object-contain"
          style={{ transform: `rotate(${rotation}deg)` }}
          draggable={false}
        />
      </div>
    );
  };

  return isOpen ? (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-7000 flex items-center justify-center p-4 animate-fadeIn transition-all duration-500">
      <div
        className={cn(
          'w-full max-w-6xl max-h-[85vh] overflow-hidden rounded-2xl border flex flex-col shadow-2xl transition-all duration-500',
          theme === 'dark' ? 'bg-[#05100e] border-white/10' : 'bg-white border-slate-200',
        )}
      >
        {/* Header - Compact */}
        <div
          className={cn(
            'px-4 py-3 flex items-center justify-between shrink-0 border-b',
            theme === 'dark' ? 'bg-[#020605] border-white/5' : 'bg-white border-slate-100',
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-main/10 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-brand-main" />
            </div>
            <div>
              <h2
                className={cn(
                  'text-sm font-bold uppercase tracking-tight',
                  theme === 'dark' ? 'text-white' : 'text-slate-800',
                )}
              >
                {initialItem ? 'Editar Mídia' : 'Nova Mídia'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Duration Control */}
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 rounded-lg px-2 py-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <input
                type="text"
                maxLength={3}
                value={duration === 0 ? '' : duration}
                placeholder="10"
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    setDuration(0); // Using 0 as internal "empty" state for input
                  } else {
                    const parsed = parseInt(val);
                    if (!isNaN(parsed)) setDuration(parsed);
                  }
                }}
                className="w-8 text-center bg-transparent text-sm font-bold outline-none"
              />
              <span className="text-[10px] text-slate-400 font-bold">SEG</span>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body - Compact */}
        <div
          className={cn(
            'flex-1 overflow-y-auto p-4 custom-scrollbar relative min-h-0',
            theme === 'dark' ? 'bg-[#020605]' : 'bg-slate-50',
          )}
        >
          {/* Upload Overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-8 animate-fadeIn">
              <div className="w-12 h-12 mb-4 rounded-full border-4 border-t-brand-main border-white/10 animate-spin" />
              <p className="text-sm text-white font-bold mb-2">
                Enviando Mídia ({uploadProgress}%)
              </p>
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-main transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Tab Navigation - Compact */}
          <div className="flex justify-center mb-6">
            <div
              className={cn(
                'flex gap-1 p-1 rounded-xl border',
                theme === 'dark'
                  ? 'bg-white/5 border-white/5'
                  : 'bg-white border-slate-200 shadow-sm',
              )}
            >
              {[
                { id: 'content', label: 'CONTEÚDO', icon: Monitor },
                { id: 'layout', label: 'LAYOUTS', icon: Layout },
                { id: 'schedule', label: 'AGENDA', icon: Clock },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={
                      isActive
                        ? () => handleTabChange(tab.id as 'content' | 'layout' | 'schedule')
                        : undefined
                    }
                    disabled={!isActive}
                    className={cn(
                      'px-4 py-2 rounded-lg text-[10px] font-bold tracking-widest flex items-center gap-2 transition-all uppercase',
                      isActive
                        ? 'bg-brand-main text-white shadow-sm'
                        : theme === 'dark'
                          ? 'text-slate-400 opacity-50 cursor-not-allowed'
                          : 'text-slate-500 opacity-50 cursor-not-allowed',
                    )}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Contents */}
          <div className="max-w-5xl mx-auto">
            {/* CONTENT TAB */}
            <div className={activeTab === 'content' ? 'animate-fadeIn space-y-4' : 'hidden'}>
              {/* Always show Media Input for Single Layout or Template */}
              {layout === 'single' && (
                <div className="space-y-4">
                  {/* Preview Area */}
                  <div
                    className={cn(
                      'bg-white dark:bg-white/5 rounded-xl border overflow-hidden shadow-sm',
                      theme === 'dark' ? 'border-white/5' : 'border-slate-200',
                    )}
                  >
                    <div className="p-4">
                      {singlePreview ? (
                        <div>
                          <div className="relative w-full aspect-video bg-slate-100 dark:bg-black/40 rounded-lg overflow-hidden group border border-slate-200 dark:border-white/10 shadow-inner">
                            {layoutTemplateId &&
                            LAYOUT_TEMPLATES.find((t) => t.id === layoutTemplateId) ? (
                              <LayoutRenderer
                                template={LAYOUT_TEMPLATES.find((t) => t.id === layoutTemplateId)!}
                                content={getPreviewContent()}
                                regionOverrides={regionConfig}
                                className="w-full h-full"
                              />
                            ) : (
                              getPreviewContent()
                            )}
                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4 gap-3 z-50">
                              <button
                                onClick={() => setRotation((prev) => (prev + 90) % 360)}
                                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-white backdrop-blur-md border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all"
                                title="Girar"
                              >
                                <RotateCw className="w-3.5 h-3.5" /> {rotation}°
                              </button>
                              <button
                                onClick={() => {
                                  setSingleFile(null);
                                  setSinglePreview('');
                                  setSingleUrl('');
                                  setRotation(0);
                                }}
                                className="px-3 py-1.5 bg-red-500/70 hover:bg-red-500 rounded-full text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                                title="Remover"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remover
                              </button>
                            </div>
                          </div>
                          {/* Rotation control always visible */}
                          <div className="flex items-center justify-center gap-2 mt-3">
                            <button
                              onClick={() => setRotation((prev) => (prev + 90) % 360)}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition-all hover:scale-[1.02] active:scale-95"
                            >
                              <RotateCw className="w-4 h-4 text-brand-main" />
                              <span>Rotacionar ({rotation}°)</span>
                            </button>
                            <button
                              onClick={() => setRotation(0)}
                              className="px-3 py-2 rounded-lg border text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all"
                              title="Resetar rotação"
                            >
                              Resetar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <DropZone
                            onFilesAccepted={handleSingleFile}
                            multiple={false}
                            className="h-40 w-full"
                            variant="default"
                          />
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              OU
                            </span>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10"></div>
                          </div>
                          <button
                            onClick={() => setShowGalleryModal(true)}
                            className={cn(
                              'w-full py-3 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]',
                              theme === 'dark'
                                ? 'border-white/10 hover:border-brand-main text-slate-400 hover:text-white'
                                : 'border-slate-200 hover:border-brand-main text-slate-500 hover:text-brand-main',
                            )}
                          >
                            <HardDrive className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                              Selecionar da Galeria
                            </span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* URL Input Area */}
                    <div
                      className={cn(
                        'p-4 border-t',
                        theme === 'dark'
                          ? 'border-white/5 bg-black/20'
                          : 'border-slate-100 bg-slate-50/50',
                      )}
                    >
                      <div className="flex gap-2 items-center">
                        <div
                          className={cn(
                            'w-10 h-10 flex items-center justify-center rounded-lg border',
                            theme === 'dark'
                              ? 'bg-white/5 border-white/5 text-white/40'
                              : 'bg-white border-slate-200 text-slate-400',
                          )}
                        >
                          <Link2 className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={singleUrl}
                          onChange={(e) => handleSingleUrl(e.target.value)}
                          placeholder="Cole uma URL de imagem, vídeo ou YouTube..."
                          className={cn(
                            'flex-1 h-10 px-3 border rounded-lg text-sm outline-none transition-all placeholder:text-slate-400',
                            theme === 'dark'
                              ? 'bg-black/20 border-white/10 text-white'
                              : 'bg-white border-slate-200 text-slate-800 focus:border-brand-main',
                          )}
                        />
                        {/* Type Selector */}
                        <div className="flex bg-slate-100 dark:bg-white/5 rounded-lg p-1 border border-slate-200 dark:border-white/5">
                          {[
                            { id: 'auto', icon: Sparkles, title: 'Auto' },
                            { id: 'video', icon: Video, title: 'Vídeo' },
                            { id: 'youtube', icon: Youtube, title: 'YouTube' },
                            { id: 'web', icon: Globe, title: 'Web/URL' },
                          ].map((t) => (
                            <button
                              key={t.id}
                              onClick={() =>
                                setUrlType(t.id as 'auto' | 'video' | 'youtube' | 'web')
                              }
                              className={cn(
                                'p-2 rounded-md transition-all',
                                urlType === t.id
                                  ? 'bg-white dark:bg-white/10 shadow-sm text-brand-main'
                                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-white',
                              )}
                              title={t.title}
                            >
                              <t.icon className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const isYt =
                        urlType === 'youtube' || (urlType === 'auto' && isYoutube(singleUrl));
                      if (!isYt || !singleUrl) return null;

                      const videoId = parseYoutubeVideoId(singleUrl);
                      const ytConfig = (regionConfig.__youtube || {}) as YoutubePlayerConfig;
                      const updateYoutubeConfig = (patch: Partial<YoutubePlayerConfig>) => {
                        setRegionConfig((prev) => ({
                          ...prev,
                          __youtube: {
                            ...(prev.__youtube || {}),
                            ...patch,
                          },
                        }));
                      };

                      return (
                        <div
                          className={cn(
                            'px-4 pb-4',
                            theme === 'dark' ? 'bg-black/10' : 'bg-slate-50/30',
                          )}
                        >
                          <details className="mt-3" open>
                            <summary
                              className={cn(
                                'list-none cursor-pointer select-none flex items-center justify-between gap-3 px-3 py-2 rounded-lg border',
                                theme === 'dark'
                                  ? 'bg-black/20 border-white/10 text-white/80'
                                  : 'bg-white border-slate-200 text-slate-700',
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Youtube className="w-4 h-4 text-red-500" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">
                                  Configurações YouTube
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {videoId ? `ID: ${videoId}` : 'URL inválida'}
                                </span>
                              </div>
                            </summary>

                            <div
                              className={cn(
                                'mt-3 p-4 rounded-xl border',
                                theme === 'dark'
                                  ? 'bg-white/5 border-white/10'
                                  : 'bg-white border-slate-200',
                              )}
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Início (segundos)
                                  </label>
                                  <input
                                    type="number"
                                    value={ytConfig.startSeconds ?? ''}
                                    onChange={(e) => {
                                      const v =
                                        e.target.value === ''
                                          ? undefined
                                          : Math.max(0, Math.floor(Number(e.target.value)));
                                      updateYoutubeConfig({
                                        startSeconds: Number.isFinite(v as number)
                                          ? (v as number)
                                          : undefined,
                                      });
                                    }}
                                    className={cn(
                                      'w-full h-10 px-3 border rounded-lg text-sm outline-none transition-all',
                                      theme === 'dark'
                                        ? 'bg-black/20 border-white/10 text-white'
                                        : 'bg-white border-slate-200 text-slate-800 focus:border-brand-main',
                                    )}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Volume (0–100)
                                  </label>
                                  <input
                                    type="number"
                                    value={ytConfig.volume ?? ''}
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (raw === '') {
                                        updateYoutubeConfig({ volume: undefined });
                                        return;
                                      }
                                      const v = Math.max(0, Math.min(100, Math.floor(Number(raw))));
                                      updateYoutubeConfig({
                                        volume: Number.isFinite(v) ? v : undefined,
                                      });
                                    }}
                                    className={cn(
                                      'w-full h-10 px-3 border rounded-lg text-sm outline-none transition-all',
                                      theme === 'dark'
                                        ? 'bg-black/20 border-white/10 text-white'
                                        : 'bg-white border-slate-200 text-slate-800 focus:border-brand-main',
                                    )}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Velocidade
                                  </label>
                                  <select
                                    value={ytConfig.playbackRate ?? 1}
                                    onChange={(e) =>
                                      updateYoutubeConfig({ playbackRate: Number(e.target.value) })
                                    }
                                    className={cn(
                                      'w-full h-10 px-3 border rounded-lg text-sm outline-none transition-all',
                                      theme === 'dark'
                                        ? 'bg-black/20 border-white/10 text-white'
                                        : 'bg-white border-slate-200 text-slate-800 focus:border-brand-main',
                                    )}
                                  >
                                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((v) => (
                                      <option key={v} value={v}>
                                        {v}x
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Qualidade
                                  </label>
                                  <select
                                    value={ytConfig.quality || 'auto'}
                                    onChange={(e) =>
                                      updateYoutubeConfig({
                                        quality: e.target.value as YoutubeQuality,
                                      })
                                    }
                                    className={cn(
                                      'w-full h-10 px-3 border rounded-lg text-sm outline-none transition-all',
                                      theme === 'dark'
                                        ? 'bg-black/20 border-white/10 text-white'
                                        : 'bg-white border-slate-200 text-slate-800 focus:border-brand-main',
                                    )}
                                  >
                                    {[
                                      'auto',
                                      'hd2160',
                                      'hd1440',
                                      'hd1080',
                                      'hd720',
                                      'large',
                                      'medium',
                                      'small',
                                      'tiny',
                                    ].map((v) => (
                                      <option key={v} value={v}>
                                        {v}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="col-span-2 grid grid-cols-2 gap-3">
                                  <label
                                    className={cn(
                                      'flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all',
                                      theme === 'dark'
                                        ? 'bg-black/20 border-white/10 hover:bg-white/5'
                                        : 'bg-white border-slate-200 hover:border-brand-main',
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'text-[10px] font-bold uppercase tracking-wider',
                                        theme === 'dark' ? 'text-white/70' : 'text-slate-600',
                                      )}
                                    >
                                      Mudo
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={ytConfig.muted ?? false}
                                      onChange={(e) =>
                                        updateYoutubeConfig({ muted: e.target.checked })
                                      }
                                      className="w-4 h-4 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                  <label
                                    className={cn(
                                      'flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all',
                                      theme === 'dark'
                                        ? 'bg-black/20 border-white/10 hover:bg-white/5'
                                        : 'bg-white border-slate-200 hover:border-brand-main',
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'text-[10px] font-bold uppercase tracking-wider',
                                        theme === 'dark' ? 'text-white/70' : 'text-slate-600',
                                      )}
                                    >
                                      Controles
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={ytConfig.controls ?? true}
                                      onChange={(e) =>
                                        updateYoutubeConfig({ controls: e.target.checked })
                                      }
                                      className="w-4 h-4 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                </div>
                                <div className="col-span-2 grid grid-cols-2 gap-3">
                                  <label
                                    className={cn(
                                      'flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all',
                                      theme === 'dark'
                                        ? 'bg-black/20 border-white/10 hover:bg-white/5'
                                        : 'bg-white border-slate-200 hover:border-brand-main',
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'text-[10px] font-bold uppercase tracking-wider',
                                        theme === 'dark' ? 'text-white/70' : 'text-slate-600',
                                      )}
                                    >
                                      Legendas
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={ytConfig.captionsEnabled ?? false}
                                      onChange={(e) =>
                                        updateYoutubeConfig({ captionsEnabled: e.target.checked })
                                      }
                                      className="w-4 h-4 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      Idioma
                                    </label>
                                    <input
                                      type="text"
                                      value={ytConfig.captionsLang ?? ''}
                                      onChange={(e) =>
                                        updateYoutubeConfig({
                                          captionsLang: e.target.value || undefined,
                                        })
                                      }
                                      placeholder="pt-BR, en..."
                                      className={cn(
                                        'w-full h-10 px-3 border rounded-lg text-sm outline-none transition-all',
                                        theme === 'dark'
                                          ? 'bg-black/20 border-white/10 text-white'
                                          : 'bg-white border-slate-200 text-slate-800 focus:border-brand-main',
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </details>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Template Config - Show below media input if template is selected */}
              {layoutTemplateId && (
                <details className="pt-4 border-t border-slate-200 dark:border-white/5" open>
                  <summary className="list-none cursor-pointer select-none">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-6 bg-brand-main rounded-full" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                        Configurar Template
                      </h3>
                    </div>
                  </summary>
                  <div className="grid grid-cols-1 gap-4 pb-1">
                    {LAYOUT_TEMPLATES.find((t) => t.id === layoutTemplateId)
                      ?.regions.filter((r) => r.widgetType !== 'media')
                      .map((region) => {
                        const currentConfig = {
                          ...region.config,
                          ...(regionConfig[region.id] || {}),
                        };
                        return (
                          <div
                            key={region.id}
                            className={cn(
                              'border p-4 rounded-xl transition-all',
                              theme === 'dark'
                                ? 'bg-white/5 border-white/5'
                                : 'bg-white border-slate-200',
                            )}
                          >
                            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 dark:border-white/5 pb-2">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white',
                                  region.type === 'sidebar'
                                    ? 'bg-blue-500'
                                    : region.type === 'ticker'
                                      ? 'bg-green-500'
                                      : 'bg-brand-main',
                                )}
                              >
                                {region.type}
                              </span>
                              <span className="text-xs font-bold uppercase text-slate-500">
                                {region.widgetType}
                              </span>
                            </div>

                            {/* Widget Configs */}
                            {(region.widgetType === 'message' || region.type === 'header') && (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Mensagem
                                  </label>
                                  <textarea
                                    value={currentConfig.text || ''}
                                    onChange={(e) =>
                                      setRegionConfig((prev) => ({
                                        ...prev,
                                        [region.id]: { ...currentConfig, text: e.target.value },
                                      }))
                                    }
                                    className={cn(
                                      'w-full px-3 py-2 border rounded-lg text-sm outline-none transition-all min-h-15 resize-none',
                                      theme === 'dark'
                                        ? 'bg-black/20 border-white/10 text-white'
                                        : 'bg-white border-slate-200 text-slate-800',
                                    )}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Estilo
                                  </label>
                                  <div className="flex gap-2">
                                    {['campaign', 'info', 'warning'].map((type) => (
                                      <button
                                        key={type}
                                        onClick={() =>
                                          setRegionConfig((prev) => ({
                                            ...prev,
                                            [region.id]: { ...currentConfig, type: type },
                                          }))
                                        }
                                        className={cn(
                                          'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex-1',
                                          currentConfig.type === type ||
                                            (!currentConfig.type && type === 'campaign')
                                            ? 'bg-brand-main text-white border-brand-main'
                                            : theme === 'dark'
                                              ? 'bg-white/5 border-white/10 text-slate-400'
                                              : 'bg-white border-slate-200 text-slate-500',
                                        )}
                                      >
                                        {type}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {region.widgetType === 'weather' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Localização
                                  </label>
                                  <LocationAutocomplete
                                    value={currentConfig.location || currentConfig.city || ''}
                                    onChange={(val) =>
                                      setRegionConfig((prev) => ({
                                        ...prev,
                                        [region.id]: { ...currentConfig, location: val },
                                      }))
                                    }
                                    placeholder="Ex: Porto Alegre, BR"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Dados em Tempo Real
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.useApi !== false}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            useApi: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Previsão
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.showForecast !== false}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            showForecast: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Humidade
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.showHumidity !== false}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            showHumidity: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                </div>
                                {/* Theme Removed as requested */}
                              </div>
                            )}

                            {region.widgetType === 'news' && (
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Fonte RSS (Opcional)
                                  </label>
                                  <input
                                    type="text"
                                    value={currentConfig.rssUrl || ''}
                                    onChange={(e) => {
                                      const url = e.target.value;
                                      setRegionConfig((prev) => ({
                                        ...prev,
                                        [region.id]: {
                                          ...currentConfig,
                                          rssUrl: url,
                                          useRss: url.length > 0,
                                        },
                                      }));
                                    }}
                                    placeholder="https://exemplo.com/rss"
                                    className={cn(
                                      'w-full px-3 py-2 border rounded-lg text-sm outline-none transition-all mb-2',
                                      theme === 'dark'
                                        ? 'bg-black/20 border-white/10 text-white'
                                        : 'bg-white border-slate-200 text-slate-800',
                                    )}
                                  />
                                </div>
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Manchetes Manuais
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const items = currentConfig.newsItems || [];
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            newsItems: [...items, ''],
                                          },
                                        }));
                                      }}
                                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-main/10 text-brand-main hover:bg-brand-main hover:text-white transition-all text-[9px] font-black uppercase tracking-wider group border border-brand-main/20 active:scale-95"
                                    >
                                      <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                                      ADICIONAR MANCHETE
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    {(currentConfig.newsItems || []).map(
                                      (item: string, idx: number) => (
                                        <div key={idx} className="flex gap-2">
                                          <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => {
                                              const items = [...(currentConfig.newsItems || [])];
                                              items[idx] = e.target.value;
                                              setRegionConfig((prev) => ({
                                                ...prev,
                                                [region.id]: { ...currentConfig, newsItems: items },
                                              }));
                                            }}
                                            placeholder="Digite a notícia..."
                                            className={cn(
                                              'flex-1 px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-sm outline-none transition-all',
                                              theme === 'dark'
                                                ? 'bg-black/20 text-white'
                                                : 'bg-white text-slate-800',
                                            )}
                                          />
                                          <button
                                            onClick={() => {
                                              const items = [...(currentConfig.newsItems || [])];
                                              items.splice(idx, 1);
                                              setRegionConfig((prev) => ({
                                                ...prev,
                                                [region.id]: { ...currentConfig, newsItems: items },
                                              }));
                                            }}
                                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ),
                                    )}
                                    {(currentConfig.newsItems || []).length === 0 && (
                                      <div className="text-center py-4 border border-dashed rounded-lg text-xs text-slate-400">
                                        Nenhuma notícia adicionada
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Exibir Relógio
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.showClock !== false}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            showClock: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                </div>
                                {/* Colors removed as requested */}
                              </div>
                            )}

                            {region.widgetType === 'clock' && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Exibir Hora
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.showTime !== false}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            showTime: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Exibir Data
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.showDate !== false}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            showDate: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Segundos
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.showSeconds !== false}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            showSeconds: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Formato 24h
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.format !== '12h'}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            format: e.target.checked ? '24h' : '12h',
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}

                            {region.widgetType === 'calendar' && (
                              <div className="space-y-3">
                                <div className="grid grid-cols-1 gap-2">
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Destacar Hoje
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.highlightToday !== false}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            highlightToday: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <label className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Ativar Carrossel
                                    </span>
                                    <input
                                      type="checkbox"
                                      checked={currentConfig.carouselEnabled === true}
                                      onChange={(e) =>
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            carouselEnabled: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="w-3 h-3 rounded accent-brand-main text-brand-main focus:ring-0"
                                    />
                                  </label>
                                  <div className="flex items-center justify-between p-2 border border-slate-200 dark:border-white/10 rounded-lg">
                                    <span className="text-[10px] font-bold uppercase text-slate-500">
                                      Intervalo (s)
                                    </span>
                                    <input
                                      type="text"
                                      maxLength={3}
                                      value={currentConfig.carouselInterval ?? ''}
                                      placeholder="20"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setRegionConfig((prev) => ({
                                          ...prev,
                                          [region.id]: {
                                            ...currentConfig,
                                            carouselInterval: val === '' ? '' : parseInt(val) || '',
                                          },
                                        }));
                                      }}
                                      className="w-10 bg-transparent text-right text-[10px] font-bold outline-none border-b border-brand-main/20 focus:border-brand-main"
                                    />
                                  </div>
                                </div>

                                {/* Custom Events Section */}
                                <div>
                                  <div className="flex flex-col gap-2 mb-2 mt-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                      Eventos do Calendário
                                    </label>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const items = currentConfig.customEvents || [];
                                          const today = new Date().toISOString().split('T')[0];
                                          setRegionConfig((prev) => ({
                                            ...prev,
                                            [region.id]: {
                                              ...currentConfig,
                                              customEvents: [...items, { date: today, name: '' }],
                                            },
                                          }));
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-main/10 text-brand-main hover:bg-brand-main hover:text-white transition-all text-[9px] font-black uppercase tracking-wider group border border-brand-main/20 active:scale-95"
                                      >
                                        <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-300" />
                                        ADICIONAR MANUAL
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const year = new Date().getFullYear();
                                          const month = new Date().getMonth();
                                          const holidays = getBrazilianHolidays(year).filter(
                                            (h) => {
                                              const hDate = new Date(h.date + 'T12:00:00');
                                              return hDate.getMonth() === month;
                                            },
                                          );
                                          const currentEvents = currentConfig.customEvents || [];
                                          const newEvents = holidays.filter(
                                            (h) =>
                                              !currentEvents.some(
                                                (e: { date: string; name: string }) =>
                                                  e.date === h.date && e.name === h.name,
                                              ),
                                          );

                                          if (newEvents.length === 0) {
                                            notifySuccess(
                                              'Datas Atualizadas',
                                              'As datas do mês já foram geradas!',
                                            );
                                            return;
                                          }

                                          setRegionConfig((prev) => ({
                                            ...prev,
                                            [region.id]: {
                                              ...currentConfig,
                                              customEvents: [...currentEvents, ...newEvents],
                                            },
                                          }));
                                          notifySuccess(
                                            'Geração Concluída',
                                            `${newEvents.length} datas geradas para este mês!`,
                                          );
                                        }}
                                        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-wider group border border-blue-500/20 active:scale-95"
                                      >
                                        <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                                        GERAR DO MÊS
                                      </button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {(currentConfig.customEvents || []).map(
                                      (event: { date: string; name: string }, idx: number) => (
                                        <div key={idx} className="flex gap-2">
                                          <input
                                            type="date"
                                            value={event.date}
                                            onChange={(e) => {
                                              const items = [...(currentConfig.customEvents || [])];
                                              items[idx] = { ...items[idx], date: e.target.value };
                                              setRegionConfig((prev) => ({
                                                ...prev,
                                                [region.id]: {
                                                  ...currentConfig,
                                                  customEvents: items,
                                                },
                                              }));
                                            }}
                                            className={cn(
                                              'w-32.5 px-2 py-1.5 border rounded-lg text-xs outline-none transition-all',
                                              theme === 'dark'
                                                ? 'bg-black/20 border-white/10 text-white'
                                                : 'bg-white border-slate-200 text-slate-800',
                                            )}
                                          />
                                          <input
                                            type="text"
                                            value={event.name}
                                            onChange={(e) => {
                                              const items = [...(currentConfig.customEvents || [])];
                                              items[idx] = { ...items[idx], name: e.target.value };
                                              setRegionConfig((prev) => ({
                                                ...prev,
                                                [region.id]: {
                                                  ...currentConfig,
                                                  customEvents: items,
                                                },
                                              }));
                                            }}
                                            placeholder="Nome do Evento..."
                                            className={cn(
                                              'flex-1 px-3 py-1.5 border rounded-lg text-xs outline-none transition-all',
                                              theme === 'dark'
                                                ? 'bg-black/20 border-white/10 text-white'
                                                : 'bg-white border-slate-200 text-slate-800',
                                            )}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const items = [...(currentConfig.customEvents || [])];
                                              items.splice(idx, 1);
                                              setRegionConfig((prev) => ({
                                                ...prev,
                                                [region.id]: {
                                                  ...currentConfig,
                                                  customEvents: items,
                                                },
                                              }));
                                            }}
                                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ),
                                    )}
                                    {(currentConfig.customEvents || []).length === 0 && (
                                      <div className="text-center py-3 border border-dashed border-slate-200 dark:border-white/10 rounded-xl text-[10px] text-slate-400 uppercase tracking-widest">
                                        Nenhum evento manual adicionado
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </details>
              )}

              {layout !== 'single' && (
                // Multi-zone Composer
                <div className="animate-fadeIn">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-brand-main" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Editor de Camadas
                    </span>
                  </div>
                  <div
                    className={cn(
                      'rounded-xl border p-1 transition-all',
                      theme === 'dark' ? 'border-white/5 bg-black/20' : 'border-slate-200 bg-white',
                    )}
                  >
                    <ZoneComposer
                      key={`${layout}-${composerKey}`}
                      layout={layout}
                      onZonesChange={setZoneDraft}
                      initialZones={zoneDraft}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* LAYOUT TAB */}
            <div className={activeTab === 'layout' ? 'animate-fadeIn space-y-6 pb-4' : 'hidden'}>
              <MediaConfigLayoutTab
                layout={layout}
                layoutTemplateId={layoutTemplateId}
                setLayout={setLayout}
                setLayoutTemplateId={setLayoutTemplateId}
                setComposerKey={setComposerKey}
                setActiveTab={handleTabChange}
                theme={theme}
              />
            </div>

            {/* SCHEDULE TAB */}
            <div className={activeTab === 'schedule' ? 'animate-fadeIn space-y-6' : 'hidden'}>
              <MediaConfigScheduleTab
                scheduleEnabled={scheduleEnabled}
                setScheduleEnabled={setScheduleEnabled}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
                daysOfWeek={daysOfWeek}
                setDaysOfWeek={setDaysOfWeek}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
                allDay={allDay}
                setAllDay={setAllDay}
                theme={theme}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className={cn(
            'p-4 border-t shrink-0 flex justify-end gap-3',
            theme === 'dark' ? 'bg-white/2 border-white/5' : 'bg-white border-slate-100',
          )}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-brand-main hover:bg-brand-main/90 text-white text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-brand-main/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            {initialItem ? 'Salvar Alterações' : 'Criar Mídia'}
          </button>
        </div>
      </div>

      {/* Gallery Modal */}
      {/* Modal is fixed with high z-index to overlay editor */}
      {showGalleryModal && (
        <div className="fixed inset-0 z-8000 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div
            className={cn(
              'w-full max-w-5xl h-[80vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl transition-all',
              // Adapts to dark/light theme
              theme === 'dark'
                ? 'bg-[#05100e] border border-white/10'
                : 'bg-white border border-slate-200',
            )}
          >
            <div
              className={cn(
                'p-4 border-b flex items-center justify-between shrink-0',
                theme === 'dark' ? 'border-white/10' : 'border-slate-200',
              )}
            >
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-brand-main" />
                <h3
                  className={cn(
                    'font-bold text-lg',
                    theme === 'dark' ? 'text-white' : 'text-slate-800',
                  )}
                >
                  Galeria de Mídia
                </h3>
              </div>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>
            {/* Reuse MediaGallery component for consistency */}
            <div className="flex-1 overflow-hidden p-4">
              <MediaGallery onSelect={handleGallerySelect} className="h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  ) : null;
}
