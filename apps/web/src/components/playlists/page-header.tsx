"use client";

import { Tv, Plus, Filter } from "lucide-react";
import { Permission, hasPermission, UserRole } from "@/lib/permissions";

interface PageHeaderProps {
    totalItems: number;
    showFilters: boolean;
    onToggleFilters: () => void;
    user: any;
    onNewPlaylist: () => void;
}

export function PageHeader({ totalItems, showFilters, onToggleFilters, user, onNewPlaylist }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
            <div>
                <h1 className="text-3xl font-bold text-text-dark flex items-center gap-3">
                    <Tv className="w-8 h-8 text-brand-main" />
                    Gerenciar Playlists
                </h1>
                <p className="text-text-light mt-2">
                    {totalItems === 0
                        ? "Nenhuma playlist encontrada"
                        : `${totalItems} playlist${totalItems !== 1 ? 's' : ''} cadastrada(s)`
                    }
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onToggleFilters}
                    className={`btn-premium px-3 py-2 border ${showFilters ? 'bg-brand-main text-white border-brand-main' : 'bg-panel-bg border-border text-text-light hover:border-brand-main hover:text-brand-main'}`}
                    title="Filtrar"
                >
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Filtros</span>
                </button>
                {user && hasPermission(user.role as UserRole, Permission.CREATE_PLAYLIST) && (
                    <button
                        onClick={onNewPlaylist}
                        className="btn-premium bg-brand-main text-white px-4 py-2 hover:bg-brand-main/90"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Playlist
                    </button>
                )}
            </div>
        </div>
    );
}
