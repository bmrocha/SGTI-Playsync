"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("[ErrorBoundary]", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex items-center justify-center min-h-[200px] p-8">
                    <div className="text-center space-y-4 max-w-md">
                        <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto border border-red-500/20">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Algo deu errado</h3>
                            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                                {this.state.error?.message || "Um erro inesperado ocorreu ao carregar esta seção."}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold transition-colors"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Recarregar
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
