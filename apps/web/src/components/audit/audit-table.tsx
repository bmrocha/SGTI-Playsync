"use client";

import { Fragment } from "react";
import { Package, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Activity, Shield } from "lucide-react";
import { ActivityLog } from "@/lib/activity-log-store";

interface AuditTableProps {
    loading: boolean;
    filteredLogs: ActivityLog[];
    currentLogs: ActivityLog[];
    expandedRow: string | null;
    onToggleRow: (id: string | null) => void;
    pageNumbers: (number | string)[];
    currentPage: number;
    totalPages: number;
    logsPerPage: number;
    onPageChange: (page: number) => void;
    getActionStyle: (action: string) => { color: string; bg: string };
    cleanIp: (ip: any) => string;
    getDisplayIp: (log: ActivityLog) => string;
}

export function AuditTable({
    loading,
    filteredLogs,
    currentLogs,
    expandedRow,
    onToggleRow,
    pageNumbers,
    currentPage,
    totalPages,
    logsPerPage,
    onPageChange,
    getActionStyle,
    cleanIp,
    getDisplayIp,
}: AuditTableProps) {
    if (loading) {
        return (
            <div className="bg-panel-bg border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-12 text-center">
                    <div className="spinner mx-auto mb-4"></div>
                    <p className="text-text-light">Carregando logs...</p>
                </div>
            </div>
        );
    }

    if (filteredLogs.length === 0) {
        return (
            <div className="bg-panel-bg border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-12 text-center">
                    <Package className="w-16 h-16 text-text-light mx-auto mb-4 opacity-50" />
                    <p className="text-text-light">Nenhum log encontrado</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-panel-bg border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-body-bg border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Data/Hora</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Usuário</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Ação</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Recurso</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">Detalhes</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-text-light uppercase tracking-wider">IP</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-text-light uppercase tracking-wider">Metadata</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {currentLogs.map((log) => {
                            const style = getActionStyle(log.action);
                            const isExpanded = expandedRow === log.id;

                            return (
                                <Fragment key={log.id}>
                                    <tr className="hover:bg-body-bg/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-text-dark">{log.userName}</div>
                                            <div className="text-xs text-text-light">{log.userRole}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.color}`}>
                                                {log.action.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 bg-border rounded text-xs font-medium text-text-dark">
                                                {log.resource}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-dark max-w-md truncate">
                                            {cleanIp(log.details)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-text-dark">
                                            {getDisplayIp(log)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {log.metadata && (
                                                <button
                                                    onClick={() => onToggleRow(isExpanded ? null : log.id)}
                                                    className="text-brand-main hover:text-brand-main/80 transition-colors"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr key={`${log.id}-expanded`} className="bg-body-bg/30">
                                            <td colSpan={7} className="px-6 py-6 animate-fadeIn">
                                                <div className="bg-panel-bg border border-border rounded-xl shadow-lg overflow-hidden">
                                                    <div className="bg-body-bg px-4 py-2 border-b border-border flex justify-between items-center">
                                                        <h4 className="text-xs font-bold text-brand-main uppercase tracking-widest">Detalhes do Evento (Metadata)</h4>
                                                        <span className="text-[10px] font-mono text-text-light opacity-50">ID: {log.id}</span>
                                                    </div>

                                                    <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                                    <Activity className="w-4 h-4 text-blue-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-text-light uppercase font-bold">Ação Executada</p>
                                                                    <p className="text-sm text-text-dark font-medium">{log.action.replace(/_/g, ' ')}</p>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-start gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                                    <Package className="w-4 h-4 text-emerald-500" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] text-text-light uppercase font-bold">Recurso Afetado</p>
                                                                    <p className="text-sm text-text-dark font-medium">
                                                                        {log.resource}
                                                                        {(log.resourceName || log.resourceId) && (
                                                                            <span className="text-text-light opacity-50 ml-1">
                                                                                ({log.resourceName || `ID: ${log.resourceId}`})
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="bg-white dark:bg-zinc-950 rounded-lg p-4 font-mono text-[11px] border border-border dark:border-white/5 relative group">
                                                            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(JSON.stringify(log.metadata, null, 2));
                                                                    }}
                                                                    className="bg-slate-100 dark:bg-white/10 hover:bg-brand-main/20 hover:text-brand-main text-text-light dark:text-white/50 px-2 py-0.5 rounded text-[9px] transition-colors border border-border dark:border-transparent"
                                                                >
                                                                    COPIAR
                                                                </button>
                                                                <span className="bg-slate-100 dark:bg-white/10 text-text-light dark:text-white/50 px-2 py-0.5 rounded text-[9px] border border-border dark:border-transparent">JSON</span>
                                                            </div>
                                                            <pre className="text-emerald-700 dark:text-emerald-400 overflow-x-auto custom-scrollbar">
                                                                {JSON.stringify(log.metadata, (key, value) => {
                                                                    if (typeof value === 'string') return cleanIp(value);
                                                                    return value;
                                                                }, 2)}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-text-light">
                        Mostrando {((currentPage - 1) * logsPerPage) + 1} - {Math.min(currentPage * logsPerPage, filteredLogs.length)} de {filteredLogs.length} logs
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2.5 bg-body-bg border border-border rounded-lg text-sm font-medium text-text-dark hover:bg-panel-bg hover:border-brand-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Anterior"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        {pageNumbers.map((page, idx) => {
                            if (page === '...') {
                                return (
                                    <span key={`dots-${idx}`} className="px-2.5 py-1 text-sm text-text-light select-none">
                                        ...
                                    </span>
                                );
                            }
                            return (
                                <button
                                    key={`page-${page}`}
                                    onClick={() => onPageChange(Number(page))}
                                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center ${currentPage === page
                                            ? 'bg-brand-main text-white scale-105'
                                            : 'bg-body-bg border border-border text-text-dark hover:bg-panel-bg hover:border-brand-main'
                                        }`}
                                >
                                    {page}
                                </button>
                            );
                        })}

                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2.5 bg-body-bg border border-border rounded-lg text-sm font-medium text-text-dark hover:bg-panel-bg hover:border-brand-main transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Próxima"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
