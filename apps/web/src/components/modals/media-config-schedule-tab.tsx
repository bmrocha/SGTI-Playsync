"use client";

import { Calendar } from "lucide-react";
import { CustomDateInput } from "@/components/inputs/custom-date-input";
import { CustomTimeInput } from "@/components/inputs/custom-time-input";
import { DaySelector } from "@/components/scheduling/day-selector";
import { cn } from "@/lib/utils";

interface MediaConfigScheduleTabProps {
    scheduleEnabled: boolean;
    setScheduleEnabled: (enabled: boolean) => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    daysOfWeek: number[];
    setDaysOfWeek: (days: number[]) => void;
    startTime: string;
    setStartTime: (time: string) => void;
    endTime: string;
    setEndTime: (time: string) => void;
    allDay: boolean;
    setAllDay: (allDay: boolean) => void;
    theme: string;
}

export function MediaConfigScheduleTab({
    scheduleEnabled,
    setScheduleEnabled,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    daysOfWeek,
    setDaysOfWeek,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    allDay,
    setAllDay,
    theme,
}: MediaConfigScheduleTabProps) {
    return (
        <div className={cn(
            "p-4 rounded-xl border transition-all",
            theme === 'dark' ? "bg-white/5 border-white/5" : "bg-white border-slate-200"
        )}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", scheduleEnabled ? "bg-brand-main/20 text-brand-main" : "bg-slate-100 dark:bg-white/10 text-slate-400")}>
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className={cn("text-sm font-bold uppercase", theme === 'dark' ? "text-white" : "text-slate-800")}>Ativar Agendamento</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Restringir exibição por data/hora</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={scheduleEnabled} onChange={(e) => setScheduleEnabled(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-main"></div>
                </label>
            </div>

            {scheduleEnabled && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-main uppercase tracking-wider">Data Inicial</label>
                            <CustomDateInput value={startDate} onChange={setStartDate} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-main uppercase tracking-wider">Data Final</label>
                            <CustomDateInput value={endDate} onChange={setEndDate} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-brand-main uppercase tracking-wider">Dias da Semana</label>
                        <DaySelector value={daysOfWeek} onChange={setDaysOfWeek} />
                    </div>

                    <div className="pt-4 border-t border-dashed border-slate-200 dark:border-white/10">
                        <div className="flex items-center justify-between mb-4">
                            <label className="text-[10px] font-bold text-brand-main uppercase tracking-wider">Horário</label>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-bold uppercase", !allDay ? "text-slate-800 dark:text-white" : "text-slate-400")}>Definir Horário</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="sr-only peer" />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-main"></div>
                                </label>
                                <span className={cn("text-[10px] font-bold uppercase", allDay ? "text-brand-main" : "text-slate-400")}>Dia Todo</span>
                            </div>
                        </div>

                        {!allDay && (
                            <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Início</label>
                                    <CustomTimeInput value={startTime} onChange={setStartTime} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Fim</label>
                                    <CustomTimeInput value={endTime} onChange={setEndTime} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
