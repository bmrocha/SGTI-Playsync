"use client";

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AlertCircle, Info, Megaphone } from 'lucide-react';
import type { MessageWidgetConfig } from '@/lib/layout-templates';

interface MessageWidgetProps {
    config: MessageWidgetConfig;
    className?: string;
}

export function MessageWidget({ config, className }: MessageWidgetProps) {
    // Icon based on message type
    const Icon = config.type === 'warning' ? AlertCircle :
        config.type === 'campaign' ? Megaphone : Info;

    const requestedBackground = typeof config.backgroundColor === 'string' ? config.backgroundColor.trim() : '';
    const isOpaqueThemeBackground =
        requestedBackground === 'var(--bg-main)' ||
        requestedBackground === 'var(--color-brand-main)' ||
        requestedBackground === 'var(--brand-main)';
    const bgIsCustom = requestedBackground.length > 0 && !isOpaqueThemeBackground;
    const bgIsThemeTint = isOpaqueThemeBackground;
    const textIsCustom = !!config.textColor;
    const messageFontSize =
        config.display === 'fullscreen'
            ? undefined
            : typeof config.fontSize === 'number'
                ? `clamp(12px, 1.4vw, ${config.fontSize}px)`
                : undefined;
    const messageFontWeight =
        config.display === 'fullscreen'
            ? undefined
            : config.fontWeight;

    // Animation variants (omitted for brevity, copied from original)
    const animations = {
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            transition: { duration: config.animationDuration || 0.5 }
        },
        slide: {
            initial: { x: -100, opacity: 0 },
            animate: { x: 0, opacity: 1 },
            transition: {
                type: 'spring',
                stiffness: 100,
                duration: config.animationDuration || 0.5
            }
        },
        bounce: {
            initial: { scale: 0, opacity: 0 },
            animate: { scale: 1, opacity: 1 },
            transition: {
                type: 'spring',
                bounce: 0.5,
                duration: config.animationDuration || 0.8
            }
        },
        none: {}
    };

    const selectedAnimation = animations[config.animation as keyof typeof animations] || animations.none;

    // Display mode styles
    const displayStyles: Record<NonNullable<MessageWidgetConfig['display']>, string> = {
        banner: "w-full",
        fullscreen: "w-full h-full items-center justify-center text-center",
        overlay: "w-auto max-w-2xl py-4 px-8"
    };

    // Safety for display style access
    const displayStyle = displayStyles[config.display || 'banner'];
    const chromeStyle =
        config.display === 'overlay'
            ? 'rounded-2xl border border-white/20 dark:border-white/10 shadow-lg'
            : 'rounded-none border-y border-white/20 dark:border-white/10 shadow-sm';

    return (
        <motion.div
            {...selectedAnimation}
            className={cn(
                "transition-all duration-500 bg-transparent h-full w-full",
                !textIsCustom && (config.theme === 'light' ? "text-slate-900" : "text-slate-800 dark:text-white"),
                "relative flex items-center justify-center px-6 py-1 overflow-hidden min-w-0 min-h-0",
                displayStyle,
                className
            )}
            style={{
                backgroundColor: bgIsCustom ? config.backgroundColor : undefined,
                color: textIsCustom ? config.textColor : undefined,
            }}
        >
            {/* Rótulo lateral esquerdo - Fixo no canto */}
            <div className="absolute left-8 flex items-center gap-3 flex-shrink-0 z-10 select-none">
                <div className="relative flex h-2.5 w-2.5">
                    <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-main opacity-40"></div>
                    <div className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-main"></div>
                </div>
                <span className={cn(
                    "text-[11px] laptop:text-sm font-black uppercase tracking-[0.3em] leading-none whitespace-nowrap",
                    textIsCustom
                        ? "text-current opacity-60"
                        : config.type === 'warning'
                            ? "text-red-500"
                            : "text-brand-main dark:text-brand-main/80"
                )}>
                    {config.type === 'warning' ? 'ALERTA' :
                        config.type === 'campaign' ? 'CAMPANHA ATIVA' : 'INFORMAÇÃO'}
                </span>
            </div>

            {/* Container Centralizado - Mensagem principal */}
            <div className="flex items-center gap-5 max-w-[75%] min-w-0">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-500 hover:scale-110",
                    config.type === 'warning' ? "bg-red-500/20 text-red-600 dark:text-red-400" :
                        config.type === 'campaign' ? "bg-brand-main/20 text-brand-main dark:text-brand-main" :
                            "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/80"
                )}>
                    <Icon className="w-5.5 h-5.5" />
                </div>

                <p className={cn(
                    "font-bold leading-tight tracking-tight whitespace-nowrap overflow-hidden text-ellipsis italic",
                    textIsCustom ? "text-current" : "text-slate-900 dark:text-white",
                    config.display === 'fullscreen' && "text-5xl font-black italic uppercase !whitespace-normal"
                )}
                    style={{
                        fontSize: messageFontSize || 'min(2vw, 24px)',
                        fontWeight: messageFontWeight as any,
                    }}
                >
                    {config.text}
                </p>
            </div>
        </motion.div>
    );
}
