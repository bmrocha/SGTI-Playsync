'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { unlockAutoplay } from '@/lib/autoplay-unlock';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const FullscreenPlayer = dynamic(
  () =>
    import('@/components/player/fullscreen-player').then((m) => ({ default: m.FullscreenPlayer })),
  { ssr: false },
);

// Simple Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Player Error Boundary caught error:', error, errorInfo);
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
          <p className="mt-4 text-sm opacity-70">
            Tente acessar via IP (ex: 192.168.X.X) em vez de localhost
          </p>
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
  const [error, setError] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playlistData, setPlaylistData] = useState<{
    companyName: string;
    companyId: string;
    companyColor?: string;
    playlistName: string;
    playlistId: string;
    updatedAt?: string | Date;
    items: any[];
  } | null>(null);
  const [forcedTheme, setForcedTheme] = useState<'light' | 'dark'>('light');
  const [forcedPrimaryColor, setForcedPrimaryColor] = useState<string>('#11876d');
  const playlistDataRef = useRef(playlistData);
  playlistDataRef.current = playlistData;

  // Generate a unique viewer ID for this session
  const viewerIdRef = useRef<string>('');
  if (!viewerIdRef.current) {
    viewerIdRef.current = `viewer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  // Unlock autoplay as early as possible (for TVs without human interaction)
  useEffect(() => {
    unlockAutoplay();
    const t1 = setTimeout(unlockAutoplay, 100);
    const t2 = setTimeout(unlockAutoplay, 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Send heartbeat to track active viewers
  useEffect(() => {
    if (!playlistId) return;

    const viewerId = viewerIdRef.current;
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const sendHeartbeat = async () => {
      try {
        console.log(
          '[Viewer Tracking] Sending heartbeat for playlist:',
          playlistId,
          'viewer:',
          viewerId,
        );
        const response = await fetch(`/api/playlist-links/${playlistId}/viewers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ viewerId }),
        });
        const data = await response.json();
        console.log('[Viewer Tracking] Heartbeat response:', data);
      } catch (error) {
        console.error('[Viewer Tracking] Failed to send heartbeat:', error);
      }
    };

    // Send initial heartbeat immediately when playlist loads
    if (isPlayerOpen) {
      sendHeartbeat();
      // Send heartbeat every 30 seconds
      heartbeatInterval = setInterval(sendHeartbeat, 30000);
    }

    // Cleanup: send final heartbeat before unmount
    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      // Notify server that this viewer is leaving
      if (viewerId) {
        fetch(`/api/playlist-links/${playlistId}/viewers?viewerId=${viewerId}`, {
          method: 'DELETE',
        }).catch(() => {});
      }
    };
  }, [playlistId, isPlayerOpen]);

  useEffect(() => {
    if (!playlistId) {
      setError('ID da playlist não fornecido');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    let cancelled = false;
    let intervalId: NodeJS.Timeout | null = null;

    const load = async () => {
      try {
        const res = await fetch(`/api/playlist-links/${playlistId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Playlist not found');
        const data = await res.json();
        if (cancelled) return;

        if (!data.items || data.items.length === 0) {
          setError(
            'Esta playlist está vazia. Entre em contato com o administrador para adicionar mídias.',
          );
          setLoading(false);
          return;
        }

        const effectiveColor =
          data.primaryColor ||
          (data.companyColor && data.companyColor !== '#000000' ? data.companyColor : '#11876d');
        const effectiveTheme = (data.theme as 'light' | 'dark') || 'light';
        setForcedPrimaryColor(effectiveColor);
        setForcedTheme(effectiveTheme);

        setPlaylistData({
          companyName: data.companyName,
          companyId: data.companyId,
          companyColor: data.companyColor,
          playlistName: data.playlistName,
          playlistId: data.playlistId,
          updatedAt: data.updatedAt,
          items: data.items,
        });
        setLoading(false);
        setIsPlayerOpen(true);
      } catch (error) {
        if (cancelled) return;
        console.error('❌ Erro ao carregar playlist:', error);
        setError(`Playlist não encontrada. O ID "${playlistId}" pode estar inválido ou expirado.`);
        setLoading(false);
      }
    };

    const poll = async () => {
      try {
        const res = await fetch(`/api/playlist-links/${playlistId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const current = playlistDataRef.current;
        if (
          current &&
          data.updatedAt &&
          new Date(data.updatedAt).getTime() !== new Date(current.updatedAt || 0).getTime()
        ) {
          const effectiveColor =
            data.primaryColor ||
            (data.companyColor && data.companyColor !== '#000000' ? data.companyColor : '#11876d');
          const effectiveTheme = (data.theme as 'light' | 'dark') || 'light';
          setForcedPrimaryColor(effectiveColor);
          setForcedTheme(effectiveTheme);
          setPlaylistData({
            companyName: data.companyName,
            companyId: data.companyId,
            companyColor: data.companyColor,
            playlistName: data.playlistName,
            playlistId: data.playlistId,
            updatedAt: data.updatedAt,
            items: data.items,
          });
        }
      } catch {
        // Silently ignore poll errors to avoid disrupting playback
      }
    };

    load();
    intervalId = setInterval(poll, 30000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [playlistId]);

  const handleClose = () => {
    setIsPlayerOpen(false);
    router.push('/');
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
              onClick={() => router.push('/')}
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
        key={`${playlistData.playlistId}-${playlistData.updatedAt || 'static'}`}
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

  return <ErrorBoundary>{renderContent()}</ErrorBoundary>;
}
