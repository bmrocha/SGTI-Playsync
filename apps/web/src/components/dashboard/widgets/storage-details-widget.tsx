"use client";

import { useThemeStore } from "@/lib/theme-store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { HardDrive } from "lucide-react";
import { useEffect, useState } from "react";

export function StorageDetailsWidget() {
    const { theme } = useThemeStore();
    const isDarkMode = theme === 'dark';
    const [storageUsedBytes, setStorageUsedBytes] = useState(0);
    const [storageUsedVideoBytes, setStorageUsedVideoBytes] = useState(0);
    const [storageUsedImageBytes, setStorageUsedImageBytes] = useState(0);
    const [storageLimitMb, setStorageLimitMb] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;

                setStorageUsedBytes(Number(data.storageUsedBytes || 0));
                setStorageUsedVideoBytes(Number(data.storageUsedVideoBytes || 0));
                setStorageUsedImageBytes(Number(data.storageUsedImageBytes || 0));
                setStorageLimitMb(Number(data.storageLimitMb || 0));
            } catch {
            }
        };

        load();
        const interval = window.setInterval(load, 15000);
        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, []);

    const toMb = (bytes: number) => bytes / (1024 * 1024);
    const videoStorage = toMb(storageUsedVideoBytes);
    const imageStorage = toMb(storageUsedImageBytes);
    const totalUsed = toMb(storageUsedBytes);
    const totalCapacity = storageLimitMb > 0 ? storageLimitMb : 1024;
    const totalFree = Math.max(totalCapacity - totalUsed, 0);

    const formatMb = (mb: number) => {
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${Math.round(mb)} MB`;
    };

    const data = [
        { name: 'Vídeos', valor: Math.max(videoStorage, 0), color: 'var(--bg-main)' },
        { name: 'Imagens', valor: Math.max(imageStorage, 0), color: 'var(--accent-btn)' },
        { name: 'Livre', valor: totalFree, color: isDarkMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(148, 163, 184, 0.25)' },
    ];

    return (
        <div
            className="p-3.5 laptop:p-4 rounded-lg border border-border bg-panel-bg h-full flex flex-col transition-all duration-500 group"
            data-animate="fade-up"
            data-hover="lift"
        >
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-text-light text-xs laptop:text-sm font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                        <HardDrive className="w-3 h-3 laptop:w-4 laptop:h-4" />
                        Detalhamento de Disco
                    </h3>
                    <div className="text-xl laptop:text-2xl font-bold text-text-dark">
                        {formatMb(totalUsed)} <span className="text-xs laptop:text-sm text-text-light font-normal">/ {formatMb(totalCapacity)}</span>
                    </div>
                </div>
                <div className="p-2 laptop:p-3 rounded-lg transition-all duration-300 group-hover:scale-110"
                    style={{ background: isDarkMode ? '#0d2b26' : '#f0fdfa' }}>
                    <HardDrive className="w-5 h-5 laptop:w-6 laptop:h-6 text-brand-main" />
                </div>
            </div>

            <div className="flex-1 w-full min-h-[120px] laptop:min-h-[150px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDarkMode ? "#333" : "#eee"} />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            width={60}
                            tick={{ fill: isDarkMode ? "#aaa" : "#666", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                                borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                                borderRadius: "8px",
                                boxShadow: 'var(--shadow-lg)',
                            }}
                        />
                        <Bar dataKey="valor" radius={[0, 8, 8, 0]} barSize={24}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3 laptop:mt-4 text-center">
                <div
                    className="rounded-lg p-2 laptop:p-3 transition-all duration-300 hover:scale-105 relative overflow-hidden group/stat bg-brand-main/10 border border-brand-main/20"
                    data-hover="lift"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover/stat:translate-x-[200%] transition-transform duration-1000" />
                    <div className="text-[10px] laptop:text-xs font-bold mb-0.5 laptop:mb-1 relative z-10 text-brand-main">Vídeos</div>
                    <div className="text-xs laptop:text-sm font-bold text-text-dark relative z-10">{formatMb(videoStorage)}</div>
                </div>
                <div
                    className={`rounded-lg p-2 laptop:p-3 transition-all duration-300 hover:scale-105 relative overflow-hidden group/stat border ${
                        isDarkMode 
                            ? 'bg-brand-accent/10 border-brand-accent/20' 
                            : 'bg-amber-50 border-amber-100'
                    }`}
                    data-hover="lift"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover/stat:translate-x-[200%] transition-transform duration-1000" />
                    <div className={`text-[10px] laptop:text-xs font-bold mb-0.5 laptop:mb-1 relative z-10 ${isDarkMode ? 'text-brand-accent' : 'text-amber-700'}`}>Imagens</div>
                    <div className="text-xs laptop:text-sm font-bold text-text-dark relative z-10">{formatMb(imageStorage)}</div>
                </div>
                <div
                    className="rounded-lg p-2 laptop:p-3 transition-all duration-300 hover:scale-105 relative overflow-hidden group/stat bg-border/20 border border-border"
                    data-hover="lift"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-200%] group-hover/stat:translate-x-[200%] transition-transform duration-1000" />
                    <div className="text-[10px] laptop:text-xs font-bold mb-0.5 laptop:mb-1 relative z-10 text-text-light">Livres</div>
                    <div className="text-xs laptop:text-sm font-bold text-text-dark relative z-10">{formatMb(totalFree)}</div>
                </div>
            </div>
        </div>
    );
}
