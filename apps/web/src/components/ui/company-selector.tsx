"use client";

import { useState, useMemo } from "react";
import { Search, CheckCircle2, CheckSquare, Square, Tv } from "lucide-react";

interface Option {
    value: string;
    label: string;
    color?: string;
}

interface CompanySelectorProps {
    value: string[];
    onChange: (value: string[]) => void;
    options: Option[];
    className?: string;
}

export function CompanySelector({ value, onChange, options, className = "" }: CompanySelectorProps) {
    const [searchTerm, setSearchTerm] = useState("");

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const handleToggle = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const handleSelectAll = () => {
        const allFilteredValues = filteredOptions.map(opt => opt.value);
        // Combine current values with all filtered values (avoiding duplicates)
        const newValue = Array.from(new Set([...value, ...allFilteredValues]));
        onChange(newValue);
    };

    const handleDeselectAll = () => {
        // Remove only the visible (filtered) options from the selection
        const visibleValues = filteredOptions.map(opt => opt.value);
        onChange(value.filter(v => !visibleValues.includes(v)));
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search and Bulk Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-border">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
                    <input
                        type="text"
                        placeholder="Buscar empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-body-bg border border-border rounded-md focus:border-brand-main focus:ring-1 focus:ring-brand-main/50 outline-none transition-all"
                    />
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={handleSelectAll}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-brand-main bg-brand-main/10 hover:bg-brand-main/20 rounded-md transition-colors"
                    >
                        <CheckSquare className="w-4 h-4" />
                        Todos
                    </button>
                    <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-text-light hover:text-text-dark hover:bg-gray-200 dark:hover:bg-white/10 rounded-md transition-colors"
                    >
                        <Square className="w-4 h-4" />
                        Limpar
                    </button>
                </div>
            </div>

            {/* Grid stats */}
            <div className="text-xs text-text-light font-medium px-1">
                Mostrando {filteredOptions.length} de {options.length} empresas
                {value.length > 0 && <span className="text-brand-main ml-2">• {value.length} selecionada(s)</span>}
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option) => {
                        const isSelected = value.includes(option.value);
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleToggle(option.value)}
                                className={`
                                    relative flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all group
                                    ${isSelected
                                        ? "border-brand-main bg-brand-main/5 shadow-sm"
                                        : "border-border bg-card hover:border-brand-main/30 hover:shadow-md"
                                    }
                                `}
                            >
                                <div
                                    className={`
                                        w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm
                                        ${isSelected ? "bg-white dark:bg-white/10" : "bg-gray-100 dark:bg-white/5 group-hover:bg-white dark:group-hover:bg-white/10"}
                                    `}
                                    style={option.color ? { color: option.color } : {}}
                                >
                                    <Tv className="w-5 h-5" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className={`font-bold text-sm truncate transition-colors ${isSelected ? "text-brand-main" : "text-text-dark"}`}>
                                        {option.label}
                                    </div>
                                    {isSelected && (
                                        <div className="text-[10px] font-medium text-brand-main flex items-center gap-1 mt-0.5 animate-fadeIn">
                                            <CheckCircle2 className="w-3 h-3" /> Selecionado
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })
                ) : (
                    <div className="col-span-full py-8 text-center text-text-light italic">
                        Nenhuma empresa encontrada para "{searchTerm}"
                    </div>
                )}
            </div>
        </div>
    );
}
