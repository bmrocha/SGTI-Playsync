'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

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

type YoutubePlayer = {
  destroy: () => void;
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (v: number) => void;
  getPlayerState: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (opts: { videoId: string; startSeconds?: number }) => void;
  addEventListener: (event: string, handler: () => void) => void;
  setPlaybackRate?: (rate: number) => void;
  setPlaybackQuality?: (quality: string) => void;
  loadModule?: (module: string) => void;
  unloadModule?: (module: string) => void;
  setOption?: (module: string, option: string, value: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (element: HTMLElement | string, config: Record<string, unknown>) => YoutubePlayer;
      PlayerState: Record<string, number>;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeIframeApiPromise: Promise<NonNullable<Window['YT']>> | null = null;
const youtubePlayerInstances = new Set<YoutubePlayer>();

const loadYoutubeIframeApi = () => {
  if (typeof window === 'undefined')
    return Promise.reject(new Error('YouTube IFrame API requires a browser environment'));
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (youtubeIframeApiPromise) return youtubeIframeApiPromise;

  youtubeIframeApiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-youtube-iframe-api="true"]');
    const prevReady = window.onYouTubeIframeAPIReady;

    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      resolve(window.YT!);
    };

    if (existing) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    tag.dataset.youtubeIframeApi = 'true';
    tag.onerror = () => {
      reject(new Error('Failed to load YouTube IFrame API'));
    };
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
  });

  return youtubeIframeApiPromise;
};

export function YoutubeIFrameApiPlayer({
  videoId,
  title,
  rotation = 0,
  config,
  isPaused,
  globalMuted,
  theme,
}: {
  videoId: string;
  title: string;
  rotation?: number;
  config?: Partial<YoutubePlayerConfig>;
  isPaused: boolean;
  globalMuted: boolean;
  theme: string;
}) {
  const containerIdRef = useRef(`yt-${Math.random().toString(36).slice(2)}`);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YoutubePlayer | null>(null);
  const readyRef = useRef(false);
  const autoplayFallbackTimerRef = useRef<number | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const effectiveMuted = globalMuted || (config?.muted ?? false);

  const activateAudio = () => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;
    try {
      p.unMute?.();
      p.playVideo?.();
    } catch {}
    setAudioBlocked(false);
  };

  const updateCover = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const container = document.getElementById(containerIdRef.current);
    if (!container) return;

    const iframe = container.querySelector('iframe') as HTMLIFrameElement | null;
    if (!iframe) return;

    const rect = wrapper.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    if (!cw || !ch) return;

    const videoAspect = 16 / 9;
    const containerAspect = cw / ch;
    let w = 0;
    let h = 0;

    if (containerAspect > videoAspect) {
      w = cw;
      h = cw / videoAspect;
    } else {
      h = ch;
      w = ch * videoAspect;
    }

    iframe.style.position = 'absolute';
    iframe.style.top = '50%';
    iframe.style.left = '50%';
    iframe.style.width = `${w}px`;
    iframe.style.height = `${h}px`;
    iframe.style.transform = 'translate(-50%, -50%)';
    iframe.style.maxWidth = 'none';
    iframe.style.maxHeight = 'none';
    iframe.style.border = '0';
  };

  const applyConfig = () => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;

    try {
      if (typeof config?.volume === 'number') {
        const v = Math.max(0, Math.min(100, Math.floor(config.volume)));
        p.setVolume?.(v);
      }
      if (typeof config?.playbackRate === 'number') {
        p.setPlaybackRate?.(config.playbackRate);
      }
      if (config?.quality) {
        p.setPlaybackQuality?.(config.quality);
      }
      if (config?.captionsEnabled) {
        p.loadModule?.('captions');
        const lang = config?.captionsLang || 'pt-BR';
        p.setOption?.('captions', 'track', { languageCode: lang });
      } else {
        p.unloadModule?.('captions');
      }
    } catch {}
  };

  useEffect(() => {
    readyRef.current = false;
    setAudioBlocked(false);
    const prev = playerRef.current;
    if (prev?.destroy) {
      try {
        youtubePlayerInstances.delete(prev);
        prev.destroy();
      } catch {}
    }
    playerRef.current = null;

    let cancelled = false;

    loadYoutubeIframeApi()
      .then((YT) => {
        if (cancelled || !YT) return;

        const origin = window.location.origin;
        const start = Number.isFinite(config?.startSeconds as number)
          ? Math.max(0, Math.floor(config!.startSeconds!))
          : undefined;
        const controls = config?.controls === false ? 0 : 1;

        const player = new YT.Player(containerIdRef.current, {
          host: 'https://www.youtube.com',
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            autoplay: 1,
            mute: effectiveMuted ? 1 : 0,
            controls,
            playsinline: 1,
            fs: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
            origin,
            start,
            hl: 'pt-BR',
            cc_load_policy: config?.captionsEnabled ? 1 : 0,
            cc_lang_pref: config?.captionsLang || 'pt-BR',
          },
          events: {
            onReady: () => {
              if (cancelled) return;
              playerRef.current = player;
              readyRef.current = true;
              youtubePlayerInstances.add(player);

              try {
                if (effectiveMuted) player.mute?.();
                else player.unMute?.();
              } catch {}

              try {
                updateCover();
                window.setTimeout(updateCover, 0);
                window.setTimeout(updateCover, 250);
              } catch {}

              applyConfig();

              if (isPaused) {
                try {
                  player.pauseVideo?.();
                } catch {}
                return;
              }

              try {
                player.playVideo?.();
              } catch {}

              if (autoplayFallbackTimerRef.current !== null) {
                window.clearTimeout(autoplayFallbackTimerRef.current);
              }

              // Early unlock attempt for kiosk/TV environments (no human interaction)
              const earlyUnlockTimer = window.setTimeout(() => {
                if (cancelled) return;
                try {
                  if (!effectiveMuted) {
                    player.unMute?.();
                    player.playVideo?.();
                  }
                } catch {}
              }, 400);

              autoplayFallbackTimerRef.current = window.setTimeout(() => {
                if (cancelled) return;
                try {
                  window.clearTimeout(earlyUnlockTimer);
                } catch {}
                try {
                  const state = player.getPlayerState?.();
                  if (state === YT.PlayerState.PLAYING) return;

                  if (effectiveMuted) {
                    try {
                      player.playVideo?.();
                    } catch {}
                    return;
                  }

                  try {
                    player.unMute?.();
                    player.playVideo?.();
                  } catch {}

                  window.setTimeout(() => {
                    if (cancelled) return;
                    try {
                      const state2 = player.getPlayerState?.();
                      if (state2 === YT.PlayerState.PLAYING) return;
                    } catch {}
                    setAudioBlocked(true);
                    try {
                      player.mute?.();
                      player.playVideo?.();
                    } catch {}
                  }, 800);
                } catch {}
              }, 2800);
            },
            onError: () => {},
          },
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (autoplayFallbackTimerRef.current !== null) {
        window.clearTimeout(autoplayFallbackTimerRef.current);
        autoplayFallbackTimerRef.current = null;
      }
      const p = playerRef.current;
      if (p?.destroy) {
        try {
          youtubePlayerInstances.delete(p);
          p.destroy();
        } catch {}
      }
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;
    try {
      if (isPaused) p.pauseVideo?.();
      else p.playVideo?.();
    } catch {}
  }, [isPaused]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;
    try {
      if (effectiveMuted) p.mute?.();
      else p.unMute?.();
    } catch {}
  }, [effectiveMuted]);

  useEffect(() => {
    applyConfig();
  }, [
    config?.volume,
    config?.playbackRate,
    config?.quality,
    config?.captionsEnabled,
    config?.captionsLang,
  ]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p || !readyRef.current) return;
    if (!Number.isFinite(config?.startSeconds as number)) return;
    const s = Math.max(0, Math.floor(config!.startSeconds!));
    try {
      p.seekTo?.(s, true);
      if (!isPaused) p.playVideo?.();
    } catch {}
  }, [config?.startSeconds, isPaused]);

  useEffect(() => {
    updateCover();

    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const ro = new ResizeObserver(() => updateCover());
    ro.observe(wrapper);

    const onResize = () => updateCover();
    window.addEventListener('resize', onResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', onResize);
    };
  }, [videoId, rotation]);

  return (
    <div
      ref={wrapperRef}
      className={cn(
        'w-full h-full overflow-hidden relative transition-colors duration-500',
        theme === 'dark' ? 'bg-black' : 'bg-white/5',
      )}
      style={{ transform: `rotate(${rotation}deg)` }}
      onPointerDownCapture={(e) => {
        if (!audioBlocked) return;
        e.stopPropagation();
        activateAudio();
      }}
      onClickCapture={(e) => {
        if (!audioBlocked) return;
        e.stopPropagation();
        activateAudio();
      }}
    >
      <div id={containerIdRef.current} className="absolute inset-0" />
      {audioBlocked && (
        <button
          type="button"
          className="absolute inset-x-0 bottom-0 z-50 bg-black/60 text-white px-6 py-4 text-sm font-semibold backdrop-blur-md"
          onClick={(e) => {
            e.stopPropagation();
            activateAudio();
          }}
        >
          Pressione qualquer tecla ou toque para ativar áudio
        </button>
      )}
    </div>
  );
}
