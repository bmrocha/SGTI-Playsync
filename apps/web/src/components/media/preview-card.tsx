"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Play, FileImage, FileVideo, Clock, Maximize2 } from "lucide-react";
import { MediaItem } from "@/lib/store";

interface PreviewCardProps {
    item: MediaItem;
    children: React.ReactNode;
}

export function PreviewCard({ item, children }: PreviewCardProps) {
    const [showPreview, setShowPreview] = useState(false);
    const [previewPosition, setPreviewPosition] = useState<'left' | 'right'>('right');
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        // Determine if preview should show on left or right based on cursor position
        const rect = e.currentTarget.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const spaceOnRight = windowWidth - rect.right;

        setPreviewPosition(spaceOnRight < 400 ? 'left' : 'right');
        setShowPreview(true);
    };

    const handleMouseLeave = () => {
        setShowPreview(false);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (url: string) => {
        // For blob URLs, we can't get the real size, so we'll show a placeholder
        if (url.startsWith('blob:')) return 'Local';
        return 'Web';
    };

    const getMediaType = () => {
        switch (item.type) {
            case 'image': return 'Imagem';
            case 'video': return 'Vídeo';
            case 'youtube': return 'YouTube';
            default: return 'Mídia';
        }
    };

    return (
        <div
            ref={containerRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}

            {/* Preview Overlay */}
            {showPreview && (
                <div
                    className={`
                        absolute top-0 z-100 w-64 laptop:w-72 animate-fadeIn
                        ${previewPosition === 'right' ? 'left-full ml-2 laptop:ml-3' : 'right-full mr-2 laptop:mr-3'}
                    `}
                    style={{ pointerEvents: 'none' }}
                >
                    <div className="bg-panel-bg border-2 border-brand-main rounded-xl shadow-2xl overflow-hidden">
                        {/* Media Preview */}
                        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
                            {item.type === 'image' && (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={item.url}
                                        alt={item.name}
                                        fill
                                        unoptimized
                                        className="object-contain"
                                    />
                                </div>
                            )}
                            {item.type === 'video' && (
                                <video
                                    src={item.url}
                                    className="w-full h-full object-contain"
                                    muted
                                    loop
                                    autoPlay
                                />
                            )}
                            {item.type === 'youtube' && (
                                <div className="flex flex-col items-center justify-center gap-2 text-white">
                                    <Play className="w-10 h-10 laptop:w-10 laptop:h-10 text-red-500" />
                                    <span className="text-xs laptop:text-xs">YouTube Video</span>
                                </div>
                            )}

                            {/* Type Badge */}
                            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                                {item.type === 'image' ? (
                                    <FileImage className="w-3 h-3 text-blue-400" />
                                ) : (
                                    <FileVideo className="w-3 h-3 text-red-400" />
                                )}
                                <span className="text-[10px] laptop:text-[10px] text-white font-medium">
                                    {getMediaType()}
                                </span>
                            </div>

                            {/* Duration Badge */}
                            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3 text-brand-main" />
                                <span className="text-[10px] laptop:text-[10px] text-white font-medium">
                                    {formatDuration(item.duration)}
                                </span>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="p-2 laptop:p-2.5 space-y-1.5 laptop:space-y-1.5">
                            <h4 className="font-bold text-xs laptop:text-sm text-text-dark truncate" title={item.name}>
                                {item.name}
                            </h4>

                            <div className="grid grid-cols-2 gap-1.5 laptop:gap-2 text-[10px] laptop:text-[11px]">
                                <div>
                                    <span className="text-text-light">Duração:</span>
                                    <span className="ml-1 text-text-dark font-medium">
                                        {item.duration}s
                                    </span>
                                </div>
                                <div>
                                    <span className="text-text-light">Rotação:</span>
                                    <span className="ml-1 text-text-dark font-medium">
                                        {item.rotation}°
                                    </span>
                                </div>
                                <div>
                                    <span className="text-text-light">Origem:</span>
                                    <span className="ml-1 text-text-dark font-medium">
                                        {formatFileSize(item.url)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-text-light">Layout:</span>
                                    <span className="ml-1 text-text-dark font-medium">
                                        {item.layout || 'Padrão'}
                                    </span>
                                </div>
                            </div>

                            {/* Schedule Info */}
                            {item.schedule && !item.schedule.allDay && (
                                <div className="pt-2 border-t border-border">
                                    <span className="text-xs text-text-light">📅 Agendado</span>
                                    {item.schedule.startTime && (
                                        <div className="text-xs text-text-dark mt-1">
                                            {item.schedule.startTime} - {item.schedule.endTime || '∞'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Arrow Pointer */}
                    <div
                        className={`
                            absolute top-4 w-0 h-0
                            border-t-8 border-t-transparent
                            border-b-8 border-b-transparent
                            ${previewPosition === 'right'
                                ? 'right-full border-r-8 border-r-brand-main'
                                : 'left-full border-l-8 border-l-brand-main'
                            }
                        `}
                    />
                </div>
            )}
        </div>
    );
}
