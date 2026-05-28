"use client";

import { ReactNode } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface DistributionChartProps {
    title: ReactNode;
    data: { name: string; value: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ff7875', '#ffc069'];

// Custom Tooltip Component for Theme Support
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-panel-bg p-3 rounded-lg shadow-xl border border-border">
                <p className="text-sm font-bold text-text-dark mb-1">{data.name}</p>
                <div className="flex items-center gap-2 text-xs text-text-light">
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: data.fill || payload[0].color }}
                    />
                    <span>
                        Total: <span className="font-bold text-brand-main ml-1">{data.value}</span>
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

export function DistributionChart({ title, data }: DistributionChartProps) {
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    return (
        <div className="bg-panel-bg rounded-xl p-6 border border-border shadow-sm h-[400px] flex flex-col group/chart">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-xl font-bold text-text-dark">{title}</h2>
                {sortedData.length > 0 && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-main/10 text-brand-main border border-brand-main/20">
                        {sortedData.length} items
                    </span>
                )}
            </div>

            {sortedData.length > 0 && sortedData.some(item => item.value > 0) ? (
                <div className="flex-1 min-h-0 flex flex-col md:flex-row items-center gap-6">
                    <style>{`
                        .legend-card-custom {
                            background-color: rgba(0, 0, 0, 0.03);
                            border: 1px solid var(--border-color);
                        }
                        :is(.dark) .legend-card-custom {
                            background-color: rgba(255, 255, 255, 0.05); /* White/5 equivalent */
                            border-color: var(--border-color);
                            box-shadow: none;
                        }
                        .legend-card-custom:hover {
                            background-color: rgba(0, 0, 0, 0.06);
                        }
                        :is(.dark) .legend-card-custom:hover {
                            background-color: rgba(255, 255, 255, 0.1); /* White/10 equivalent */
                        }
                    `}</style>
                    <div className="w-full md:w-5/12 h-full min-h-[200px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 20, right: 0, bottom: 20, left: 0 }}>
                                <Pie
                                    data={sortedData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ percent }: { percent?: number }) => (percent && percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : null)}
                                    outerRadius="75%"
                                    innerRadius="55%"
                                    paddingAngle={2}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {sortedData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none focus:outline-none" />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Custom Legend - 2 Columns Grid - Modern Style */}
                    <div className="w-full md:w-7/12 overflow-y-auto max-h-[280px] custom-scrollbar pr-2">
                        <div className="grid grid-cols-2 gap-2">
                            {sortedData.map((entry, index) => (
                                <div
                                    key={`legend-${index}`}
                                    className="flex items-center justify-between p-2 rounded shadow-sm transition-all group legend-card-custom"
                                    title={`${entry.name}: ${entry.value}`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ring-2 ring-transparent group-hover:ring-current transition-all opacity-80 group-hover:opacity-100"
                                            style={{ backgroundColor: COLORS[index % COLORS.length], color: `${COLORS[index % COLORS.length]}40` }}
                                        />
                                        <span className="text-xs font-medium text-text-light group-hover:text-text-dark truncate transition-colors">
                                            {entry.name}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 min-w-[20px] text-center tabular-nums transition-colors ${entry.value > 0 ? 'bg-brand-main/10 text-brand-main' : 'bg-transparent text-text-light'}`}>
                                        {entry.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-light">
                    <p>Nenhum dado disponível no período selecionado</p>
                </div>
            )}
        </div>
    );
}
