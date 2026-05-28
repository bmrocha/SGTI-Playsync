"use client";

import { X } from "lucide-react";

interface ColorPickerProps {
    selectedColor: string;
    usedColors: string[];
    colorToCompanyMap: Record<string, string>;
    onColorSelect: (color: string) => void;
}

const COLORS = [
    "#ef4444", "#dc2626", "#b91c1c",
    "#f97316", "#ea580c", "#c2410c",
    "#f59e0b", "#d97706", "#b45309",
    "#84cc16", "#65a30d", "#4d7c0f",
    "#22c55e", "#16a34a", "#15803d",
    "#10b981", "#059669", "#047857",
    "#14b8a6", "#0d9488", "#0f766e",
    "#06b6d4", "#0891b2", "#0e7490",
    "#0ea5e9", "#0284c7", "#0369a1",
    "#3b82f6", "#2563eb", "#1d4ed8",
    "#6366f1", "#4f46e5", "#4338ca",
    "#8b5cf6", "#7c3aed", "#6d28d9",
    "#a855f7", "#9333ea", "#7e22ce",
    "#d946ef", "#c026d3", "#a21caf",
    "#ec4899", "#db2777", "#be185d",
    "#f43f5e", "#e11d48", "#be123c",
];

export default function ColorPicker({ selectedColor, usedColors, colorToCompanyMap, onColorSelect }: ColorPickerProps) {
    return (
        <div>
            <label className="block text-sm font-bold text-text-dark mb-2">Cor da Identidade</label>
            <div className="bg-body-bg border-2 border-border rounded-lg p-4">
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-3">
                    {COLORS.map((color) => {
                        const isUsed = usedColors.includes(color);
                        const isSelected = selectedColor === color;
                        const companyUsingColor = colorToCompanyMap[color];

                        return (
                            <button
                                key={color}
                                type="button"
                                onClick={() => !isUsed && onColorSelect(color)}
                                disabled={isUsed}
                                className={`w-8 h-8 rounded-full shadow-sm transition-all flex items-center justify-center relative group ${isUsed
                                    ? "opacity-30 cursor-not-allowed"
                                    : "hover:scale-110"
                                    } ${isSelected
                                        ? "ring-2 ring-brand-main ring-offset-2 ring-offset-panel-bg scale-110"
                                        : !isUsed ? "hover:ring-2 hover:ring-border hover:ring-offset-1 hover:ring-offset-panel-bg" : ""
                                    }`}
                                style={{ backgroundColor: color }}
                                title={isUsed ? `Em uso por: ${companyUsingColor}` : color}
                            >
                                {isSelected && (
                                    <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />
                                )}
                                {isUsed && !isSelected && (
                                    <>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <X className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
                                        </div>
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                            {companyUsingColor}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                        </div>
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-text-light">
                    <div
                        className="w-4 h-4 rounded-full border border-border"
                        style={{ backgroundColor: selectedColor }}
                    />
                    <span>Cor selecionada</span>
                </div>
            </div>
        </div>
    );
}
