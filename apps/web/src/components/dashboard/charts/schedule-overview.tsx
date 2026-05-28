"use client";

import { useAppStore } from "@/lib/store";
import { useThemeStore } from "@/lib/theme-store";
import { RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar, CheckCircle } from "lucide-react";

export function ScheduleOverview() {
    const { playlists } = useAppStore();
    const { theme } = useThemeStore();
    const isDarkMode = theme === 'dark';

    let scheduledCount = 0; // Items with schedule.enabled = true
    let alwaysOnCount = 0; // items with schedule.enabled = false or default

    Object.values(playlists).forEach(pl => {
        pl.items.forEach(item => {
            if (item.schedule?.enabled) {
                scheduledCount++;
            } else {
                alwaysOnCount++;
            }
        });
    });

    const total = scheduledCount + alwaysOnCount;
    // Prevent division by zero if total is 0
    const fillPercent = total > 0 ? 100 : 0;

    const data = [
        {
            name: 'Sempre Ativo',
            uv: alwaysOnCount,
            pv: 2400,
            fill: '#818cf8', // Indigo SGTI Updated
        },
        {
            name: 'Agendado',
            uv: scheduledCount,
            pv: 4567,
            fill: '#22d3bb', // Teal Neon
        },
    ];

    return (
        <div className="bg-panel-bg p-4 laptop:p-5 rounded-2xl shadow-sm border border-border h-full flex flex-col transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex justify-between items-start mb-2 laptop:mb-4">
                <div>
                    <h3 className="text-text-dark font-bold text-base laptop:text-lg mb-0.5 laptop:mb-1">Visão de Agendamento</h3>
                    <p className="text-text-light text-[10px] laptop:text-xs">Mídias Programadas vs Fixas</p>
                </div>
                <div className="p-1.5 laptop:p-2 bg-brand-main/10 rounded-lg text-brand-main">
                    <Calendar className="w-4 h-4 laptop:w-5 laptop:h-5" />
                </div>
            </div>

            <div className="flex-1 flex flex-row items-center gap-2 laptop:gap-4">
                {/* Summary Stats - Left Side */}
                <div className="w-1/3 flex flex-col gap-2">
                    <div className="bg-indigo-100 text-indigo-700 p-2 rounded-xl border border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/40 dark:text-indigo-400">
                        <div className="flex items-center gap-1 mb-0.5 font-bold text-[10px] laptop:text-sm">
                            <CheckCircle className="w-3 h-3 laptop:w-4 laptop:h-4" />
                            Sempre
                        </div>
                        <div className="text-lg laptop:text-2xl font-bold text-text-dark">{alwaysOnCount}</div>
                    </div>

                    <div className="bg-teal-100 text-teal-700 p-2 rounded-xl border border-teal-200 dark:bg-[#22d3bb]/20 dark:border-[#22d3bb]/40 dark:text-[#22d3bb]">
                        <div className="flex items-center gap-1 mb-0.5 font-bold text-[10px] laptop:text-sm">
                            <Calendar className="w-3 h-3 laptop:w-4 laptop:h-4" />
                            Agendadas
                        </div>
                        <div className="text-lg laptop:text-2xl font-bold text-text-dark">{scheduledCount}</div>
                    </div>
                </div>

                {/* Chart - Right Side */}
                <div className="flex-1 w-full min-h-0 relative h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            innerRadius="30%"
                            outerRadius="100%"
                            barSize={15}
                            data={data}
                            startAngle={180}
                            endAngle={0}
                            cy="70%" // Push half-circle down
                        >
                            <RadialBar
                                label={{ position: 'insideStart', fill: '#fff', fontSize: '10px' }}
                                background={{ fill: isDarkMode ? '#333' : '#eee' }}
                                dataKey="uv"
                                cornerRadius={10}
                            />
                            {/* Legend removed to save space on small cards, relying on color coding or tooltip */}
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: isDarkMode ? '#1a202c' : '#fff',
                                    borderColor: isDarkMode ? '#2d3748' : '#e2e8f0',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    fontSize: '12px'
                                }}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-text-light">
                        Total: <strong>{total}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}
