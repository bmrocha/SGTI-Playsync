"use client";

import { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

type AlertType = "success" | "error" | "info";

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type: AlertType;
}

const typeConfig = {
    success: {
        icon: CheckCircle,
        iconBg: "bg-green-500/20",
        iconColor: "text-green-500",
        barColor: "bg-gradient-to-r from-green-500 to-green-600",
        buttonColor: "bg-green-600 hover:bg-green-700",
        ringColor: "ring-green-500/30 ring-offset-card"
    },
    error: {
        icon: AlertCircle,
        iconBg: "bg-red-500/20",
        iconColor: "text-red-500",
        barColor: "bg-gradient-to-r from-red-500 to-red-600",
        buttonColor: "bg-red-600 hover:bg-red-700",
        ringColor: "ring-red-500/30 ring-offset-card"
    },
    info: {
        icon: AlertCircle,
        iconBg: "bg-blue-500/20",
        iconColor: "text-blue-500",
        barColor: "bg-gradient-to-r from-blue-500 to-blue-600",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
        ringColor: "ring-blue-500/30 ring-offset-card"
    }
};

export function AlertModal({ isOpen, onClose, title, message, type }: AlertModalProps) {
    if (!isOpen) return null;

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
                <div className={`h-1.5 w-full ${config.barColor}`} />

                {/* Header with Icon */}
                <div className="flex items-start gap-5 p-7 pb-5">
                    {/* Premium Icon Container */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${config.iconBg} ring-2 ring-offset-2 ${config.ringColor}`}>
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

                {/* Premium Action Button */}
                <div className="flex justify-end gap-3 p-7 pt-5 bg-gradient-to-b from-transparent to-border/10">
                    <button
                        onClick={onClose}
                        className={`px-6 py-3 text-white font-semibold rounded-xl transition-all hover:shadow-xl hover:scale-105 active:scale-100 ${config.buttonColor}`}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook para usar o alert modal
export function useAlert() {
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: AlertType;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "info"
    });

    const showAlert = (title: string, message: string, type: AlertType = "info") => {
        setAlertState({
            isOpen: true,
            title,
            message,
            type
        });
    };

    const success = (title: string, message: string) => {
        showAlert(title, message, "success");
    };

    const error = (title: string, message: string) => {
        showAlert(title, message, "error");
    };

    const info = (title: string, message: string) => {
        showAlert(title, message, "info");
    };

    const closeAlert = () => {
        setAlertState(prev => ({ ...prev, isOpen: false }));
    };

    const alertElement = (
        <AlertModal
            isOpen={alertState.isOpen}
            onClose={closeAlert}
            title={alertState.title}
            message={alertState.message}
            type={alertState.type}
        />
    );

    return { success, error, info, alertElement };
}
