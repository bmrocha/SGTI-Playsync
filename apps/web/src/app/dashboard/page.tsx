"use client";

import { useEffect } from "react";
import { DashboardKPIGrid } from "@/components/dashboard/dashboard-kpi-grid";
import { MediaDistributionChart } from "@/components/dashboard/charts/media-distribution-chart";
import { DateTimeWeatherWidget } from "@/components/dashboard/widgets/date-time-weather";
import { SystemActivityChart } from "@/components/dashboard/widgets/system-activity-chart";
import { StorageDetailsWidget } from "@/components/dashboard/widgets/storage-details-widget";
import { useAppStore } from "@/lib/store";

import { LayoutDashboard } from "lucide-react";

export default function DashboardPage() {
    const { fetchData } = useAppStore();

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <div className="py-2.5 px-4 sm:px-6 lg:px-8 flex flex-col gap-3 w-full animate-fadeIn h-full overflow-hidden">
            {/* Header Section Standardized with brand-accent */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold text-text-dark flex items-center gap-3">
                        <LayoutDashboard className="w-8 h-8 text-brand-main" />
                        Visão Geral
                    </h1>
                    <p className="text-text-light mt-2">Central de controle e monitoramento do seu sistema.</p>
                </div>
                <div className="hidden md:block">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-bold uppercase tracking-widest">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Sistema Online
                    </div>
                </div>
            </div>

            {/* Top Row: KPIs (Full Width) - Slightly smaller height */}
            <div className="w-full shrink-0">
                <DashboardKPIGrid />
            </div>

            {/* Main Content Grid - Optimized to avoid scroll */}
            <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
                {/* Left Column: Charts (8 cols) */}
                <div className="col-span-12 laptop:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SystemActivityChart />
                    <MediaDistributionChart />
                </div>

                {/* Right Column: Widgets (4 cols) */}
                <div className="col-span-12 laptop:col-span-4 flex flex-col gap-4">
                    {/* Weather & Time */}
                    <div className="shrink-0">
                        <DateTimeWeatherWidget />
                    </div>

                    {/* Storage */}
                    <div className="flex-1 min-h-0">
                        <StorageDetailsWidget />
                    </div>
                </div>
            </div>
        </div>
    );
}
