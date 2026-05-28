"use client";

import { Layout } from "lucide-react";
import { LayoutType, LAYOUT_CONFIGS } from "@/lib/layouts";
import { LAYOUT_TEMPLATES } from "@/lib/layout-templates";
import { LayoutPreviewCard } from "@/components/layout/layout-preview-card";
import { cn } from "@/lib/utils";

interface MediaConfigLayoutTabProps {
    layout: LayoutType;
    layoutTemplateId: string;
    setLayout: (layout: LayoutType) => void;
    setLayoutTemplateId: (id: string) => void;
    setComposerKey: React.Dispatch<React.SetStateAction<number>>;
    setActiveTab: (tab: 'content' | 'layout' | 'schedule') => void;
    theme: 'dark' | 'light';
}

export function MediaConfigLayoutTab({
    layout,
    layoutTemplateId,
    setLayout,
    setLayoutTemplateId,
    setComposerKey,
    setActiveTab,
    theme,
}: MediaConfigLayoutTabProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 ml-1">Layouts Nativos</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {LAYOUT_CONFIGS.map((config) => (
                        <div
                            key={config.id}
                            onClick={() => {
                                setLayout(config.id);
                                setLayoutTemplateId("");
                                setComposerKey(k => k + 1);
                                setActiveTab('content');
                            }}
                            className="cursor-pointer"
                        >
                            <div className={cn(
                                "border rounded-xl p-3 transition-all hover:scale-[1.02] active:scale-95",
                                layout === config.id && !layoutTemplateId
                                    ? "border-brand-main ring-1 ring-brand-main bg-brand-main/5"
                                    : (theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:border-brand-main/30")
                            )}>
                                <div className="flex justify-center mb-2">
                                    <config.icon className={cn("w-6 h-6", layout === config.id && !layoutTemplateId ? "text-brand-main" : "text-slate-400")} />
                                </div>
                                <div className="text-center">
                                    <div className={cn("text-[10px] font-bold uppercase", layout === config.id && !layoutTemplateId ? "text-brand-main" : "text-slate-500")}>{config.name}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 ml-1">Templates Profissionais</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {LAYOUT_TEMPLATES.map((template) => (
                        <div key={template.id} onClick={() => { setLayoutTemplateId(template.id); setLayout('single'); setActiveTab('content'); }}>
                            <LayoutPreviewCard
                                template={template}
                                isSelected={layoutTemplateId === template.id}
                                onClick={() => { setLayoutTemplateId(template.id); setLayout('single'); }}
                                theme={theme}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
