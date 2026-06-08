'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MediaItem } from '@/lib/store';
import { X, Moon, Pause } from 'lucide-react';
import { getLayoutConfig } from '@/lib/layouts';
import { useAnalyticsStore } from '@/lib/analytics-store';
import { getScheduledItems } from '@/lib/scheduler';
import { LayoutRenderer } from './layout-renderer';
import { getLayoutTemplate } from '@/lib/layout-templates';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/lib/theme-store';
import { unlockAutoplay } from '@/lib/autoplay-unlock';
import { YoutubeIFrameApiPlayer } from './youtube-iframe-api-player';
import { VideoPlayer } from './video-player';
import { ImageWithFallback } from './image-with-fallback';
import { WebFrame } from './web-frame';

interface FullscreenPlayerProps {
  items: MediaItem[];
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
  companyId?: string;
  playlistName?: string;
  playlistId: string;
  forcedTheme?: 'light' | 'dark';
  forcedPrimaryColor?: string;
}

type YoutubePlayerConfig = {
  startSeconds?: number;
  volume?: number;
  muted?: boolean;
  playbackRate?: number;
  quality?: string;
  captionsEnabled?: boolean;
  captionsLang?: string;
  controls?: boolean;
};

export function FullscreenPlayer({
  items,
  isOpen,
  onClose,
  companyName = '',
  companyId,
  playlistName = '',
  playlistId,
  forcedTheme,
  forcedPrimaryColor,
}: FullscreenPlayerProps) {
  const { theme: storeTheme, primaryColor: storePrimaryColor } = useThemeStore();
  const theme = forcedTheme || storeTheme;
  const primaryColor = forcedPrimaryColor || storePrimaryColor;
  const rootRef = useRef<HTMLDivElement>(null);
  const [validItems, setValidItems] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [stage, setStage] = useState<{ width: number; height: number } | null>(null);
  const { trackMediaPlay } = useAnalyticsStore();

  const handleClose = () => {
    onClose();
    setIsPaused(false);
  };

  useEffect(() => {
    if (isOpen && items.length > 0) {
      const scheduled = getScheduledItems(items);
      setValidItems(scheduled.length > 0 ? scheduled : items);
      setCurrentIndex(0);
      setIsPaused(false);
      // Redundancy: ensure autoplay is unlocked when player opens (TV/kiosk scenario)
      unlockAutoplay();
    } else if (!isOpen) {
      setValidItems([]);
    }
  }, [isOpen, items]);

  useEffect(() => {
    const updateStage = () => {
      if (typeof window !== 'undefined') {
        setStage({ width: window.innerWidth, height: window.innerHeight });
      }
    };
    updateStage();
    window.addEventListener('resize', updateStage);
    return () => window.removeEventListener('resize', updateStage);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const resetTimeout = () => {
      setShowControls(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setShowControls(false), 3000);
    };
    if (isOpen) {
      window.addEventListener('mousemove', resetTimeout);
      window.addEventListener('keydown', resetTimeout);
      resetTimeout();
    }
    return () => {
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keydown', resetTimeout);
      clearTimeout(timeout);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || validItems.length <= 1 || isPaused) return;

    const currentItem = validItems[currentIndex];
    const duration = (currentItem?.duration || 10) * 1000;

    const timer = setTimeout(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % validItems.length);
        setLoopCount((prev) => prev + 1);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [isOpen, validItems, currentIndex, isPaused]);

  useEffect(() => {
    if (!isOpen || !validItems[currentIndex] || isPaused) return;

    const item = validItems[currentIndex];
    trackMediaPlay(
      item.id,
      item.name,
      item.duration,
      companyName || 'Unknown Company',
      playlistName || 'Unknown Playlist',
      companyId,
      playlistId,
    );
  }, [
    currentIndex,
    loopCount,
    isOpen,
    isPaused,
    validItems,
    companyId,
    playlistId,
    companyName,
    playlistName,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  if (validItems.length === 0) {
    return (
      <div
        className={cn(
          'fixed inset-0 z-9999 flex items-center justify-center transition-colors duration-500',
          theme === 'dark' ? 'bg-black' : 'bg-white',
          !showControls && 'cursor-none',
        )}
      >
        <button
          onClick={handleClose}
          className={cn(
            'absolute top-5 right-5 z-10000 text-white px-4 py-2 rounded-full font-bold text-sm transition-opacity duration-300 flex items-center gap-2 shadow-2xl',
            'bg-red-600 hover:bg-red-700',
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
        >
          <X className="w-5 h-5" />
          <span>SAIR</span>
        </button>

        <div
          className={cn(
            'absolute bottom-5 right-5 flex items-center gap-2 text-xs select-none transition-opacity duration-500',
            theme === 'dark' ? 'text-white/20' : 'text-slate-400',
            showControls ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Moon className="w-4 h-4" />
          <span>Modo de Espera</span>
        </div>
      </div>
    );
  }

  const currentItem = validItems[currentIndex];

  if (!currentItem) {
    console.warn('[FullscreenPlayer] No current item, returning null');
    return null;
  }

  if (!currentItem.id) {
    console.error('[FullscreenPlayer] Current item missing ID:', currentItem);
    return null;
  }

  const layout = currentItem.layout || 'single';
  const layoutConfig = getLayoutConfig(layout);
  const slots = layoutConfig?.slots || 1;

  const getGridTemplate = () => {
    switch (layout) {
      case 'grid-2x2':
        return 'grid-cols-2 grid-rows-2';
      case 'horizontal-2':
        return 'grid-cols-2 grid-rows-1';
      case 'horizontal-3':
        return 'grid-cols-3 grid-rows-1';
      case 'vertical-2':
        return 'grid-cols-1 grid-rows-2';
      case 'vertical-3':
        return 'grid-cols-1 grid-rows-3';
      case 'split-left':
        return 'grid-cols-[2fr_1fr] grid-rows-2';
      case 'split-right':
        return 'grid-cols-[1fr_2fr] grid-rows-2';
      default:
        return 'grid-cols-1 grid-rows-1';
    }
  };

  let gridItems: ({
    type: string;
    url: string;
    name: string;
    id?: string;
    rotation?: number;
  } | null)[] = [];

  if (currentItem.zones && currentItem.zones.length > 0) {
    gridItems = currentItem.zones as typeof gridItems;
  } else {
    if (slots > 1) {
      const slice = validItems.slice(currentIndex, currentIndex + slots);
      while (slice.length < slots && validItems.length > 0) {
        slice.push(validItems[slice.length % validItems.length]);
      }
      gridItems = slice;
    } else {
      gridItems = [currentItem];
    }
  }

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

  const renderInnerContent = (
    type: string,
    url: string,
    name: string,
    rotation: number = 0,
    regionConfig?: Record<string, unknown>,
  ) => {
    const safeUrl = url;

    let effectiveType = type;
    const looksLikeImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|#|$)/i.test(url || '');
    const looksLikeVideo = /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url || '');

    if (
      url &&
      (url.includes('youtube.com') ||
        url.includes('youtu.be') ||
        url.includes('youtube-nocookie.com') ||
        url.includes('/embed/') ||
        /^[a-zA-Z0-9_-]{11}$/.test(url.trim()))
    ) {
      effectiveType = 'youtube';
    }
    if (effectiveType === 'web' && looksLikeImage) effectiveType = 'image';
    if (effectiveType === 'web' && looksLikeVideo) effectiveType = 'video';

    if (
      effectiveType !== 'youtube' &&
      effectiveType !== 'image' &&
      effectiveType !== 'video' &&
      url &&
      (url.startsWith('http://') || url.startsWith('https://'))
    ) {
      effectiveType = 'web';
    }

    if (effectiveType === 'video') {
      return (
        <VideoPlayer
          url={safeUrl}
          isMuted={isMuted}
          isPaused={isPaused}
          rotation={rotation}
          showControls={showControls}
        />
      );
    }

    if (effectiveType === 'image') {
      return <ImageWithFallback src={safeUrl} alt={name} rotation={rotation} theme={theme} />;
    }

    if (effectiveType === 'youtube') {
      const ytConfig =
        (regionConfig && (regionConfig.__youtube as Partial<YoutubePlayerConfig> | undefined)) ||
        undefined;
      const videoId = parseYoutubeVideoId(safeUrl);
      if (!videoId) {
        return (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            Link do YouTube inválido
          </div>
        );
      }
      return (
        <YoutubeIFrameApiPlayer
          videoId={videoId}
          title={name}
          rotation={rotation}
          config={ytConfig}
          isPaused={isPaused}
          globalMuted={isMuted}
          theme={theme}
        />
      );
    }

    if (effectiveType === 'web') {
      return (
        <WebFrame src={safeUrl} title={name || 'Web Content'} rotation={rotation} theme={theme} />
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center text-white/50">
        Unsupported Media Type
      </div>
    );
  };

  const renderMediaItem = (
    item: {
      type: string;
      url: string;
      name: string;
      rotation?: number;
      layoutTemplateId?: string;
      regionConfig?: Record<string, unknown>;
    } | null,
    index: number,
  ) => {
    if (!item || (!item.url && !item.layoutTemplateId)) {
      console.warn('[FullscreenPlayer] Skipping item without URL:', item);
      return (
        <div
          key={index}
          className="flex items-center justify-center bg-gray-900 text-white/30 text-sm border border-white/5 w-full h-full"
        >
          <span>Mídia indisponível</span>
        </div>
      );
    }

    let slotClass = '';

    if (layout === 'split-left') {
      if (index === 0) slotClass = 'row-span-2 col-start-1';
      else slotClass = 'col-start-2';
    } else if (layout === 'split-right') {
      if (index === 0) slotClass = 'row-span-2 col-start-2';
      else slotClass = 'col-start-1';
    }

    const isVideo =
      item.type === 'video' ||
      item.type === 'youtube' ||
      (item.url &&
        (item.url.includes('youtube.com') ||
          item.url.includes('youtu.be') ||
          item.url.includes('youtube-nocookie.com') ||
          item.url.includes('/embed/') ||
          /^[a-zA-Z0-9_-]{11}$/.test(item.url.trim())));

    return (
      <div
        key={`${item.url}-${index}`}
        className={cn(
          'relative w-full h-full overflow-hidden transition-colors duration-500',
          theme === 'dark' ? 'bg-black' : 'bg-white',
          slotClass,
          isVideo ? 'cursor-pointer group' : '',
        )}
        onClick={(e) => {
          if (isVideo) {
            e.stopPropagation();
            setIsPaused(!isPaused);
          }
        }}
      >
        {isPaused && isVideo && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 pointer-events-none transition-opacity duration-300">
            <Pause className="w-16 h-16 text-white/80 drop-shadow-lg animate-pulse" />
          </div>
        )}

        {renderInnerContent(item.type, item.url, item.name, item.rotation, item.regionConfig)}
      </div>
    );
  };

  const template = currentItem.layoutTemplateId
    ? getLayoutTemplate(currentItem.layoutTemplateId)
    : null;

  const mediaContent = (
    <div className={`w-full h-full grid ${getGridTemplate()}`}>
      {Array.from({ length: slots }).map((_, index) => {
        const item = gridItems[index] || null;
        return renderMediaItem(item, index);
      })}
    </div>
  );

  const forcedStyle = forcedPrimaryColor
    ? ({
        '--bg-main': forcedPrimaryColor,
        '--ring': forcedPrimaryColor,
        '--bg-main-rgb': `${hexToRgb(forcedPrimaryColor)?.r} ${hexToRgb(forcedPrimaryColor)?.g} ${hexToRgb(forcedPrimaryColor)?.b}`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      ref={rootRef}
      className={cn(
        'fixed inset-0 z-9999 flex items-center justify-center transition-colors duration-500',
        theme === 'dark' ? 'dark bg-black' : 'light bg-white',
        !showControls && 'cursor-none',
      )}
      style={forcedStyle}
    >
      <div
        className={cn(
          'absolute inset-0 pointer-events-none opacity-80',
          theme === 'dark'
            ? 'bg-[radial-gradient(900px_circle_at_50%_35%,rgb(var(--bg-main-rgb)/0.22),transparent_62%)]'
            : 'bg-[radial-gradient(900px_circle_at_50%_35%,rgb(var(--bg-main-rgb)/0.08),transparent_62%)]',
        )}
      />

      <div
        className={cn(
          'absolute inset-0 pointer-events-none',
          theme === 'dark'
            ? 'bg-linear-to-b from-white/6 via-transparent to-black/30'
            : 'bg-linear-to-b from-black/2 via-transparent to-black/5',
        )}
      />

      <button
        onClick={handleClose}
        className={cn(
          'absolute top-5 right-5 z-10000 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-2xl backdrop-blur-md border',
          'bg-red-600/90 hover:bg-red-700 text-white border-white/10',
          showControls
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-10 pointer-events-none',
        )}
      >
        <X className="w-5 h-5" /> SAIR (ESC)
      </button>

      <div className="relative w-full h-full z-0 flex items-center justify-center">
        <div
          className={cn(
            'relative w-full h-full overflow-hidden transition-all duration-300 border-white/10 dark:border-white/5',
            isTransitioning ? 'opacity-0 scale-105' : 'opacity-100 scale-100',
            theme === 'dark' ? 'bg-black' : 'bg-white',
          )}
          style={{
            width: stage ? `${stage.width}px` : '100%',
            height: stage ? `${stage.height}px` : '100%',
          }}
        >
          {template ? (
            <LayoutRenderer
              template={template}
              content={mediaContent}
              regionOverrides={currentItem.regionConfig}
              forcedTheme={theme}
              forcedPrimaryColor={primaryColor}
              className="absolute inset-0"
            />
          ) : (
            mediaContent
          )}
        </div>
      </div>

      <div
        className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 premium-glass px-8 py-3 rounded-2xl text-xs font-bold tracking-widest uppercase shadow-2xl border border-white/10 transition-all duration-500 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      >
        <div className="flex items-center gap-4 text-white/90">
          <span className="text-brand-main">
            ITEM {currentIndex + 1} / {validItems.length}
          </span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span>{layoutConfig?.name || template?.name || 'FULL SCREEN'}</span>
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const normalized = hex.replace(/^#/, '');
  const fullHex =
    normalized.length === 3
      ? normalized[0] +
        normalized[0] +
        normalized[1] +
        normalized[1] +
        normalized[2] +
        normalized[2]
      : normalized;

  const r = parseInt(fullHex.slice(0, 2), 16);
  const g = parseInt(fullHex.slice(2, 4), 16);
  const b = parseInt(fullHex.slice(4, 6), 16);

  return { r, g, b };
}
