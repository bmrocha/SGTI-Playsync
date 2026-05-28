"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function WebFrame({ src, title, rotation = 0, theme }: { src: string; title: string; rotation?: number; theme: string }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [showSlowMessage, setShowSlowMessage] = useState(false);

    useEffect(() => {
        setIsLoaded(false);
        setShowSlowMessage(false);

        const slowTimer = setTimeout(() => setShowSlowMessage(true), 2000);
        return () => clearTimeout(slowTimer);
    }, [src]);

    const shouldSandbox = (() => {
        try {
            if (typeof window === 'undefined') return true;
            const url = new URL(src, window.location.href);
            return url.origin !== window.location.origin;
        } catch {
            return true;
        }
    })();

    return (
        <div className={cn(
            "w-full h-full relative overflow-hidden transition-colors duration-500",
            theme === 'dark' ? "bg-black" : "bg-white/5"
        )}>
            <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_35%,rgb(var(--bg-main-rgb)/0.22),transparent_62%)] opacity-60 pointer-events-none" />
            {!isLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-0 gap-3">
                    <div className="w-8 h-8 border-4 border-brand-main border-t-transparent rounded-full animate-spin" />
                    {showSlowMessage && (
                        <div className="text-xs text-white/60 px-4 text-center">
                            Carregando conteúdo… (alguns sites podem bloquear exibição em tela cheia)
                        </div>
                    )}
                </div>
            )}
            <iframe
                src={src}
                className="w-full h-full border-0 relative z-10 bg-white"
                title={title}
                loading="eager"
                sandbox={shouldSandbox ? "allow-same-origin allow-scripts allow-popups allow-forms allow-presentation" : undefined}
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                referrerPolicy="no-referrer"
                onLoad={() => setIsLoaded(true)}
                style={{ transform: `rotate(${rotation}deg)` }}
            />
        </div>
    );
}
