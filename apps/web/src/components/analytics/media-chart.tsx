"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { MediaAnalytics } from '@/lib/analytics-store';
import { useThemeStore } from "@/lib/theme-store";

interface MediaChartProps {
    data: MediaAnalytics[];
}

export function MediaChart({ data }: MediaChartProps) {
    const { theme } = useThemeStore();
    const isDarkMode = theme === "dark";

    return (
        <div className="bg-panel-bg rounded-xl p-6 border border-border shadow-sm h-[450px]">
            <h2 className="text-xl font-bold text-text-dark mb-6">Mídias Mais Reproduzidas</h2>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 60 }}>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)"}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="mediaName"
                            stroke={isDarkMode ? "rgba(148, 163, 184, 0.8)" : "rgba(100, 116, 139, 0.8)"}
                            tick={{ fill: isDarkMode ? "rgba(148, 163, 184, 0.85)" : "rgba(100, 116, 139, 0.85)", fontSize: 11 }}
                            tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                        />
                        <YAxis
                            stroke={isDarkMode ? "rgba(148, 163, 184, 0.8)" : "rgba(100, 116, 139, 0.8)"}
                            tick={{ fill: isDarkMode ? "rgba(148, 163, 184, 0.85)" : "rgba(100, 116, 139, 0.85)" }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--panel-bg)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-dark)',
                            }}
                            cursor={{ fill: '#ffffff10' }}
                            formatter={(value: any) => [`${value || 0} reproduções`, 'Total']}
                        />
                        <Bar 
                            dataKey="playCount" 
                            radius={[6, 6, 0, 0]} 
                            maxBarSize={60}
                            minPointSize={5}
                            animationDuration={1500}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index < 3 ? '#22d3bb' : '#11876d'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-light">
                    <p>Nenhum dado disponível no período selecionado</p>
                </div>
            )}
        </div>
    );
}
