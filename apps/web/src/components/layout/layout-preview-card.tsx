"use client";

import { LayoutTemplate, RegionWidgetType } from "@/lib/layout-templates";
import { cn } from "@/lib/utils";
import {
    Monitor,
    Check,
    Sun,
    Calendar,
    Clock,
    Newspaper,
    Megaphone,
    Image as ImageIcon,
    Layout
} from "lucide-react";

interface LayoutPreviewCardProps {
    template: LayoutTemplate | null; // null represents "Native/None"
    isSelected: boolean;
    onClick: () => void;
    theme?: 'light' | 'dark';
}

export function LayoutPreviewCard({ template, isSelected, onClick, theme = 'dark' }: LayoutPreviewCardProps) {
    const isNative = !template;

    // Helper to render widget content based on type
    const renderWidgetPreview = (type: RegionWidgetType, width: number, height: number) => {
        const isDark = theme === 'dark';

        switch (type) {
            case 'weather': {
                const isSmall = height < 25;
                return (
                    <div className={cn(
                        "w-full h-full flex items-center justify-center border relative overflow-hidden backdrop-blur-sm",
                        isSmall ? "flex-row gap-1.5 px-1" : "flex-col gap-0.5",
                        isDark
                            ? "bg-gradient-to-br from-blue-500/10 to-blue-600/20 text-blue-400 border-blue-500/20"
                            : "bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 border-blue-200"
                    )}>
                        {!isSmall && <div className={cn("absolute top-1 right-1 opacity-10", isDark ? "text-white" : "text-blue-900")}><Sun className="w-6 h-6" /></div>}

                        <div className={cn("flex items-center justify-center origin-center", isSmall ? "scale-100" : "scale-90 flex-col")}>
                            <Sun className={cn("relative z-10 drop-shadow-lg shrink-0", isSmall ? "w-3 h-3" : "w-4 h-4 md:w-5 md:h-5", isDark ? "text-blue-300" : "text-amber-500", !isSmall && "mb-0.5")} />
                            <span className={cn("font-black relative z-10", isSmall ? "text-[7px]" : "text-[9px] md:text-[10px]", isDark ? "text-blue-100" : "text-blue-900")}>26°</span>
                        </div>
                        {!isSmall && height > 15 && (
                            <div className={cn("text-[4px] md:text-[5px] uppercase tracking-widest text-center leading-tight max-w-[90%] truncate mt-0.5 font-bold", isDark ? "text-blue-200/70" : "text-blue-700/70")}>
                                Porto Alegre
                            </div>
                        )}
                    </div>
                );
            }
            case 'calendar': {
                const isSmall = height < 25;
                return (
                    <div className={cn(
                        "w-full h-full flex items-center justify-center border relative overflow-hidden backdrop-blur-sm",
                        isSmall ? "flex-row gap-1.5 px-1" : "flex-col gap-1",
                        isDark
                            ? "bg-[rgb(var(--bg-main-rgb)/0.10)] text-white/70 border-white/10"
                            : "bg-[rgb(var(--bg-main-rgb)/0.08)] text-slate-700 border-slate-200"
                    )}>
                        {!isSmall && <div className={cn("absolute -bottom-2 -left-2 opacity-10", isDark ? "text-white" : "text-slate-900")}><Calendar className="w-12 h-12" /></div>}

                        <div className={cn("flex items-center justify-center origin-center", isSmall ? "flex-row gap-1" : "flex-col scale-90")}>
                            <Calendar className={cn("relative z-10 drop-shadow-md shrink-0", isSmall ? "w-3 h-3" : "w-4 h-4 md:w-5 md:h-5", isDark ? "text-white/70" : "text-brand-main")} />

                            {isSmall ? (
                                <div className="flex gap-0.5">
                                    <div className={cn("w-0.5 h-0.5 rounded-full", isDark ? "bg-white/60" : "bg-brand-main")} />
                                    <div className={cn("w-0.5 h-0.5 rounded-full", isDark ? "bg-white/35" : "bg-brand-main/60")} />
                                </div>
                            ) : (
                                height > 15 && (
                                    <div className="flex flex-col items-center relative z-10 mt-1">
                                        <span className={cn("text-[4px] md:text-[5px] font-bold uppercase tracking-widest", isDark ? "text-white/60" : "text-slate-700/70")}>Eventos</span>
                                        <div className="flex gap-0.5 mt-0.5">
                                            <div className={cn("w-0.5 h-0.5 rounded-full", isDark ? "bg-white/60 shadow-[0_0_4px_currentColor]" : "bg-brand-main")} />
                                            <div className={cn("w-0.5 h-0.5 rounded-full", isDark ? "bg-white/35" : "bg-brand-main/60")} />
                                            <div className={cn("w-0.5 h-0.5 rounded-full", isDark ? "bg-white/20" : "bg-brand-main/35")} />
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                );
            }
            case 'clock':
                return (
                    <div className={cn(
                        "w-full h-full flex items-center justify-center border relative backdrop-blur-sm overflow-hidden p-0.5",
                        isDark
                            ? "bg-[rgb(var(--bg-main-rgb)/0.10)] text-white/70 border-white/10"
                            : "bg-[rgb(var(--bg-main-rgb)/0.08)] text-slate-700 border-slate-200"
                    )}>
                        <div className="flex flex-col items-center justify-center scale-[0.65] origin-center w-full h-full">
                            <Clock className={cn("drop-shadow-md shrink-0 w-5 h-5 mb-0.5", isDark ? "text-white/70" : "text-brand-main")} />
                            <span className={cn("font-mono font-black tracking-widest leading-none text-[10px]", isDark ? "text-white/85" : "text-slate-900")}>14:30</span>
                            {height > 30 && (
                                <span className={cn("text-[5px] font-bold uppercase tracking-wider mt-0.5 whitespace-nowrap", isDark ? "text-white/55" : "text-slate-700/60")}>
                                    SEX, 12 OUT
                                </span>
                            )}
                        </div>
                    </div>
                );
            case 'news':
                // Horizontal Ticker Style
                if (height < 15) {
                    return (
                        <div className={cn(
                            "w-full h-full flex items-center justify-center px-1 border-y backdrop-blur-sm overflow-hidden",
                            isDark
                                ? "bg-gradient-to-r from-emerald-500/10 to-emerald-900/20 text-emerald-400 border-emerald-500/20"
                                : "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200"
                        )}>
                            <div className="flex items-center gap-1 w-full scale-[0.80] origin-left">
                                <div className={cn("p-[1px] rounded shrink-0 flex items-center justify-center", isDark ? "bg-emerald-500/20" : "bg-emerald-200/50")}>
                                    <Newspaper className={cn("w-2 h-2", isDark ? "text-emerald-300" : "text-emerald-600")} />
                                </div>
                                <div className="flex-1 flex gap-1 overflow-hidden items-center opacity-90 min-w-0">
                                    <span className={cn("text-[3.5px] font-black uppercase tracking-wider truncate leading-none pt-[0.5px]", isDark ? "text-emerald-300" : "text-emerald-800")}>NOTÍCIAS</span>
                                    <div className={cn("h-[1.5px] w-full rounded-full shrink-0", isDark ? "bg-emerald-400/40" : "bg-emerald-400")} />
                                </div>
                            </div>
                        </div>
                    );
                }
                // Vertical/Block News
                return (
                    <div className={cn(
                        "w-full h-full flex flex-col p-1.5 gap-0.5 border relative overflow-hidden backdrop-blur-sm",
                        isDark
                            ? "bg-gradient-to-b from-emerald-500/10 to-emerald-900/20 text-emerald-400 border-emerald-500/20"
                            : "bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200"
                    )}>
                        <div className={cn("absolute top-0 right-0 p-1 opacity-5 scale-75 origin-top-right", isDark ? "" : "text-emerald-900")}><Newspaper className="w-8 h-8" /></div>

                        <div className="flex flex-col h-full scale-90 origin-top-left w-full">
                            <div className="flex items-center gap-1 mb-0.5">
                                <Newspaper className={cn("w-3 h-3 shrink-0", isDark ? "text-emerald-300" : "text-emerald-600")} />
                                <span className={cn("text-[5px] font-black uppercase tracking-widest opacity-80 leading-none", isDark ? "text-emerald-200" : "text-emerald-800")}>Notícias</span>
                            </div>
                            <div className="space-y-1 px-0.5 opacity-70 w-full">
                                <div className={cn("h-0.5 w-3/4 rounded-full", isDark ? "bg-emerald-400/50" : "bg-emerald-400")} />
                                <div className={cn("h-0.5 w-full rounded-full", isDark ? "bg-emerald-400/30" : "bg-emerald-300")} />
                                <div className={cn("h-0.5 w-1/2 rounded-full", isDark ? "bg-emerald-400/20" : "bg-emerald-200")} />
                            </div>
                        </div>
                    </div>
                );
            case 'message': {
                // Adjust for very small height (headers)
                const isSmallHeader = height < 12;
                return (
                    <div className={cn(
                        "w-full h-full flex items-center justify-center border overflow-hidden backdrop-blur-sm px-1",
                        isSmallHeader ? "gap-1" : "gap-1.5",
                        isDark
                            ? "bg-gradient-to-r from-orange-500/20 to-orange-700/20 text-orange-400 border-orange-500/30"
                            : "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-600 border-orange-200"
                    )}>
                        <Megaphone className={cn("animate-pulse shrink-0", isSmallHeader ? "w-2.5 h-2.5" : "w-4 h-4 md:w-5 md:h-5", isDark ? "text-orange-300" : "text-orange-500")} />
                        <span className={cn(
                            "font-black uppercase tracking-[0.15em] shrink min-w-0 leading-none pb-[1px]",
                            isSmallHeader ? "text-[5px]" : "text-[7px] md:text-[9px]",
                            isDark ? "text-orange-200" : "text-orange-700"
                        )}>
                            AVISO
                        </span>
                    </div>
                );
            } case 'media':
            default:
                return (
                    <div className={cn(
                        "w-full h-full relative overflow-hidden group-hover:scale-[1.02] transition-transform duration-700 border",
                        isDark ? "bg-[#050505] border-white/5" : "bg-slate-100 border-slate-200"
                    )}>
                        {/* Fictional Photo Gradient - Cinematic */}
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br opacity-80",
                            isDark
                                ? "from-[rgb(var(--bg-main-rgb)/0.10)] via-white/0 to-[rgb(var(--bg-main-rgb)/0.04)]"
                                : "from-[rgb(var(--bg-main-rgb)/0.10)] via-white/0 to-[rgb(var(--bg-main-rgb)/0.06)]"
                        )} />

                        {/* Subtle Grid Overlay */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-200 contrast-200 mix-blend-overlay" />

                        {/* Content Simulation - Centered Play Icon style */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={cn(
                                "w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center backdrop-blur-sm shadow-xl",
                                isDark ? "border-white/10 bg-white/5" : "border-white/40 bg-white/30"
                            )}>
                                <ImageIcon className={cn("w-4 h-4 md:w-5 md:h-5", isDark ? "text-white/30" : "text-slate-500")} />
                            </div>
                        </div>

                        {/* UI Overlay Simulation - Minimal Player Controls */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 opacity-40">
                            <div className={cn("w-6 h-6 rounded", isDark ? "bg-white/10" : "bg-slate-900/10")} />
                            <div className="flex-1 space-y-1">
                                <div className={cn("h-1 w-1/2 rounded-full", isDark ? "bg-white/40" : "bg-slate-900/20")} />
                                <div className={cn("h-0.5 w-3/4 rounded-full", isDark ? "bg-white/20" : "bg-slate-900/10")} />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div
            onClick={onClick}
            className={cn(
                "cursor-pointer group relative rounded-xl overflow-hidden transition-all duration-300 border-2 select-none",
                theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white",
                isSelected
                    ? "border-brand-main shadow-[0_0_20px_rgba(34,211,187,0.3)] scale-[1.02]"
                    : (theme === 'dark' ? "border-white/5 hover:border-white/20 hover:bg-white/5" : "border-slate-100 hover:border-slate-300 hover:bg-slate-50")
            )}
        >
            {/* Preview Area (Aspect Ratio 16:9) */}
            <div className={cn(
                "aspect-video relative overflow-hidden transition-colors duration-300",
                theme === 'dark' ? "bg-[#050505]" : "bg-slate-50"
            )}>
                {/* Background Grid Pattern */}
                <div className={cn("absolute inset-0", theme === 'dark' ? "opacity-[0.03]" : "opacity-[0.05]")}
                    style={{ backgroundImage: `linear-gradient(${theme === 'dark' ? '#fff' : '#000'} 1px, transparent 1px), linear-gradient(90deg, ${theme === 'dark' ? '#fff' : '#000'} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}
                />

                {isNative ? (
                    // Native Mode Preview
                    <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:opacity-80 transition-opacity">
                        <div className="flex flex-col items-center gap-2">
                            <Layout className={cn("w-8 h-8", theme === 'dark' ? "text-white/50" : "text-slate-400")} />
                            <span className={cn("text-[8px] font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/30" : "text-slate-400")}>Full Canvas</span>
                        </div>
                    </div>
                ) : (
                    // Template Regions
                    <div className="absolute inset-2">
                        {template.regions.map((region, idx) => (
                            <div
                                key={idx}
                                className="absolute transition-all duration-500 hover:brightness-125 hover:z-10"
                                style={{
                                    left: `${region.position.x}%`,
                                    top: `${region.position.y}%`,
                                    width: `${region.position.width}%`,
                                    height: `${region.position.height}%`,
                                    padding: '1px' // Gap simulation
                                }}
                            >
                                <div className="w-full h-full rounded-sm overflow-hidden shadow-sm">
                                    {renderWidgetPreview(region.widgetType, region.position.width, region.position.height)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Selection Indicator */}
                {isSelected && (
                    <div className="absolute top-2 right-2 z-20 bg-brand-main text-[#0a0a0a] p-1 rounded-full shadow-lg shadow-brand-main/20 animate-in zoom-in duration-200">
                        <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                )}
            </div>

            {/* Footer / Label */}
            <div className={cn(
                "p-3 border-t relative overflow-hidden",
                theme === 'dark' ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50/50"
            )}>
                {isSelected && (
                    <div className="absolute inset-0 bg-brand-main/5 pointer-events-none" />
                )}
                <h3 className={cn(
                    "text-[11px] font-black uppercase tracking-wider truncate mb-0.5",
                    isSelected ? "text-brand-main" : (theme === 'dark' ? "text-slate-300" : "text-slate-700")
                )}>
                    {isNative ? "Modo Nativo" : template.name}
                </h3>
                <p className={cn(
                    "text-[9px] truncate transition-colors",
                    theme === 'dark' ? "text-slate-600 group-hover:text-slate-500" : "text-slate-400 group-hover:text-slate-600"
                )}>
                    {isNative ? "Exibição padrão sem widgets" : template.description}
                </p>
            </div>
        </div>
    );
}
