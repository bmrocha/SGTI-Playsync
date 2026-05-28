"use client";

import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { useThemeStore } from "@/lib/theme-store";
import { cn } from "@/lib/utils";

interface CustomTimeInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    label?: string;
    dropUp?: boolean;
}

export function CustomTimeInput({ value, onChange, className = "", label, dropUp = false }: CustomTimeInputProps) {
    const { theme } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Parse value (HH:MM format)
    useEffect(() => {
        if (value) {
            setInputValue(value);
        }
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Auto-focus input when dropdown opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9:]/g, ''); // Only numbers and colon

        // Auto-format as user types
        if (val.length === 2 && !val.includes(':')) {
            val = val + ':';
        }

        // Limit to HH:MM format
        if (val.length > 5) {
            val = val.substring(0, 5);
        }

        setInputValue(val);
    };

    const handleInputBlur = () => {
        // Validate and format on blur
        const parts = inputValue.split(':');
        if (parts.length === 2) {
            let hours = parseInt(parts[0]) || 0;
            let minutes = parseInt(parts[1]) || 0;

            // Clamp values
            hours = Math.min(23, Math.max(0, hours));
            minutes = Math.min(59, Math.max(0, minutes));

            const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            setInputValue(formatted);
            onChange(formatted);
        } else if (inputValue.length > 0) {
            // If incomplete, try to parse as hours only
            const hours = Math.min(23, Math.max(0, parseInt(inputValue) || 0));
            const formatted = `${String(hours).padStart(2, '0')}:00`;
            setInputValue(formatted);
            onChange(formatted);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleInputBlur();
            setIsOpen(false);
        } else if (e.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const setCurrentTime = () => {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const formatted = `${h}:${m}`;
        setInputValue(formatted);
        onChange(formatted);
        setIsOpen(false);
    };

    const formatDisplayTime = (timeStr: string) => {
        if (!timeStr) return "00:00";
        return timeStr;
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {label && (
                <label className="block text-xs font-bold text-text-light mb-1">{label}</label>
            )}

            {/* Input Display */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full h-10 flex items-center justify-between px-3 border rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand-main/20",
                    theme === 'dark'
                        ? "bg-white/5 border-white/10 text-white hover:border-brand-main"
                        : "bg-white border-slate-100 text-slate-700 hover:border-brand-main shadow-sm"
                )}
            >
                <span className={value ? "text-text-dark font-mono" : "text-text-light"}>
                    {formatDisplayTime(value)}
                </span>
                <Clock className="w-4 h-4 text-text-light" />
            </button>

            {/* Time Input Dropdown */}
            {isOpen && (
                <div className={cn(
                    "absolute left-0 z-50 border rounded-xl shadow-2xl p-4 min-w-[280px] animate-scaleIn",
                    dropUp ? 'bottom-full mb-2' : 'top-full mt-2',
                    theme === 'dark' ? "bg-[#0c1412] border-white/10" : "bg-white border-slate-100"
                )}>
                    <div className="text-xs font-bold text-text-light mb-3 text-center">Digite o Horário</div>

                    {/* Direct Input */}
                    <div className="mb-4">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onBlur={handleInputBlur}
                            onKeyDown={handleKeyDown}
                            placeholder="HH:MM"
                            className={cn(
                                "w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 rounded-lg outline-none transition-all",
                                theme === 'dark'
                                    ? "bg-black/40 border-white/5 text-brand-main focus:border-brand-main"
                                    : "bg-white border-slate-100 text-brand-main focus:border-brand-main focus:ring-2 focus:ring-brand-main/20"
                            )}
                            maxLength={5}
                        />
                        <p className="text-xs text-text-light text-center mt-2">
                            Digite no formato HH:MM (ex: 14:30)
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-2 pt-3 border-t border-border">
                        <button
                            type="button"
                            onClick={setCurrentTime}
                            className="flex-1 px-4 py-2 text-sm font-semibold text-brand-main hover:bg-brand-main/10 rounded-lg transition-all hover:scale-105 active:scale-95 border border-brand-main/30 flex items-center justify-center gap-2"
                        >
                            <Clock className="w-4 h-4" />
                            Agora
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                handleInputBlur();
                                setIsOpen(false);
                            }}
                            className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-brand-main hover:bg-brand-main/90 rounded-lg transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                        >
                            ✓ OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
