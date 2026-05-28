"use client";

import { cn } from "@/lib/utils";
import { useThemeStore } from "@/lib/theme-store";

interface DaySelectorProps {
    value: number[];
    onChange: (days: number[]) => void;
}

const DAYS = [
    { value: 0, label: 'Dom', fullName: 'Domingo' },
    { value: 1, label: 'Seg', fullName: 'Segunda' },
    { value: 2, label: 'Ter', fullName: 'Terça' },
    { value: 3, label: 'Qua', fullName: 'Quarta' },
    { value: 4, label: 'Qui', fullName: 'Quinta' },
    { value: 5, label: 'Sex', fullName: 'Sexta' },
    { value: 6, label: 'Sáb', fullName: 'Sábado' },
];

export function DaySelector({ value, onChange }: DaySelectorProps) {
    const { theme } = useThemeStore();
    const toggleDay = (day: number) => {
        if (value.includes(day)) {
            onChange(value.filter(d => d !== day));
        } else {
            onChange([...value, day].sort());
        }
    };

    const selectAll = () => {
        onChange([0, 1, 2, 3, 4, 5, 6]);
    };

    const selectWeekdays = () => {
        onChange([1, 2, 3, 4, 5]);
    };

    const selectWeekend = () => {
        onChange([0, 6]);
    };

    const clearAll = () => {
        onChange([]);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-text-dark">
                    📅 Dias da Semana
                </label>
                <div className="flex gap-2"> {/* Aumentado gap */}
                    <button
                        type="button"
                        onClick={selectAll}
                        className="text-xs px-2 py-1 bg-brand-main/10 text-brand-main rounded hover:bg-brand-main/20 transition-colors"
                    >
                        Todos
                    </button>
                    <button
                        type="button"
                        onClick={selectWeekdays}
                        className="text-xs px-2 py-1 bg-blue-500/10 text-blue-600 rounded hover:bg-blue-500/20 transition-colors"
                    >
                        Úteis
                    </button>
                    <button
                        type="button"
                        onClick={selectWeekend}
                        className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 transition-colors"
                    >
                        Fim de Semana
                    </button>
                    <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs px-2 py-1 bg-red-500/10 text-red-600 rounded hover:bg-red-500/20 transition-colors"
                    >
                        Limpar
                    </button>
                </div>
            </div>

            {/* Grid layout to fill width evenly */}
            <div className="grid grid-cols-7 gap-2">
                {DAYS.map((day) => {
                    const isSelected = value.includes(day.value);
                    const isAllSelected = value.length === 7; // Check if ALL days are selected
                    const isWeekend = day.value === 0 || day.value === 6;

                    // Dynamic Color Logic
                    let activeClass = "";

                    if (isAllSelected) {
                        // ALL SELECTED = GREEN (Brand Main) matches "Todos" button
                        activeClass = "bg-brand-main text-white border-brand-main shadow-sm shadow-brand-main/30 dark:shadow-none";
                    } else if (isWeekend) {
                        // Partial Selection: Weekend = Indigo matches "Fim de Semana"
                        activeClass = "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200 dark:shadow-none";
                    } else {
                        // Partial Selection: Weekday = Blue matches "Úteis"
                        activeClass = "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200 dark:shadow-none";
                    }

                    return (
                        <button
                            key={day.value}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                toggleDay(day.value);
                            }}
                            className={cn(
                                "w-full h-9 flex items-center justify-center rounded-md font-bold transition-all border text-xs", // Full width, fixed height
                                isSelected
                                    ? activeClass // Dynamic Color
                                    : (theme === 'dark' ? "bg-white/5 text-slate-400 border-white/10 hover:border-brand-main/40 hover:text-brand-main hover:bg-white/10" : "bg-white text-slate-500 border-slate-100 hover:border-brand-main/40 hover:text-brand-main hover:bg-brand-main/5")
                            )}
                            title={day.fullName}
                        >
                            {day.label}
                        </button>
                    );
                })}
            </div>

            {value.length > 0 && (
                <div className="text-xs text-text-light">
                    Selecionados: {value.map(d => DAYS[d].fullName).join(', ')}
                </div>
            )}
        </div>
    );
}
