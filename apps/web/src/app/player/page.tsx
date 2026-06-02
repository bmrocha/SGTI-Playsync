'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { decodePlaylistData } from '@/lib/playlist-link-store';
import { unlockAutoplay } from '@/lib/autoplay-unlock';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const FullscreenPlayer = dynamic(
  () =>
    import('@/components/player/fullscreen-player').then((m) => ({ default: m.FullscreenPlayer })),
  { ssr: false },
);

export default function PlayerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [playlistData, setPlaylistData] = useState<{
    companyName: string;
    playlistName: string;
    playlistId: string;
    companyId?: string;
    companyColor?: string;
    theme?: string;
    updatedAt?: string | Date;
    items: any[];
  } | null>(null);
  const [forcedTheme, setForcedTheme] = useState<'light' | 'dark'>('light');
  const [forcedPrimaryColor, setForcedPrimaryColor] = useState<string>('#11876d');
  const playlistDataRef = useRef(playlistData);
  playlistDataRef.current = playlistData;

  const id = useMemo(() => searchParams.get('id'), [searchParams]);
  const encodedData = useMemo(() => searchParams.get('data'), [searchParams]);

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

  useEffect(() => {
    if (id) {
      setLoading(true);
      setError('');

      let cancelled = false;
      let intervalId: NodeJS.Timeout | null = null;

      const load = async () => {
        try {
          const res = await fetch(`/api/playlist-links/${id}`, { cache: 'no-store' });
          if (!res.ok) throw new Error('Playlist não encontrada');
          const data = await res.json();
          console.log('PLAYER DATA RECEIVED:', data);
          if (cancelled) return;

          // Prioritize the color chosen in the link modal, fallback to company color
          const effectiveColor =
            data.primaryColor ||
            (data.companyColor && data.companyColor !== '#000000' ? data.companyColor : '#11876d');
          const effectiveTheme = (data.theme as 'light' | 'dark') || 'light';

          setForcedPrimaryColor(effectiveColor);
          setForcedTheme(effectiveTheme);
          setPlaylistData(data);
          setLoading(false);
          setIsPlayerOpen(true);
        } catch (err) {
          if (cancelled) return;
          console.error('Erro ao carregar playlist:', err);
          setError('Não foi possível carregar a playlist. Verifique o ID ou sua conexão.');
          setLoading(false);
        }
      };

      const poll = async () => {
        try {
          const res = await fetch(`/api/playlist-links/${id}`, { cache: 'no-store' });
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
              (data.companyColor && data.companyColor !== '#000000'
                ? data.companyColor
                : '#11876d');
            const effectiveTheme = (data.theme as 'light' | 'dark') || 'light';
            setForcedPrimaryColor(effectiveColor);
            setForcedTheme(effectiveTheme);
            setPlaylistData(data);
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
    }

    if (!encodedData) {
      setError('Dados da playlist não fornecidos. Verifique se o link está correto.');
      setLoading(false);
      return;
    }

    // Decode playlist data from URL
    const decoded = decodePlaylistData(encodedData);

    if (!decoded) {
      setError('Não foi possível decodificar os dados da playlist. O link pode estar corrompido.');
      setLoading(false);
      return;
    }

    // Check if playlist has items
    if (!decoded.items || decoded.items.length === 0) {
      setError(
        'Esta playlist está vazia. Entre em contato com o administrador para adicionar mídias.',
      );
      setLoading(false);
      return;
    }

    setPlaylistData({
      ...decoded,
      playlistId: (decoded as any).playlistId || 'preview',
    });
    setLoading(false);
    setIsPlayerOpen(true);
  }, [encodedData, id]);

  const handleClose = () => {
    setIsPlayerOpen(false);
    router.push('/');
  };

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
}
