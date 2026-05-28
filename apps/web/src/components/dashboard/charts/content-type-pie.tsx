"use client";

import { useAppStore } from "@/lib/store";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useThemeStore } from "@/lib/theme-store";

export function ContentTypePie() {
    const { getGlobalStats } = useAppStore();
    const stats = getGlobalStats();

    const data = [
        { name: 'Imagens', value: stats.photos },
        { name: 'Vídeos', value: stats.videos },
    ];

    const COLORS = ['#d4ff00', '#22d3bb']; // Verde Neon Premium, Teal Neon

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-panel-bg p-2 border border-border rounded-lg shadow-lg">
                    <p className="text-sm font-bold" style={{ color: payload[0].fill }}>
                        {payload[0].name}: {payload[0].value}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-panel-bg p-4 laptop:p-5 rounded-2xl shadow-sm border border-border h-full flex flex-col transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <h3 className="text-text-dark font-bold text-base laptop:text-lg mb-0.5 laptop:mb-1">Composição de Conteúdo</h3>
            <p className="text-text-light text-[10px] laptop:text-xs mb-2 laptop:mb-4">Fotos vs Vídeos</p>

            <div className="flex-1 w-full min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            formatter={(value, entry: any) => (
                                <span className="text-text-light ml-1 text-xs laptop:text-sm font-medium">{value}</span>
                            )}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            {/* Center Stats (Overlay) - Optional Visual Flair */}
            {/* Note: In a real app we might absolutely position text in the middle of the donut */}
        </div>
    );
}
