"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DateTimeWidgetConfig } from '@/lib/layout-templates';

interface DateTimeWidgetProps {
    config: DateTimeWidgetConfig;
    className?: string;
}

export function DateTimeWidget({ config, className }: DateTimeWidgetProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, config.showSeconds ? 1000 : 60000); // Update every second if showing seconds, else every minute

        return () => clearInterval(interval);
    }, [config.showSeconds]);

    const timeFormat = config.format === '12h'
        ? (config.showSeconds ? 'hh:mm:ss a' : 'hh:mm a')
        : (config.showSeconds ? 'HH:mm:ss' : 'HH:mm');

    const dateFormat = 'EEEE, dd/MM/yyyy'; // "Segunda-feira, 13/02/2026"

    return (
        <div
            className={cn(
                "flex flex-col justify-center items-center h-full w-full transition-all duration-500 bg-transparent",
                (config.theme || 'dark') === 'light' ? "!text-slate-900" : "dark:!text-white",
                className
            )}
        >
            {/* Time Display - Minimal & Precision Focused */}
            {config.showTime && (
                <div className="flex flex-col items-center group">
                    <div className="text-5xl laptop:text-6xl font-black tracking-tighter tabular-nums leading-none !text-brand-main drop-shadow-[0_0_15px_rgb(var(--bg-main-rgb)/0.15)] subpixel-antialiased transition-all duration-500 group-hover:drop-shadow-[0_0_30px_rgb(var(--bg-main-rgb)/0.3)]">
                        {currentTime.toLocaleTimeString('pt-BR', {
                            timeZone: config.timezone,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: config.showSeconds ? '2-digit' : undefined,
                            hour12: config.format === '12h'
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
