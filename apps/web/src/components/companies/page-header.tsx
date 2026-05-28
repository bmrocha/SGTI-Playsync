"use client";

import { Building2, Filter, Plus } from "lucide-react";
import { Permission, hasPermission, UserRole } from "@/lib/permissions";

interface PageHeaderProps {
    totalItems: number;
    showFilters: boolean;
    onToggleFilters: () => void;
    user: { id: string; name: string; role: string } | null;
    onNewCompany: () => void;
}

export default function PageHeader({ totalItems, showFilters, onToggleFilters, user, onNewCompany }: PageHeaderProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 laptop:mb-6 pb-6 laptop:pb-4 border-b border-slate-200">
            <div>
                <h1 className="text-3xl laptop:text-2xl font-bold text-text-dark flex items-center gap-3">
                    <Building2 className="w-8 h-8 text-brand-main" />
                    Gerenciar Empresas
                </h1>
                <p className="text-text-light mt-2">
                    {totalItems === 0
                        ? "Nenhuma empresa encontrada"
                        : `${totalItems} empresa${totalItems !== 1 ? 's' : ''}`
                    }
                </p>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={onToggleFilters}
                    className={`btn-premium px-3 py-2 border ${showFilters ? 'bg-green-600 text-white border-green-600' : 'bg-panel-bg border-border text-text-light hover:border-green-600 hover:text-green-600'}`}
                    title="Filtrar"
                >
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Filtros</span>
                </button>
                {user && hasPermission(user.role as UserRole, Permission.CREATE_COMPANY) && (
                    <button
                        onClick={onNewCompany}
                        className="btn-premium bg-brand-main text-white px-4 py-2 hover:bg-brand-main/90"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nova Empresa
                    </button>
                )}
            </div>
        </div>
    );
}
