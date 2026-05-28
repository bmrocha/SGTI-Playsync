"use client";

import { X, AlertCircle, CheckCircle, HelpCircle } from "lucide-react";

interface DialogModalProps {
    isOpen: boolean;
    onClose: (result: boolean | string | null) => void;
    title: string;
    message: string;
    type: "alert" | "confirm" | "prompt";
    defaultValue?: string;
}

export function DialogModal({ isOpen, onClose, title, message, type, defaultValue = "" }: DialogModalProps) {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (type === "prompt") {
            const input = (e.target as HTMLFormElement).querySelector("input") as HTMLInputElement;
            onClose(input.value);
        } else {
            onClose(true);
        }
    };

    const getIcon = () => {
        switch (type) {
            case "alert":
                return <AlertCircle className="w-12 h-12 text-blue-500" />;
            case "confirm":
                return <HelpCircle className="w-12 h-12 text-orange-500" />;
            case "prompt":
                return <CheckCircle className="w-12 h-12 text-green-500" />;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9000] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#13978a] to-[#0d7a6f] text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {getIcon()}
                        <h2 className="text-xl font-bold">{title}</h2>
                    </div>
                    {type === "alert" && (
                        <button
                            onClick={() => onClose(false)}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <p className="text-gray-700 text-base leading-relaxed mb-4">{message}</p>

                        {type === "prompt" && (
                            <input
                                type="text"
                                defaultValue={defaultValue}
                                autoFocus
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13978a] focus:border-transparent outline-none transition-all text-gray-900"
                                placeholder="Digite aqui..."
                            />
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                        {type === "confirm" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onClose(false)}
                                    className="px-5 py-2.5 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
                                >
                                    Confirmar
                                </button>
                            </>
                        )}

                        {type === "alert" && (
                            <button
                                type="submit"
                                className="px-6 py-2.5 rounded-lg font-semibold bg-[#13978a] text-white hover:bg-[#0d7a6f] transition-colors"
                            >
                                OK
                            </button>
                        )}

                        {type === "prompt" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => onClose(null)}
                                    className="px-5 py-2.5 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 rounded-lg font-semibold bg-[#13978a] text-white hover:bg-[#0d7a6f] transition-colors"
                                >
                                    OK
                                </button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}

// Hook para usar o dialog
export function useDialog() {
    const [dialogState, setDialogState] = React.useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "alert" | "confirm" | "prompt";
        defaultValue?: string;
        resolver?: (value: any) => void;
    }>({
        isOpen: false,
        title: "",
        message: "",
        type: "alert",
    });

    const alert = (title: string, message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                title,
                message,
                type: "alert",
                resolver: resolve as (value: boolean) => void,
            });
        });
    };

    const confirm = (title: string, message: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                title,
                message,
                type: "confirm",
                resolver: resolve as (value: boolean) => void,
            });
        });
    };

    const prompt = (title: string, message: string, defaultValue = ""): Promise<string | null> => {
        return new Promise((resolve) => {
            setDialogState({
                isOpen: true,
                title,
                message,
                type: "prompt",
                defaultValue,
                resolver: resolve as (value: string | null) => void,
            });
        });
    };

    const handleClose = (result: boolean | string | null) => {
        if (dialogState.resolver) {
            (dialogState.resolver as any)(result);
        }
        setDialogState((prev) => ({ ...prev, isOpen: false }));
    };

    const DialogComponent = () => (
        <DialogModal
            isOpen={dialogState.isOpen}
            onClose={handleClose}
            title={dialogState.title}
            message={dialogState.message}
            type={dialogState.type}
            defaultValue={dialogState.defaultValue}
        />
    );

    return { alert, confirm, prompt, DialogComponent };
}

// Import React for the hook
import React from "react";
