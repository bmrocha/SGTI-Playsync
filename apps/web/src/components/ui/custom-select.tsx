"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface Option {
    value: string;
    label: React.ReactNode; // Changed from string to ReactNode
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    className?: string; // Container className
    iconClassName?: string;
    // Style Overrides
    focusClassName?: string;
    selectedItemClassName?: string;
    itemHoverClassName?: string;
    direction?: "up" | "down";
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Selecione...",
    className = "",
    iconClassName = "text-brand-main",
    focusClassName = "focus:border-brand-main focus:ring-2 focus:ring-brand-main/20",
    selectedItemClassName = "bg-brand-main text-white font-semibold",
    itemHoverClassName = "text-text-dark hover:bg-brand-main/10 hover:text-brand-main",
    direction = "down"
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

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

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Select Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full py-2.5 px-3 border border-border rounded-lg bg-body-bg text-text-dark flex items-center justify-between transition-all text-sm ${focusClassName}`}
            >
                <span className={selectedOption ? "text-text-dark flex items-center gap-2" : "text-text-light"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""} ${iconClassName}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className={`absolute z-50 w-full bg-card border border-border rounded-lg shadow-2xl overflow-hidden animate-scaleIn ${direction === "up" ? "bottom-full mb-2" : "mt-2"
                    }`}>
                    <div className="max-h-60 overflow-y-auto scrollbar-hide">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition-all ${isSelected
                                        ? selectedItemClassName
                                        : itemHoverClassName
                                        }`}
                                >
                                    <span className="flex items-center gap-2">{option.label}</span>
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
