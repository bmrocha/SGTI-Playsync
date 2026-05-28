"use client";

import { Activity, Calendar, User } from "lucide-react";

interface AuditStatsProps {
    total: number;
    today: number;
    activeUsers: number;
}

export function AuditStats({ total, today, activeUsers }: AuditStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-panel-bg border border-border rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-brand-main/10 rounded-lg flex items-center justify-center">
                        <Activity className="w-6 h-6 text-brand-main" />
                    </div>
                    <div>
                        <p className="text-sm text-text-light">Total de Logs</p>
                        <p className="text-2xl font-bold text-text-dark">{total.toLocaleString()}</p>
                    </div>
                </div>
            </div>
            <div className="bg-panel-bg border border-border rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <p className="text-sm text-text-light">Ações Hoje</p>
                        <p className="text-2xl font-bold text-text-dark">{today}</p>
                    </div>
                </div>
            </div>
            <div className="bg-panel-bg border border-border rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-text-light">Usuários Ativos Hoje</p>
                        <p className="text-2xl font-bold text-text-dark">{activeUsers}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
