"use client";

import { Search, X } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { ActionType } from "@/lib/activity-log-store";

interface AuditFiltersProps {
    show: boolean;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedAction: string;
    onActionChange: (value: string) => void;
    selectedResource: string;
    onResourceChange: (value: string) => void;
    dateRange: string;
    onDateRangeChange: (value: string) => void;
    customStartDate: string;
    onCustomStartDateChange: (value: string) => void;
    customEndDate: string;
    onCustomEndDateChange: (value: string) => void;
    actions: ActionType[];
    resources: string[];
}

export function AuditFilters({
    show,
    searchTerm,
    onSearchChange,
    selectedAction,
    onActionChange,
    selectedResource,
    onResourceChange,
    dateRange,
    onDateRangeChange,
    customStartDate,
    onCustomStartDateChange,
    customEndDate,
    onCustomEndDateChange,
    actions,
    resources,
}: AuditFiltersProps) {
    if (!show) return null;

    return (
        <div className="mb-6 bg-panel-bg border border-border rounded-xl p-3 sm:p-4 animate-slideUp shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full pl-9 pr-9 py-2 bg-body-bg border border-border rounded-lg text-sm focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all text-text-dark placeholder:text-text-light/50"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <CustomSelect
                    value={selectedAction}
                    onChange={onActionChange}
                    options={[
                        { value: '', label: 'Todas as Ações' },
                        ...actions.map(action => ({ value: action, label: action.replace(/_/g, ' ') }))
                    ]}
                    placeholder="Filtrar por Ação"
                />

                <CustomSelect
                    value={selectedResource}
                    onChange={onResourceChange}
                    options={[
                        { value: '', label: 'Todos os Recursos' },
                        ...resources.map(resource => ({ value: resource, label: resource }))
                    ]}
                    placeholder="Filtrar por Recurso"
                />

                <CustomSelect
                    value={dateRange}
                    onChange={onDateRangeChange}
                    options={[
                        { value: '7', label: 'Últimos 7 dias' },
                        { value: '30', label: 'Últimos 30 dias' },
                        { value: '90', label: 'Últimos 90 dias' },
                        { value: 'custom', label: 'Personalizado' },
                        { value: 'all', label: 'Todos' },
                    ]}
                    placeholder="Período"
                />
            </div>

            {dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => onCustomStartDateChange(e.target.value)}
                        className="px-3 py-2 bg-body-bg border border-border rounded-lg text-sm focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all text-text-dark"
                    />
                    <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => onCustomEndDateChange(e.target.value)}
                        className="px-3 py-2 bg-body-bg border border-border rounded-lg text-sm focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all text-text-dark"
                    />
                </div>
            )}
        </div>
    );
}
