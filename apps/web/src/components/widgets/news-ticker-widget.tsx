'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/lib/theme-store';

export interface NewsTickerConfig {
  newsItems?: string[];
  speed?: number; // pixels per second
  backgroundColor?: string;
  textColor?: string;
  showClock?: boolean;
  useRss?: boolean;
  rssFeedUrl?: string;
  theme?: 'light' | 'dark';
  feedTitle?: string;
  density?: 'comfortable' | 'compact';
}

interface NewsTickerWidgetProps {
  config: NewsTickerConfig;
  className?: string;
}

export function NewsTickerWidget({ config, className }: NewsTickerWidgetProps) {
  const { theme: systemTheme } = useThemeStore();
  const [newsItems, setNewsItems] = useState<string[]>(config.newsItems || []);
  const [currentTime, setCurrentTime] = useState(new Date());
  const tickerRef = useRef<HTMLDivElement>(null);
  const [_error, setError] = useState<string | null>(null);

  // Determine theme
  const effectiveTheme = config.theme || systemTheme;
  const density = config.density || 'comfortable';
  const requestedBackground =
    typeof config.backgroundColor === 'string' ? config.backgroundColor.trim() : '';
  const isOpaqueThemeBackground =
    requestedBackground === 'var(--bg-main)' ||
    requestedBackground === 'var(--color-brand-main)' ||
    requestedBackground === 'var(--brand-main)';
  const hasCustomBackground = requestedBackground.length > 0;
  const hasCustomText = typeof config.textColor === 'string' && config.textColor.trim().length > 0;
  const usesThemeVars =
    (typeof config.backgroundColor === 'string' && config.backgroundColor.includes('var(')) ||
    (typeof config.textColor === 'string' && config.textColor.includes('var('));
  const hasCustomColors = (hasCustomBackground || hasCustomText) && !usesThemeVars;

  useEffect(() => {
    // Update time every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchRssNews = useCallback(async () => {
    if (!config.rssFeedUrl) return;

    try {
      setError(null);

      // fetch from our own internal API proxy to bypass CORS
      // The API now handles Auto-Discovery (finding RSS links in HTML pages)
      const response = await fetch(`/api/rss?url=${encodeURIComponent(config.rssFeedUrl)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch RSS: ${response.status}`);
      }

      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

      // Try standard RSS item title
      let items = Array.from(xmlDoc.querySelectorAll('item > title')).map(
        (el) => el.textContent || '',
      );

      // Fallback for Atom feeds (entry > title)
      if (items.length === 0) {
        items = Array.from(xmlDoc.querySelectorAll('entry > title')).map(
          (el) => el.textContent || '',
        );
      }

      if (items.length > 0) {
        // Filter out empty strings and limit to 15 items
        const validItems = items.filter((t) => t.trim().length > 0).slice(0, 15);
        setNewsItems(validItems);
      } else {
        throw new Error('No news items found in feed');
      }
    } catch (_err) {
      const errorMessage = (_err as Error).message || 'Erro desconhecido';
      console.error('[NewsTicker] Error loading RSS:', _err);
      setError(`Erro: ${errorMessage}`);
      // Set error in news items so it shows in ticker
      setNewsItems([`⚠️ ${errorMessage}`, `URL: ${truncateUrl(config.rssFeedUrl!)}`]);
    }
  }, [config]);

  useEffect(() => {
    // Fetch RSS if enabled
    if (config.useRss && config.rssFeedUrl) {
      void fetchRssNews();
    } else {
      setNewsItems(config.newsItems || []);
      setError(null);
    }
  }, [config, fetchRssNews]);

  const truncateUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname +
        (urlObj.pathname.length > 10 ? urlObj.pathname.substring(0, 15) + '...' : urlObj.pathname)
      );
    } catch (_e) {
      return url.substring(0, 20) + '...';
    }
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = () => {
    return currentTime
      .toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
      .toUpperCase();
  };

  return (
    <div
      className={cn(
        'font-bold flex items-center overflow-hidden relative transition-all duration-500 h-full max-h-full bg-transparent',
        config.theme === 'light' ? 'text-slate-900! border-none' : 'text-brand-main',
        density === 'compact' ? 'gap-6 px-6 py-2' : 'gap-8 px-12 py-5',
        className,
      )}
      style={{
        backgroundColor:
          hasCustomBackground && !isOpaqueThemeBackground ? config.backgroundColor : undefined,
        color: hasCustomText ? config.textColor : undefined,
      }}
    >
      {/* Ambient background glow */}
      {hasCustomColors ? (
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-foreground/30 to-transparent" />
      ) : (
        <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-brand-main/40 to-transparent shadow-[0_-4px_12px_rgb(var(--bg-main-rgb)/0.25)]" />
      )}

      {/* Time Badge - Minimal & Technical */}
      {config.showClock !== false && (
        <div
          className={cn(
            'flex items-center shrink-0 border-r',
            hasCustomColors ? 'border-white/20' : 'border-brand-main/20 dark:border-white/10',
            density === 'compact' ? 'gap-2 py-0.5 pr-4' : 'gap-3 py-1 pr-6',
          )}
        >
          <Clock
            className={cn(
              hasCustomColors ? 'opacity-80' : 'text-brand-main opacity-80',
              density === 'compact' ? 'w-8 h-8' : 'w-12 h-12',
            )}
          />
          <div className="flex flex-col leading-none justify-center">
            <span
              className={cn(
                'font-black tracking-tighter',
                hasCustomColors ? '' : 'text-slate-900 dark:text-white',
                density === 'compact'
                  ? 'text-[clamp(24px,2.4vw,32px)]'
                  : 'text-5xl laptop:text-7xl',
              )}
            >
              {formatTime()}
            </span>
          </div>
        </div>
      )}

      {/* News Ticker Label - Small & Sharp */}
      <div
        className={cn(
          'font-black uppercase tracking-[0.2em] shrink-0 pr-2 border-r flex items-center',
          hasCustomColors
            ? 'border-white/20'
            : 'text-brand-main border-brand-main/20 dark:border-white/10',
          density === 'compact'
            ? 'text-[clamp(12px,1.2vw,14px)] h-6'
            : 'text-2xl laptop:text-3xl h-16',
        )}
      >
        {config.feedTitle || 'RADAR PLAYSYNC'}
      </div>

      {/* Scrolling News - Clean Typography */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div
          key={`${newsItems.length}-${config.density}`}
          ref={tickerRef}
          className={cn(
            'flex whitespace-nowrap',
            'animate-scroll-ticker',
            density === 'compact' ? 'gap-24' : 'gap-48',
          )}
          style={{
            animationDuration: `${Math.max(10, (newsItems.length || 1) * 50)}s`,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            animationName: 'scroll-ticker',
          }}
        >
          {newsItems.map((news, idx) => (
            <span
              key={idx}
              className={cn(
                'font-bold tracking-wide flex items-center',
                hasCustomColors ? '' : 'text-slate-800 dark:text-white/90',
                density === 'compact'
                  ? 'text-[clamp(16px,1.6vw,20px)] gap-6'
                  : 'text-[26px] laptop:text-[34px] gap-20',
              )}
            >
              {news}
              <span
                className={cn(
                  'rounded-full',
                  hasCustomColors ? 'bg-white/50' : 'bg-brand-main/40',
                  density === 'compact' ? 'w-2.5 h-2.5' : 'w-4 h-4',
                )}
              />
            </span>
          ))}
          {/* Duplicate for seamless loop */}
          {newsItems.map((news, idx) => (
            <span
              key={`dup-${idx}`}
              className={cn(
                'font-bold tracking-wide flex items-center',
                hasCustomColors ? '' : 'text-slate-800 dark:text-white/90',
                density === 'compact'
                  ? 'text-[clamp(16px,1.6vw,20px)] gap-6'
                  : 'text-[26px] laptop:text-[34px] gap-20',
              )}
            >
              {news}
              <span
                className={cn(
                  'rounded-full',
                  hasCustomColors ? 'bg-white/50' : 'bg-brand-main/40',
                  density === 'compact' ? 'w-2.5 h-2.5' : 'w-4 h-4',
                )}
              />
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll-ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
