"use client";

import { useThemeStore } from "@/lib/theme-store";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const data = [
    { name: 'Seg', impressoes: 4000 },
    { name: 'Ter', impressoes: 3000 },
    { name: 'Qua', impressoes: 2000 },
    { name: 'Qui', impressoes: 2780 },
    { name: 'Sex', impressoes: 1890 },
    { name: 'Sáb', impressoes: 2390 },
    { name: 'Dom', impressoes: 3490 },
];

export function SystemActivityChart() {
    const { theme } = useThemeStore();
    const isDarkMode = theme === 'dark';

    return (
        <div className="bg-panel-bg p-3.5 laptop:p-4 rounded-2xl shadow-sm border border-border h-full flex flex-col transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <h3 className="text-text-light text-xs laptop:text-sm font-bold uppercase tracking-wider mb-1">
                        Atividade do Sistema
                    </h3>
                    <div className="text-xl laptop:text-2xl font-bold text-text-dark flex items-center gap-2">
                        19.5k
                        <span className="text-xs laptop:text-sm font-normal text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            +12%
                        </span>
                    </div>
                    <p className="text-[10px] laptop:text-xs text-text-light mt-1">Impressões totais nos últimos 7 dias</p>
                </div>
            </div>

            <div className="flex-1 w-full min-h-[160px] laptop:min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#333" : "#eee"} vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke={isDarkMode ? "#888" : "#999"}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke={isDarkMode ? "#888" : "#999"}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDarkMode ? "#1f2937" : "#fff",
                                borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                                borderRadius: "8px",
                                color: isDarkMode ? "#fff" : "#000",
                            }}
                            itemStyle={{ color: "#10b981" }}
                        />
                        <Area
                            type="monotone"
                            dataKey="impressoes"
                            stroke="#10b981"
                            fillOpacity={1}
                            fill="url(#colorImpressions)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
