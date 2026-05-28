"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";
import { cn } from "@/lib/utils";

interface CustomDateInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    label?: string;
    placeholder?: string;
    dropUp?: boolean;
}

const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CustomDateInput({ value, onChange, className = "", label, placeholder = "Selecione uma data", dropUp = false }: CustomDateInputProps) {
    const { theme } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse the value (YYYY-MM-DD format)
    const selectedDate = value ? new Date(value + 'T00:00:00') : null;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Get days in month
    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate();
    };

    // Get first day of month (0 = Sunday)
    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay();
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth, currentYear);
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
        const days: (number | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    };

    const handleDayClick = (day: number) => {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(dateStr);
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const formatDisplayDate = (dateStr: string) => {
        if (!dateStr) return "dd/mm/aaaa";
        const date = new Date(dateStr + 'T00:00:00');
        return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    };

    const isSelectedDay = (day: number) => {
        if (!selectedDate) return false;
        return (
            selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth &&
            selectedDate.getFullYear() === currentYear
        );
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentMonth &&
            today.getFullYear() === currentYear
        );
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {label && (
                <label className="block text-xs font-bold text-text-light mb-1">{label}</label>
            )}

            {/* Input Display */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-10 flex items-center justify-between px-3 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-main/20",
                    theme === 'dark'
                        ? "bg-white/5 border-white/10 text-white hover:border-brand-main"
                        : "bg-white border-slate-100 text-slate-700 hover:border-brand-main shadow-sm"
                )}
            >
                <span className={value ? "text-text-dark" : "text-text-light"}>
                    {value ? formatDisplayDate(value) : placeholder}
                </span>
                <Calendar className="w-4 h-4 text-text-light" />
            </button>

            {/* Calendar Dropdown */}
            {isOpen && (
                <div className={cn(
                    "absolute left-0 z-50 border rounded-xl shadow-2xl p-4 w-[280px] animate-scaleIn",
                    dropUp ? 'bottom-full mb-2' : 'top-full mt-2',
                    theme === 'dark' ? "bg-[#0c1412] border-white/10" : "bg-white border-slate-100"
                )}>
                    {/* Month/Year Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1.5 hover:bg-border/30 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-text-dark" />
                        </button>

                        <div className="text-sm font-bold text-text-dark">
                            {MONTHS[currentMonth]} {currentYear}
                        </div>

                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1.5 hover:bg-border/30 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-text-dark" />
                        </button>
                    </div>

                    {/* Day Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map((day) => (
                            <div
                                key={day}
                                className="text-xs font-semibold text-text-light text-center py-1"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1">
                        {generateCalendarDays().map((day, index) => (
                            <div key={index} className="aspect-square">
                                {day ? (
                                    <button
                                        type="button"
                                        onClick={() => handleDayClick(day)}
                                        className={`
                                            w-full h-full flex items-center justify-center text-sm rounded-lg transition-all
                                            ${isSelectedDay(day)
                                                ? "bg-brand-accent text-black font-bold shadow-md"
                                                : isToday(day)
                                                    ? "bg-brand-accent/20 text-brand-accent font-semibold"
                                                    : "text-text-dark hover:bg-border/30"
                                            }
                                        `}
                                    >
                                        {day}
                                    </button>
                                ) : (
                                    <div />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                        <button
                            type="button"
                            onClick={() => {
                                const today = new Date();
                                const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                onChange(dateStr);
                                setIsOpen(false);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs font-semibold text-brand-accent hover:bg-brand-accent/10 rounded-lg transition-colors"
                        >
                            Hoje
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onChange("");
                                setIsOpen(false);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs font-semibold text-text-light hover:bg-border/30 rounded-lg transition-colors"
                        >
                            Limpar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
