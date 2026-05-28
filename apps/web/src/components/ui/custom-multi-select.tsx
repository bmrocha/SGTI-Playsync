"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";

interface Option {
    value: string;
    label: string;
    color?: string;
}

interface CustomMultiSelectProps {
    value: string[];
    onChange: (value: string[]) => void;
    options: Option[];
    placeholder?: string;
    className?: string;
}

export function CustomMultiSelect({ value, onChange, options, placeholder = "Selecione...", className = "" }: CustomMultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOptions = options.filter(opt => value.includes(opt.value));

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const removeOption = (e: React.MouseEvent, optionValue: string) => {
        e.stopPropagation();
        onChange(value.filter(v => v !== optionValue));
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Select Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-3 border border-border rounded-lg bg-body-bg text-text-dark focus:border-brand-main focus:ring-2 focus:ring-brand-main/20 flex items-center justify-between transition-all min-h-[50px]"
            >
                <div className="flex flex-wrap gap-2">
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map(opt => (
                            <span
                                key={opt.value}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm bg-panel-bg border border-border"
                                style={opt.color ? { borderColor: opt.color, backgroundColor: `${opt.color}10` } : {}}
                            >
                                <span style={opt.color ? { color: opt.color } : {}}>{opt.label}</span>
                                <X
                                    className="w-3 h-3 cursor-pointer hover:text-red-500"
                                    onClick={(e) => removeOption(e, opt.value)}
                                />
                            </span>
                        ))
                    ) : (
                        <span className="text-text-light">{placeholder}</span>
                    )}
                </div>
                <ChevronDown className={`w-5 h-5 text-brand-main transition-transform ${isOpen ? "rotate-180" : ""} ml-2 flex-shrink-0`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-scaleIn">
                    {/* Header with Confirm Button */}
                    <div className="flex items-center justify-between p-2 border-b border-border bg-gray-50 dark:bg-white/5">
                        <span className="text-xs font-bold text-text-light px-2 uppercase tracking-wide">Opções</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="px-3 py-1 text-xs font-bold text-text-dark hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors border border-transparent hover:border-border"
                        >
                            Confirmar
                        </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto">
                        {options.map((option) => {
                            const isSelected = value.includes(option.value);
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleToggle(option.value)}
                                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all ${isSelected
                                        ? "bg-brand-main/10 text-brand-main font-semibold"
                                        : "text-text-dark hover:bg-brand-main/5 hover:text-brand-main"
                                        }`}
                                >
                                    <span className="flex items-center gap-2">
                                        {option.color && (
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: option.color }}
                                            />
                                        )}
                                        {option.label}
                                    </span>
                                    {isSelected && <Check className="w-5 h-5" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
