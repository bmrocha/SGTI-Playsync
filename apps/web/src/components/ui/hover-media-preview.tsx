"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

import { useThemeStore } from "@/lib/theme-store";
import { LayoutType, getLayoutConfig } from "@/lib/layouts";

interface HoverMediaPreviewProps {
    url: string;
    alt: string;
    type: "image" | "video" | "youtube";
    children: React.ReactNode;
    zones?: { id: string; type: string; url: string; name: string; rotation?: number }[];
    rotation?: number;
    layout?: LayoutType;
}

export function HoverMediaPreview({ url, alt, type, children, zones, rotation = 0, layout = 'single' }: HoverMediaPreviewProps) {
    const { theme } = useThemeStore();
    const [isHovered, setIsHovered] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseEnter = (e: React.MouseEvent) => {
        setIsHovered(true);
        updatePosition(e);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        updatePosition(e);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const updatePosition = (e: React.MouseEvent) => {
        // Position slightly offset from cursor
        const x = e.clientX + 20;
        const y = e.clientY - 100; // Center vertically relative to cursor approx
        setPosition({ x, y });
    };

    // Helper to get grid class
    const getGridClass = () => {
        switch (layout) {
            case 'grid-2x2': return 'grid-cols-2 grid-rows-2';
            case 'horizontal-2': return 'grid-cols-2 grid-rows-1';
            case 'horizontal-3': return 'grid-cols-3 grid-rows-1';
            case 'vertical-2': return 'grid-cols-1 grid-rows-2';
            case 'vertical-3': return 'grid-cols-1 grid-rows-3';
            case 'split-left': return 'grid-cols-[2fr_1fr] grid-rows-2';
            case 'split-right': return 'grid-cols-[1fr_2fr] grid-rows-2';
            default: return 'grid-cols-1 grid-rows-1';
        }
    };

    // Helper to render preview content
    const PreviewContent = () => (
        <div
            className="fixed z-9999 pointer-events-none animate-scaleIn p-1.5 rounded-2xl shadow-2xl border-2 backdrop-blur-md"
            style={{
                left: position.x,
                top: Math.max(20, position.y), // Prevent going off top
                maxWidth: '440px',
                maxHeight: '440px',
                backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff', // zinc-900 vs white
                borderColor: 'rgba(19, 151, 138, 0.5)' // brand-main/50 equivalent
            }}
        >
            <div className={`relative rounded-xl overflow-hidden shadow-none ${type !== 'image' && !zones ? 'aspect-video min-w-[320px]' : zones ? 'aspect-video min-w-100' : ''}`}
                style={{ backgroundColor: theme === 'dark' ? '#000000' : '#ffffff' }}
            >
                {/* Multi-zone layout */}
                {zones && zones.length > 0 ? (
                    <div className={`w-full h-full grid ${getGridClass()} gap-0.5 bg-gray-900`}>
                        {zones.map((zone, idx) => {
                            // Split Layout Logic for rowspan
                            const isSplit = layout.startsWith('split') && idx === 0;

                            return (
                                <div key={idx} className={`relative bg-black overflow-hidden flex items-center justify-center ${isSplit ? 'row-span-2' : ''}`}>
                                    {zone?.type === 'image' && (
                                        <Image
                                            src={zone.url}
                                            alt={zone.name}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                            sizes="(max-width: 768px) 100vw, 200px"
                                            style={{ transform: `rotate(${zone.rotation || 0}deg)` }}
                                        />
                                    )}
                                    {zone?.type === 'video' && (
                                        <div className="w-full h-full flex items-center justify-center bg-gray-800" style={{ transform: `rotate(${zone.rotation || 0}deg)` }}>
                                            <span className="text-4xl text-white/50">▶</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Single item */
                    <>
                        {type === "image" && (
                            <div className="relative w-full h-full">
                                <Image
                                    src={url}
                                    alt={alt}
                                    fill
                                    unoptimized
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 400px"
                                    style={{
                                        backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
                                        transform: `rotate(${rotation}deg)`
                                    }}
                                />
                            </div>
                        )}
                        {type === "youtube" && (
                            <div className="relative w-full h-full">
                                <Image
                                    src={`https://www.youtube.com/vi/${url}/hqdefault.jpg`}
                                    alt="YouTube Preview"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 400px"
                                />
                            </div>
                        )}
                        {type === "video" && (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-gray-900 to-gray-800 text-white p-4 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 backdrop-blur-sm border border-white/20"
                                    style={{ transform: `rotate(${rotation}deg)` }}
                                >
                                    <span className="text-3xl ml-1">▶</span>
                                </div>
                                <span className="text-sm font-medium text-gray-200 line-clamp-2 px-4 shadow-black drop-shadow-md">{alt}</span>
                            </div>
                        )}
                    </>
                )}

                {/* Type badge - Premium Style */}
                <div
                    className="absolute top-3 right-3 px-2.5 py-1 text-brand-main text-[10px] font-black uppercase rounded-full shadow-lg border border-brand-main/20 backdrop-blur-md tracking-wider"
                    style={{
                        backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)'
                    }}
                >
                    {zones && zones.length > 0 ? 'multi-zone' : type}
                </div>
            </div>

            {/* Pointer Arrow Decoration (Optional, adds to floating feel) */}
            <div
                className="absolute top-8 -left-2 w-4 h-4 border-l-2 border-b-2 transform rotate-45"
                style={{
                    backgroundColor: theme === 'dark' ? '#18181b' : '#ffffff',
                    borderColor: 'rgba(19, 151, 138, 0.5)'
                }}
            />
        </div>
    );

    return (
        <>
            <div
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className="cursor-zoom-in"
            >
                {/* Render the normal thumbnail */}
                {children}
            </div>

            {/* Render Portal for Preview overlay */}
            {isHovered && typeof document !== 'undefined' && createPortal(
                <PreviewContent />,
                document.body
            )}
        </>
    );
}
