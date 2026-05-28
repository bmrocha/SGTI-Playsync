"use client";

import { X } from "lucide-react";
import { ReactNode } from "react";

interface FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    maxWidth?: string;
}

export function FormModal({ isOpen, onClose, title, children, footer, maxWidth = "max-w-md" }: FormModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9000] flex items-center justify-center p-4 animate-fadeIn">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className={`relative bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-xl overflow-hidden animate-scaleIn w-full ${maxWidth} flex flex-col max-h-[85vh]`}>
                {/* Header - Adaptive Styles */}
                {/* Light Mode: Brand Gradient | Dark Mode: Deep Teal Gradient + Neon */}
                <div className="bg-gradient-to-r from-brand-main to-brand-main/80 text-white dark:bg-gradient-to-r dark:from-[#003641] dark:to-[#020605] dark:border-b dark:border-[#d4ff00]/20 p-5 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold flex items-center gap-2 dark:text-[#d4ff00] dark:drop-shadow-[0_0_2px_rgba(212,255,0,0.5)]">
                        {/* Title adapts color in dark mode */}
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white dark:text-[#d4ff00]/70 dark:hover:text-[#d4ff00] transition-all p-2 rounded-lg hover:bg-white/10 dark:hover:bg-[#d4ff00]/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="bg-muted/30 p-5 flex justify-end gap-3 border-t border-border shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
