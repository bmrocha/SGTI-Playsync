"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { useAnalyticsStore } from "@/lib/analytics-store";
import { AnalyticsFilters } from "@/components/analytics/analytics-filters";
import { ViewChart } from "@/components/analytics/view-chart";
import { MediaChart } from "@/components/analytics/media-chart";
import { DistributionChart } from "@/components/analytics/distribution-chart";
import { generateCSV, triggerPrint } from "@/lib/report-generator";
import { TrendingUp, Play, Clock, Folder, Building2, FileDown, Printer, Loader2 } from "lucide-react";

export default function AnalyticsPage() {
    const { companies, fetchData: fetchStoreData } = useAppStore();
    const { getFilteredStats, getTopPlaylists, getCompanyStats, fetchAnalytics, isLoading, dateRange, error } = useAnalyticsStore();

    // Fetch data on mount
    useEffect(() => {
        fetchAnalytics();
        fetchStoreData();
    }, [fetchAnalytics, fetchStoreData]);

    // Get filtered stats based on selected date range
    const { topMedia, totalPlays, totalDuration, playsByDay, filteredEvents } = getFilteredStats();

    // Overall stats context
    const totalCompanies = Object.keys(companies).length;
    const totalPlaylists = getTopPlaylists(100).length;

    // Company stats for pie chart - Derived from filtered events to support synced data
    const companyStats = Object.keys(companies).map(companyName => {
        const companyEvents = (filteredEvents || []).filter(e => e.companyName === companyName);
        return {
            name: companyName,
            value: companyEvents.length,
        };
    });

    // Format duration
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    const handleExportCSV = () => {
        if (!filteredEvents || filteredEvents.length === 0) return;

        const data = filteredEvents.map(e => ({
            'Data/Hora': new Date(e.timestamp).toLocaleString('pt-BR'),
            'Mídia': e.mediaName,
            'Duração (s)': e.duration,
            'Empresa': e.companyName,
            'Playlist': e.playlistName
        }));

        generateCSV(data, `relatorio_analitico_${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pt-6 pb-20 px-4 sm:px-6 lg:px-8 print:p-0 custom-scrollbar">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 print:hidden">
                <div>
                    <h1 className="text-3xl font-bold text-text-dark flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-brand-main" />
                        Analytics & Estatísticas
                    </h1>
                    <p className="text-text-light mt-2">
                        Acompanhe o desempenho das suas mídias e playlists
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportCSV}
                        disabled={!filteredEvents || filteredEvents.length === 0}
                        className="btn-premium bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileDown className="w-4 h-4 mr-2" />
                        Exportar CSV
                    </button>
                    <button
                        onClick={triggerPrint}
                        className="btn-premium bg-blue-600 text-white px-4 py-2 hover:bg-blue-700"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Imprimir
                    </button>
                </div>
            </div>

            <AnalyticsFilters />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-brand-main animate-spin mb-4" />
                    <p className="text-text-light">Carregando dados analíticos...</p>
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 px-6 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="w-6 h-6 text-red-500 rotate-180" />
                    </div>
                    <h3 className="text-xl font-bold text-red-500 mb-2 uppercase tracking-tight">Falha na Sincronização</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
                        {error}
                    </p>
                    <button 
                        onClick={() => fetchAnalytics()}
                        className="btn-premium bg-red-500 text-white px-6 py-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-110 active:scale-95 transition-all"
                    >
                        Tentar Novamente
                    </button>
                </div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Reproduções (Filtrado)</p>
                            <p className="text-3xl font-bold mt-2">{totalPlays.toLocaleString()}</p>
                        </div>
                        <Play className="w-12 h-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Tempo (Filtrado)</p>
                            <p className="text-3xl font-bold mt-2">{formatDuration(totalDuration)}</p>
                        </div>
                        <Clock className="w-12 h-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Playlists Totais</p>
                            <p className="text-3xl font-bold mt-2">{totalPlaylists}</p>
                        </div>
                        <Folder className="w-12 h-12 text-purple-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">Empresas</p>
                            <p className="text-3xl font-bold mt-2">{totalCompanies}</p>
                        </div>
                        <Building2 className="w-12 h-12 text-orange-200" />
                    </div>
                </div>
            </div>

            {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Plays Over Time Chart (New) */}
                    <div className="lg:col-span-2">
                        <ViewChart data={playsByDay} />
                    </div>

                    {/* Top Media Chart */}
                    <MediaChart data={topMedia} />

                    {/* Company Distribution */}
                    <DistributionChart 
                        title={
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-brand-main" />
                                <span>Distribuição por Empresa</span>
                            </div>
                        } 
                        data={companyStats} 
                    />
                </div>
                </>
            )}
            </div>
        </div>
    );
}
