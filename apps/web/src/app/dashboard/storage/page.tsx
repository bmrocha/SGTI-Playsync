"use client";

import { useState } from "react";
import { MediaGallery } from "@/components/media/media-gallery";
import { HardDrive, Upload } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";
import { cn } from "@/lib/utils";

export default function StoragePage() {
    const { theme } = useThemeStore();
    
    return (
        <div className="p-4 h-[calc(100vh-64px)] overflow-hidden flex flex-col gap-3 max-w-400 mx-auto animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 border-b border-border/50 pb-2">
                <div>
                    <h1 className={cn(
                        "text-lg font-bold flex items-center gap-2",
                        theme === 'dark' ? "text-white" : "text-slate-800"
                    )}>
                        <HardDrive className="w-5 h-5 text-brand-main" />
                        Galeria de Mídia
                    </h1>
                    <p className="text-xs text-text-secondary hidden sm:block">Gerencie seus arquivos de vídeo, imagem e áudio</p>
                </div>
            </div>

            {/* Main Content */}
            <div className={cn(
                "flex-1 rounded-xl border overflow-hidden p-4 shadow-sm",
                theme === 'dark' ? "bg-white/5 border-white/5" : "bg-white border-slate-200"
            )}>
                <MediaGallery />
            </div>
        </div>
    );
}