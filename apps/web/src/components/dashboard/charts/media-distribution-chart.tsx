"use client";

import { useAppStore } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useThemeStore } from "@/lib/theme-store";

export function MediaDistributionChart() {
    const { companies } = useAppStore();
    const { theme } = useThemeStore();
    const isDarkMode = theme === 'dark';

    // Prepare Data: Media count per Company
    const data = Object.values(companies).map(company => ({
        name: company.name,
        playlists: Object.keys(company.playlists).length,
        items: Object.values(company.playlists).reduce((acc, items) => acc + items.length, 0)
    })).sort((a, b) => b.items - a.items).slice(0, 5); // Top 5 companies

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-panel-bg p-3 border border-border rounded-lg shadow-xl">
                    <p className="font-bold text-text-dark mb-1">{label}</p>
                    <p className="text-sm text-brand-main">
                        Mídias: <span className="font-bold">{payload[0].value}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-panel-bg p-3.5 laptop:p-4 rounded-2xl shadow-sm border border-border h-full flex flex-col transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-text-dark font-bold text-base laptop:text-lg mb-0.5">Volume de Mídia por Empresa</h3>
            <p className="text-text-light text-[10px] laptop:text-xs mb-2">Top 5 empresas com mais conteúdo</p>

            <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#333" : "#e0e0e0"} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDarkMode ? '#a0aec0' : '#718096', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: isDarkMode ? '#a0aec0' : '#718096', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: isDarkMode ? '#ffffff10' : '#00000005' }} />
                        <Bar dataKey="items" radius={[6, 6, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#13978a' : isDarkMode ? '#2d3748' : '#cbd5e0'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
