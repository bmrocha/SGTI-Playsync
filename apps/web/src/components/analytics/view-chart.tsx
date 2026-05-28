"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useThemeStore } from "@/lib/theme-store";

interface ViewChartProps {
    data: { date: string; count: number }[];
}

export function ViewChart({ data }: ViewChartProps) {
    const { theme } = useThemeStore();
    const isDarkMode = theme === "dark";

    return (
        <div className="bg-panel-bg rounded-xl p-6 border border-border shadow-sm h-[400px]">
            <h2 className="text-xl font-bold text-text-dark mb-6">Visualizações por Dia</h2>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#13978a" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#13978a" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="date"
                            stroke={isDarkMode ? "rgba(148, 163, 184, 0.8)" : "rgba(100, 116, 139, 0.8)"}
                            tick={{ fill: isDarkMode ? "rgba(148, 163, 184, 0.85)" : "rgba(100, 116, 139, 0.85)", fontSize: 12 }}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke={isDarkMode ? "rgba(148, 163, 184, 0.8)" : "rgba(100, 116, 139, 0.8)"}
                            tick={{ fill: isDarkMode ? "rgba(148, 163, 184, 0.85)" : "rgba(100, 116, 139, 0.85)" }}
                            allowDecimals={false}
                        />
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}
                            vertical={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--panel-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-dark)',
                            }}
                            itemStyle={{ color: 'var(--text-dark)' }}
                            formatter={(value: any) => [`${value || 0} reproduções`, 'Total']}
                            labelStyle={{ color: 'var(--text-light)', marginBottom: '0.25rem' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#13978a"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-light">
                    <p>Nenhum dado disponível no período selecionado</p>
                </div>
            )}
        </div>
    );
}
