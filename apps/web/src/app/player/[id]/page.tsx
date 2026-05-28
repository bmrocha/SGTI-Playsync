"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const FullscreenPlayer = dynamic(() => import("@/components/player/fullscreen-player").then(m => ({ default: m.FullscreenPlayer })), { ssr: false });

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Player Error Boundary caught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-red-900 text-white p-10 flex flex-col items-center justify-center z-10000">
                    <h1 className="text-3xl font-bold mb-4">Erro Fatal no Player</h1>
                    <pre className="bg-black/50 p-4 rounded text-left overflow-auto max-w-full">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-3 bg-white text-red-900 font-bold rounded hover:bg-gray-200"
                    >
                        Recarregar Página
                    </button>
                    <p className="mt-4 text-sm opacity-70">Tente acessar via IP (ex: 192.168.X.X) em vez de localhost</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function PlayerPage() {
    const params = useParams();
    const router = useRouter();
    const playlistId = params.id as string;
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const [playlistData, setPlaylistData] = useState<{
        companyName: string;
        companyId: string;
        companyColor?: string;
        playlistName: string;
        playlistId: string;
        items: any[];
    } | null>(null);
    const [forcedTheme, setForcedTheme] = useState<'light' | 'dark'>('light');
    const [forcedPrimaryColor, setForcedPrimaryColor] = useState<string>('#11876d');

    // ... (useEffect hook stays the same, omitted for brevity in replace tool but kept in file)

    useEffect(() => {
        if (!playlistId) {
            setError("ID da playlist não fornecido");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch(`/api/playlist-links/${playlistId}`, { cache: 'no-store' });
                if (!res.ok) throw new Error('Playlist not found');
                const data = await res.json();
                if (cancelled) return;

                if (!data.items || data.items.length === 0) {
                    setError("Esta playlist está vazia. Entre em contato com o administrador para adicionar mídias.");
                    setLoading(false);
                    return;
                }

                const effectiveColor = data.primaryColor || (data.companyColor && data.companyColor !== '#000000' ? data.companyColor : '#11876d');
                const effectiveTheme = (data.theme as 'light' | 'dark') || 'light';
                setForcedPrimaryColor(effectiveColor);
                setForcedTheme(effectiveTheme);

                setPlaylistData({
                    companyName: data.companyName,
                    companyId: data.companyId,
                    companyColor: data.companyColor,
                    playlistName: data.playlistName,
                    playlistId: data.playlistId,
                    items: data.items,
                });
                setLoading(false);
                setIsPlayerOpen(true);
            } catch (error) {
                if (cancelled) return;
                console.error("❌ Erro ao carregar playlist:", error);
                setError(`Playlist não encontrada. O ID "${playlistId}" pode estar inválido ou expirado.`);
                setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [playlistId]);

    const handleClose = () => {
        setIsPlayerOpen(false);
        router.push("/");
    };

    // Render logic safely inside ErrorBoundary
    const renderContent = () => {
        if (loading) {
            return (
                <div className="fixed inset-0 bg-black flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-16 h-16 text-brand-main animate-spin mx-auto mb-4" />
                        <p className="text-white text-xl">Carregando playlist...</p>
                    </div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="fixed inset-0 bg-black flex items-center justify-center">
                    <div className="text-center max-w-md px-6">
                        <div className="text-6xl mb-4">❌</div>
                        <h1 className="text-white text-2xl font-bold mb-2">Erro ao Carregar</h1>
                        <p className="text-white/70 mb-6">{error}</p>
                        <button
                            onClick={() => router.push("/")}
                            className="px-6 py-3 bg-brand-main text-white rounded-lg font-semibold hover:bg-brand-accent hover:text-black dark:hover:text-black transition-colors"
                        >
                            Voltar ao Início
                        </button>
                    </div>
                </div>
            );
        }

        if (!playlistData) return null;

        return (
            <FullscreenPlayer
                items={playlistData.items}
                isOpen={isPlayerOpen}
                onClose={handleClose}
                companyName={playlistData.companyName}
                companyId={playlistData.companyId}
                playlistName={playlistData.playlistName}
                playlistId={playlistData.playlistId}
                forcedTheme={forcedTheme}
                forcedPrimaryColor={forcedPrimaryColor}
            />
        );
    };

    return (
        <ErrorBoundary>
            {renderContent()}
        </ErrorBoundary>
    );
}
