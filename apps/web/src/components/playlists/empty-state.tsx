"use client";

import { Search } from "lucide-react";

interface EmptyStateProps {
    searchTerm: string;
    hasActiveFilter?: boolean;
    onClearFilters: () => void;
    onCreatePlaylist: () => void;
}

export function EmptyState({ searchTerm, hasActiveFilter, onClearFilters, onCreatePlaylist }: EmptyStateProps) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-border rounded-xl bg-body-bg/50">
            <div className="w-16 h-16 bg-border/30 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-text-light/50" />
            </div>
            <h3 className="text-xl font-bold text-text-dark mb-2">Nenhuma playlist encontrada</h3>
            <p className="text-text-light max-w-sm mb-6">
                {(searchTerm || hasActiveFilter)
                    ? "Tente ajustar os filtros de pesquisa."
                    : "Comece criando sua primeira playlist para gerenciar suas mídias."}
            </p>
            <button
                onClick={searchTerm ? onClearFilters : onCreatePlaylist}
                className="btn-premium bg-brand-main text-white px-6 py-2.5"
            >
                {searchTerm ? "Limpar Filtros" : "Criar Primeira Playlist"}
            </button>
        </div>
    );
}
