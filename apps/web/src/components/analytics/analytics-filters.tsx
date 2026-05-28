"use client";

import { useAnalyticsStore, DateRange } from "@/lib/analytics-store";
import { CustomDateInput } from "@/components/inputs/custom-date-input";
import { useState, useEffect } from "react";
import { Calendar, Filter } from "lucide-react";

export function AnalyticsFilters() {
    const { dateRange, setDateRange } = useAnalyticsStore();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [showCustom, setShowCustom] = useState(false);

    // Sync local state with global store
    useEffect(() => {
        if (dateRange.label === 'custom' && dateRange.start && dateRange.end) {
            setStartDate(dateRange.start.toISOString().split('T')[0]);
            setEndDate(dateRange.end.toISOString().split('T')[0]);
            setShowCustom(true);
        } else {
            setShowCustom(dateRange.label === 'custom');
        }
    }, [dateRange]);

    const handleQuickFilter = (label: DateRange['label']) => {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = null;

        switch (label) {
            case 'hoje':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date(now.setHours(23, 59, 59, 999));
                break;
            case 'semana':
                const firstDay = now.getDate() - now.getDay();
                start = new Date(now.setDate(firstDay));
                start.setHours(0, 0, 0, 0);
                end = new Date();
                break;
            case 'mes':
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                break;
            case 'total':
                start = null;
                end = null;
                break;
            case 'custom':
                setShowCustom(true);
                return; // Wait for inputs
        }

        setShowCustom(false);
        setDateRange({ start, end, label });
    };

    const handleCustomApply = () => {
        if (!startDate || !endDate) return;
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        setDateRange({ start, end, label: 'custom' });
    };

    return (
        <div className="bg-panel-bg border border-border rounded-xl p-3 mb-6 shadow-sm flex flex-col lg:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent">
                    <Filter className="w-4 h-4" />
                </div>
                <h3 className="text-text-dark font-semibold">Filtrar Dados</h3>
            </div>

            <div className="flex items-center gap-2 bg-body-bg p-1 rounded-lg border border-border">
                {(['hoje', 'semana', 'mes', 'total', 'custom'] as const).map((key) => (
                    <button
                        key={key}
                        onClick={() => handleQuickFilter(key)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${dateRange.label === key
                            ? "bg-brand-main text-white shadow-sm"
                            : "text-text-light hover:text-text-dark hover:bg-panel-bg"
                            }`}
                    >
                        {key === 'hoje' && 'Hoje'}
                        {key === 'semana' && 'Esta Semana'}
                        {key === 'mes' && 'Este Mês'}
                        {key === 'total' && 'Total'}
                        {key === 'custom' && 'Personalizado'}
                    </button>
                ))}
            </div>

            {showCustom && (
                <div className="flex items-center gap-2 animate-fadeIn ml-4 border-l border-border pl-4">
                    <span className="text-sm font-medium text-text-light whitespace-nowrap">De</span>
                    <div className="w-36">
                        <CustomDateInput
                            value={startDate}
                            onChange={setStartDate}
                            placeholder="Início"
                        />
                    </div>
                    <span className="text-sm font-medium text-text-light whitespace-nowrap">Até</span>
                    <div className="w-36">
                        <CustomDateInput
                            value={endDate}
                            onChange={setEndDate}
                            placeholder="Fim"
                        />
                    </div>
                    <button
                        onClick={handleCustomApply}
                        className="h-10 px-4 bg-brand-accent text-black rounded-lg text-sm font-bold hover:bg-brand-accent/90 transition-colors shadow-sm whitespace-nowrap"
                    >
                        Aplicar
                    </button>
                </div>
            )}
        </div>
    );
}
