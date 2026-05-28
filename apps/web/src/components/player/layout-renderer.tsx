import React from 'react';
import { LayoutTemplate, RegionType, RegionWidgetType, LayoutRegion } from '@/lib/layout-templates';
import { WeatherWidget, WeatherConfig } from '@/components/widgets/weather-widget';
import { NewsTickerWidget, NewsTickerConfig } from '@/components/widgets/news-ticker-widget';
import { DateTimeWidget } from '@/components/widgets/date-time-widget';
import { MessageWidget } from '@/components/widgets/message-widget';
import { CalendarWidget, CalendarWidgetConfig } from '@/components/widgets/calendar-widget';
import { cn } from '@/lib/utils';
import { DateTimeWidgetConfig, MessageWidgetConfig } from '@/lib/layout-templates';
import { useThemeStore } from '@/lib/theme-store';

interface LayoutRendererProps {
    template: LayoutTemplate;
    content: React.ReactNode; // The main content (image/video) to render in the 'content' region
    className?: string;
    regionOverrides?: Record<string, any>; // User overrides for specific region configs
    forcedTheme?: 'light' | 'dark';
    forcedPrimaryColor?: string;
}

export function LayoutRenderer({ template, content, className, regionOverrides = {}, forcedTheme, forcedPrimaryColor }: LayoutRendererProps) {
    const { theme, primaryColor } = useThemeStore();
    // Sort regions by z-index
    const regions = [...template.regions].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

    const getMergedConfig = (region: LayoutRegion) => ({
        ...region.config,
        ...(regionOverrides[region.id] || {}),
        theme: forcedTheme ?? theme,
        primaryColor: forcedPrimaryColor ?? primaryColor,
    });

    const renderWidget = (region: LayoutRegion, mergedConfig: any) => {
        const config = mergedConfig;

        switch (region.widgetType) {
            case 'weather':
                return <WeatherWidget config={config as WeatherConfig} className="w-full h-full" />;

            case 'news':
                return <NewsTickerWidget config={config as NewsTickerConfig} className="w-full h-full" />;

            case 'clock':
                // DateTimeWidget expects DateTimeWidgetConfig, assuming config matches
                return <DateTimeWidget config={config as DateTimeWidgetConfig} className="w-full h-full" />;

            case 'calendar':
                // New Calendar Widget
                return <CalendarWidget config={config as CalendarWidgetConfig} className="w-full h-full" />;

            case 'message':
                // MessageWidget expects MessageWidgetConfig
                return <MessageWidget config={config as MessageWidgetConfig} className="w-full h-full" />;

            case 'media':
                // This is the placeholder for the main content passed via props
                return <div className="w-full h-full overflow-hidden">{content}</div>;

            default:
                return null;
        }
    };

    return (
        <div className={cn("relative w-full h-full bg-transparent overflow-hidden p-2", className)}>
            {regions.map((region) => (
                (() => {
                    const mergedConfig = getMergedConfig(region);
                    const hasWidgetCustomBg =
                        typeof mergedConfig?.backgroundColor === 'string' && mergedConfig.backgroundColor.trim().length > 0;
                    const showContainerBg =
                        region.widgetType !== 'media' &&
                        region.type !== 'header' &&
                        region.type !== 'ticker' &&
                        !hasWidgetCustomBg;

                    return (
                <div
                    key={region.id}
                    className={cn(
                        "absolute",
                        (region.type === 'header' || region.type === 'ticker')
                            ? "p-0.5"
                            : "p-1.5"
                    )}
                    style={{
                        left: `${region.position.x}%`,
                        top: `${region.position.y}%`,
                        width: `${region.position.width}%`,
                        height: `${region.position.height}%`,
                        zIndex: region.zIndex || 1,
                    }}
                >
                    <div className={cn(
                        "relative w-full h-full overflow-hidden",
                        (mergedConfig.theme || theme) === 'light' 
                            ? "rounded-[2.5rem] shadow-sm border border-slate-200/60 bg-white" 
                            : "rounded-2xl shadow-lg border border-white/10 dark:border-white/5",
                        region.widgetType === 'media' && "bg-black/10"
                    )}>
                        {/* Dynamic Background Layer */}
                        {showContainerBg && (
                            <>
                                {/* Background Base */}
                                <div className={cn(
                                    "absolute inset-0 z-0",
                                    (mergedConfig.theme || theme) === 'light'
                                        ? "bg-white"
                                        : "bg-white/80 dark:bg-black/45 backdrop-blur-2xl shadow-[0_15px_45px_rgba(0,0,0,0.25)] border-white/30 dark:border-white/10"
                                )} />
                                
                                {/* Color Tints - ONLY in Dark Mode or if explicitly requested */}
                                {(mergedConfig.theme || theme) !== 'light' && (
                                    <>
                                        <div className="absolute inset-0 bg-[rgb(var(--bg-main-rgb)/0.15)] dark:bg-[rgb(var(--bg-main-rgb)/0.10)] z-0 mix-blend-multiply dark:mix-blend-soft-light opacity-60" />
                                        <div className="absolute inset-0 bg-[radial-gradient(500px_circle_at_20%_15%,rgb(var(--bg-main-rgb)/0.25),transparent_70%)] opacity-70 z-0" />
                                        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-transparent via-[rgb(var(--bg-main-rgb)/0.4)] to-transparent z-10 opacity-30" />
                                    </>
                                )}
                            </>
                        )}

                        {/* Dynamic Content Layer */}
                        <div className="relative z-10 w-full h-full">
                            {renderWidget(region, mergedConfig)}
                        </div>
                    </div>
                </div>
                    );
                })()
            ))}
        </div >
    );
}
