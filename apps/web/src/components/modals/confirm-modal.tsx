"use client";

import { useState } from "react";
import { AlertTriangle, Info, CheckCircle, X } from "lucide-react";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: "danger" | "warning" | "info";
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = "warning",
    confirmText = "Confirmar",
    cancelText = "Cancelar"
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const typeConfig = {
        danger: {
            icon: AlertTriangle,
            iconColor: "text-red-500",
            iconBg: "bg-red-500/20",
            buttonColor: "bg-red-600 hover:bg-red-700"
        },
        warning: {
            icon: AlertTriangle,
            iconColor: "text-yellow-500",
            iconBg: "bg-yellow-500/20",
            buttonColor: "bg-yellow-600 hover:bg-yellow-700"
        },
        info: {
            icon: Info,
            iconColor: "text-blue-500",
            iconBg: "bg-blue-500/20",
            buttonColor: "bg-blue-600 hover:bg-blue-700"
        }
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
            {/* Premium Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Premium Modal with Glassmorphism */}
            <div className="relative bg-gradient-to-br from-card/95 to-card/90 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl max-w-md w-full animate-scaleIn overflow-hidden">
                {/* Decorative Gradient Top Bar */}
                <div className={`h-1.5 w-full ${type === 'danger' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`} />

                {/* Header with Icon */}
                <div className="flex items-start gap-5 p-7 pb-5">
                    {/* Premium Icon Container */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${config.iconBg} ring-2 ring-offset-2 ${type === 'danger' ? 'ring-red-500/30 ring-offset-card' :
                            type === 'warning' ? 'ring-yellow-500/30 ring-offset-card' :
                                'ring-blue-500/30 ring-offset-card'
                        }`}>
                        <Icon className={`w-7 h-7 ${config.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-xl font-bold text-text-dark m-0 mb-3 leading-tight">{title}</h3>
                        <p className="text-sm text-text-light m-0 leading-relaxed">{message}</p>
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="text-text-light hover:text-text-dark transition-all p-2 rounded-xl hover:bg-border/30 active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Premium Action Buttons */}
                <div className="flex gap-3 p-7 pt-5 bg-gradient-to-b from-transparent to-border/10">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 bg-border/40 hover:bg-border/60 text-text-dark font-semibold rounded-xl transition-all hover:shadow-md active:scale-98 border border-border/50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 px-6 py-3 text-white font-semibold rounded-xl transition-all hover:shadow-xl hover:scale-105 active:scale-100 ${config.buttonColor} ${type === 'danger' ? 'shadow-red-500/25' :
                                type === 'warning' ? 'shadow-yellow-500/25' :
                                    'shadow-blue-500/25'
                            }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook for easy usage
export function useConfirm() {
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "danger" | "warning" | "info";
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "danger",
        onConfirm: () => { }
    });

    const confirm = (options: {
        title: string;
        message: string;
        type?: "danger" | "warning" | "info";
        onConfirm: () => void;
    }) => {
        setConfirmState({
            isOpen: true,
            title: options.title,
            message: options.message,
            type: options.type || "warning",
            // Wrap the user's onConfirm to auto-close after execution
            onConfirm: () => {
                options.onConfirm();
                // Delay closing to ensure the action completes in the store
                setTimeout(() => {
                    setConfirmState(prev => ({ ...prev, isOpen: false }));
                }, 100);
            },
        });
    };

    const close = () => setConfirmState(prev => ({ ...prev, isOpen: false }));

    return {
        confirm,
        confirmProps: {
            isOpen: confirmState.isOpen,
            onClose: close,
            onConfirm: confirmState.onConfirm,
            title: confirmState.title,
            message: confirmState.message,
            type: confirmState.type,
        }
    };
}
