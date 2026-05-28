"use client";

import { Search, X, SortAsc, SortDesc } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

interface FiltersBarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    sortBy: string;
    onSortChange: (value: string) => void;
}

export function FiltersBar({ searchTerm, onSearchChange, sortBy, onSortChange }: FiltersBarProps) {
    return (
        <div className="mb-6 bg-panel-bg border border-border rounded-xl p-4 animate-slideUp shadow-sm">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-light" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Pesquisar por nome de playlist..."
                        className="w-full pl-10 pr-10 py-2.5 bg-body-bg border border-border rounded-lg text-sm focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 outline-none transition-all text-text-dark placeholder:text-text-light/50"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-dark transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-48">
                        <CustomSelect
                            value={sortBy}
                            onChange={onSortChange}
                            options={[
                                { value: "name-asc", label: <div className="flex items-center gap-2"><SortAsc size={16} /> Nome (A-Z)</div> },
                                { value: "name-desc", label: <div className="flex items-center gap-2"><SortDesc size={16} /> Nome (Z-A)</div> }
                            ]}
                            placeholder="Ordenar"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
