"use client";

import { Building2, Trash2, Edit, User } from "lucide-react";
import { Permission, hasPermission, UserRole } from "@/lib/permissions";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

interface Company {
    id: string;
    name: string;
    description: string;
    color: string;
    creator_name?: string;
}

interface CompanyCardProps {
    company: Company;
    user: { id: string; name: string; role: string } | null;
    onEdit: (id: string) => void;
    onDelete: (id: string, name: string) => void;
    router: AppRouterInstance;
}

export default function CompanyCard({ company, user, onEdit, onDelete, router }: CompanyCardProps) {
    const canClick = user && hasPermission(user.role as UserRole, Permission.VIEW_PLAYLIST) &&
        (hasPermission(user.role as UserRole, Permission.CREATE_PLAYLIST) ||
            hasPermission(user.role as UserRole, Permission.EDIT_PLAYLIST));

    return (
        <div
            key={company.id}
            onClick={() => {
                if (canClick) {
                    router.push(`/dashboard/playlists?company=${encodeURIComponent(company.name)}`);
                }
            }}
            className={`card-hover bg-panel-bg rounded-xl overflow-hidden shadow-sm border border-border p-6 laptop:p-5 flex flex-col relative group ${canClick ? "cursor-pointer" : "cursor-default text-text-light/80"
                }`}
        >
            <div className="flex items-center mb-5">
                <div
                    className="w-12 h-12 laptop:w-10 laptop:h-10 rounded-full flex items-center justify-center text-2xl mr-4 shadow-inner transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${company.color}20` }}
                >
                    <Building2 style={{ color: company.color }} className="w-6 h-6 laptop:w-5 laptop:h-5 transition-transform duration-300 group-hover:rotate-12" />
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="m-0 text-lg laptop:text-base text-text-dark font-bold truncate" title={company.name}>{company.name}</h4>
                    <span className="text-sm text-text-light truncate block" title={company.description}>{company.description}</span>

                    {user && user.role === UserRole.ADMIN && (
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] laptop:text-[9px] font-bold uppercase tracking-wider text-text-light/60 bg-body-bg/50 px-2 py-1 rounded-md border border-border/50 w-fit">
                            <User className="w-3 h-3 text-brand-main" />
                            <span>Criado por: {company.creator_name || 'Sistema'}</span>
                        </div>
                    )}
                </div>
            </div>

            {user && hasPermission(user.role as UserRole, Permission.EDIT_COMPANY) && (
                <div className="flex gap-3 mt-auto pt-4 border-t border-border">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit(company.id); }}
                        className="btn-premium flex-1 bg-border/50 text-text-dark hover:bg-brand-main hover:text-white text-sm py-2 group-hover:bg-body-bg transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Edit className="w-4 h-4" /> Editar
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(company.id, company.name); }}
                        className="btn-premium flex-1 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-500 hover:text-white text-sm py-2 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        title="Excluir Empresa"
                    >
                        <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                </div>
            )}
        </div>
    );
}
