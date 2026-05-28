"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LayoutRenderer } from "@/components/player/layout-renderer";
import { LAYOUT_TEMPLATES } from "@/lib/layout-templates";
import { cn } from "@/lib/utils";

type Preset = { id: string; label: string; width: number; height: number; scale: number };

const PRESETS: Preset[] = [
    { id: "1080p", label: "1080p (1920×1080)", width: 1920, height: 1080, scale: 0.22 },
    { id: "4k", label: "4K (3840×2160)", width: 3840, height: 2160, scale: 0.11 },
    { id: "8k", label: "8K (7680×4320)", width: 7680, height: 4320, scale: 0.055 },
];

export default function TvTestPage() {
    const router = useRouter();
    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            router.replace('/login');
        }
    }, [router]);

    const [templateId, setTemplateId] = useState<string>(LAYOUT_TEMPLATES[0]?.id ?? "corporate-hub");
    const template = useMemo(() => LAYOUT_TEMPLATES.find((t) => t.id === templateId) ?? LAYOUT_TEMPLATES[0], [templateId]);

    const content = (
        <div className="relative w-full h-full bg-black overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(900px_circle_at_50%_35%,rgb(var(--bg-main-rgb)/0.22),transparent_62%)] opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/8 via-transparent to-black/35" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-white/90 font-black tracking-[0.35em] text-4xl">PLAYSYNC</div>
                    <div className="mt-3 text-white/60 text-sm font-semibold tracking-widest uppercase">TV Layout Preview</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="sticky top-0 z-10 backdrop-blur-xl bg-black/60 border-b border-white/10">
                <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center gap-4">
                    <div className="font-black tracking-widest uppercase text-sm text-white/90">TV Test</div>
                    <div className="flex-1" />
                    <label className="text-xs font-semibold text-white/70 tracking-widest uppercase">Template</label>
                    <select
                        value={templateId}
                        onChange={(e) => setTemplateId(e.target.value)}
                        className={cn(
                            "h-10 rounded-xl px-4 text-sm font-semibold outline-none border",
                            "bg-white/8 hover:bg-white/10 border-white/10 text-white"
                        )}
                    >
                        {LAYOUT_TEMPLATES.map((t) => (
                            <option key={t.id} value={t.id} className="bg-black text-white">
                                {t.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-1 gap-10">
                {PRESETS.map((preset) => {
                    const scaledW = Math.round(preset.width * preset.scale);
                    const scaledH = Math.round(preset.height * preset.scale);
                    return (
                        <div key={preset.id} className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                            <div className="px-6 py-4 flex items-center gap-3 border-b border-white/10">
                                <div className="text-sm font-black tracking-widest uppercase text-white/90">{preset.label}</div>
                                <div className="flex-1" />
                                <div className="text-xs font-semibold text-white/60 tracking-widest uppercase">Escala {Math.round(preset.scale * 100)}%</div>
                            </div>

                            <div className="p-6">
                                <div
                                    className="relative overflow-hidden rounded-2xl shadow-[0_30px_90px_rgba(0,0,0,0.65)] border border-white/10"
                                    style={{ width: scaledW, height: scaledH }}
                                >
                                    <div
                                        className="absolute inset-0 origin-top-left"
                                        style={{
                                            width: preset.width,
                                            height: preset.height,
                                            transform: `scale(${preset.scale})`,
                                        }}
                                    >
                                        <LayoutRenderer template={template} content={content} forcedTheme="dark" className="w-full h-full" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

