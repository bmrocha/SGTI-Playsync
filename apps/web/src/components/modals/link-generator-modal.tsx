'use client';

import { useState, useEffect } from 'react';
import { X, Link2, Copy, Check, Sun, Moon, Loader2, Save, ShieldAlert, Eye } from 'lucide-react';
import { MediaItem } from '@/lib/store';
import { usePlaylistLinkStore } from '@/lib/playlist-link-store';
import { useThemeStore } from '@/lib/theme-store';
import { cn } from '@/lib/utils';
import { FullscreenPlayer } from '@/components/player/fullscreen-player';

const LINK_COLORS = [
  { hex: '#11876d', label: 'Verde' },
  { hex: '#3b82f6', label: 'Azul' },
  { hex: '#8b5cf6', label: 'Violeta' },
  { hex: '#ec4899', label: 'Rosa' },
  { hex: '#f59e0b', label: 'Âmbar' },
  { hex: '#ef4444', label: 'Vermelho' },
];

interface LinkGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaItem[];
  playlistName: string;
  companyName: string;
  playlistDbId?: string;
  companyId?: string;
}

// Ask the server for its own LAN IP — reliable, no WebRTC needed
async function getServerLanIP(): Promise<{ ip: string | null; port: string }> {
  try {
    const res = await fetch('/api/server-info', { cache: 'no-store' });
    if (!res.ok) return { ip: null, port: '3000' };
    const data = await res.json();
    return { ip: data.localIP, port: data.port };
  } catch {
    return { ip: null, port: '3000' };
  }
}

export function LinkGeneratorModal({
  isOpen,
  onClose,
  items,
  playlistName,
  companyName,
  playlistDbId,
  companyId,
}: LinkGeneratorModalProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [playlistId, setPlaylistId] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [serverHost, setServerHost] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const { generateLink } = usePlaylistLinkStore();
  const { theme: systemTheme, primaryColor: systemColor } = useThemeStore();

  const [savedTheme, setSavedTheme] = useState<'light' | 'dark'>(systemTheme || 'light');
  const [savedColor, setSavedColor] = useState<string>(systemColor || '#11876d');
  const [draftTheme, setDraftTheme] = useState<'light' | 'dark'>(systemTheme || 'light');
  const [draftColor, setDraftColor] = useState<string>(systemColor || '#11876d');

  const hasChanges = draftTheme !== savedTheme || draftColor !== savedColor;

  // Detect server host — use LAN IP when on localhost so the link works on other machines
  useEffect(() => {
    if (typeof window !== 'undefined' && !serverHost) {
      const currentHost = window.location.host;
      if (currentHost.includes('localhost') || currentHost.startsWith('127.0.0.1')) {
        // Ask the server for its actual LAN IP (server-side, always correct)
        getServerLanIP()
          .then(({ ip, port }) => {
            setServerHost(ip ? `${ip}:${port}` : currentHost);
          })
          .catch(() => setServerHost(currentHost));
      } else {
        // Already using a real IP or domain
        setServerHost(currentHost);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update link when host or ID changes
  useEffect(() => {
    if (playlistId && serverHost) {
      setGeneratedLink(`${window.location.protocol}//${serverHost}/player?id=${playlistId}`);
    }
  }, [playlistId, serverHost]);

  // Initialize on open: create/fetch link and load saved settings
  useEffect(() => {
    if (!isOpen || items.length === 0) return;

    const safeItems = items
      .filter((i) => !i.url.startsWith('blob:'))
      .map((i) => ({ ...i, zones: i.zones?.filter((z) => z && !z.url.startsWith('blob:')) }))
      .filter((i) => !i.zones || i.zones.length > 0);

    if (safeItems.length === 0) return;

    setIsInitializing(true);
    setPlaylistId('');

    fetch('/api/playlist-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName,
        playlistName,
        playlistId: playlistDbId,
        companyId,
        items: safeItems,
      }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (!data.id) return;
        setPlaylistId(data.id);
        generateLink(companyName, playlistName, safeItems);

        // Fetch the persisted settings for this link
        const linkRes = await fetch(`/api/playlist-links/${data.id}`);
        const linkData = await linkRes.json();

        const t = (linkData.theme as 'light' | 'dark') || 'light';
        const c = linkData.primaryColor || '#11876d';
        setSavedTheme(t);
        setSavedColor(c);
        setDraftTheme(t);
        setDraftColor(c);
      })
      .catch((e) => console.error('Error initializing link:', e))
      .finally(() => setIsInitializing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const safeCount = items.filter((i) => !i.url.startsWith('blob:')).length;
  const removedCount = items.length - safeCount;
  const selectedColorLabel =
    LINK_COLORS.find((c) => c.hex === draftColor)?.label ?? 'Personalizada';

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for non-secure contexts (HTTP via IP)
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (err) {
      console.error('Failed to copy: ', err);
      return false;
    }
  };

  const copyId = async () => {
    const success = await copyToClipboard(playlistId);
    if (success) {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const copyLink = async () => {
    const success = await copyToClipboard(generatedLink);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSave = async () => {
    if (!hasChanges || !playlistId) return;
    setIsSaving(true);
    try {
      const safeItems = items
        .filter((i) => !i.url.startsWith('blob:'))
        .map((i) => ({ ...i, zones: i.zones?.filter((z) => z && !z.url.startsWith('blob:')) }))
        .filter((i) => !i.zones || i.zones.length > 0);

      await fetch('/api/playlist-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          playlistName,
          playlistId: playlistDbId,
          companyId,
          items: safeItems,
          theme: draftTheme,
          primaryColor: draftColor,
        }),
      });

      setSavedTheme(draftTheme);
      setSavedColor(draftColor);
    } catch {
      // Silently ignore or handle error without notification
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-6000 flex items-center justify-center p-4">
      <div className="bg-panel-bg rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border">
        {/* ── Header ── */}
        <div className="bg-brand-main p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Link da Playlist</h2>
              <p className="text-xs text-white/70 mt-0.5 truncate max-w-70">
                {companyName} • {playlistName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="p-6 space-y-5">
          {/* ID da Playlist */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-light uppercase tracking-wider">
                ID da Playlist
              </label>
              <span className="text-[10px] text-text-light bg-body-bg border border-border px-2 py-0.5 rounded-full">
                🍓 Para Raspberry Pi
              </span>
            </div>
            <div className="flex gap-2">
              <div
                className={cn(
                  'flex-1 px-4 py-3 border-2 border-border rounded-xl bg-body-bg font-mono font-bold text-text-dark text-lg tracking-widest',
                  isInitializing && 'animate-pulse',
                )}
              >
                {isInitializing ? (
                  <span className="text-text-light text-sm font-normal">Carregando...</span>
                ) : (
                  playlistId
                )}
              </div>
              <button
                onClick={copyId}
                disabled={isInitializing || !playlistId}
                title="Copiar ID"
                className="px-4 py-3 bg-brand-accent text-black rounded-xl font-semibold hover:brightness-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {copiedId ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[11px] text-text-light">
              Este ID é permanente e único para esta playlist.
            </p>
          </div>

          <div className="border-t border-border" />

          {/* Aparência do Player */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-light uppercase tracking-wider">
                Aparência do Player Externo
              </label>
              <div className="flex items-center gap-3">
                {hasChanges && (
                  <span className="text-[10px] font-bold text-amber-500 animate-pulse">
                    • Alterações não salvas
                  </span>
                )}
                {/* Preview Button */}
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-4 py-2 bg-brand-main text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:brightness-110 transition-all"
                >
                  <Eye className="w-4 h-4" /> Visualizar
                </button>
              </div>
            </div>

            {/* Row 1 — Tema */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-text-light uppercase tracking-wider">
                Tema
              </span>
              <div className="flex p-1 bg-body-bg rounded-xl border border-border w-fit">
                <button
                  onClick={() => setDraftTheme('light')}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
                    draftTheme === 'light'
                      ? 'bg-white text-brand-main shadow-md'
                      : 'text-text-light hover:text-text-dark',
                  )}
                >
                  <Sun className="w-4 h-4" /> Claro
                </button>
                <button
                  onClick={() => setDraftTheme('dark')}
                  className={cn(
                    'px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
                    draftTheme === 'dark'
                      ? 'bg-zinc-900 text-white shadow-md'
                      : 'text-text-light hover:text-text-dark',
                  )}
                >
                  <Moon className="w-4 h-4" /> Escuro
                </button>
              </div>
            </div>

            {/* Row 2 — Cor Principal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-light uppercase tracking-wider">
                  Cor Principal
                </span>
                <span className="text-xs font-bold" style={{ color: draftColor }}>
                  ● {selectedColorLabel}
                </span>
              </div>
              <div className="flex items-end gap-3">
                {LINK_COLORS.map((c) => (
                  <div key={c.hex} className="flex flex-col items-center gap-1.5">
                    <button
                      onClick={() => setDraftColor(c.hex)}
                      title={c.label}
                      className={cn(
                        'w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center relative',
                        draftColor === c.hex
                          ? 'shadow-lg scale-110'
                          : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105',
                      )}
                      style={{
                        backgroundColor: c.hex,
                        borderColor: draftColor === c.hex ? 'white' : 'transparent',
                        boxShadow: draftColor === c.hex ? `0 0 0 2.5px ${c.hex}` : undefined,
                      }}
                    >
                      {draftColor === c.hex && (
                        <Check className="w-4 h-4 text-white drop-shadow-md" />
                      )}
                      {c.hex === '#11876d' && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#d4ff00] rounded-full border border-black/20" />
                      )}
                    </button>
                    <span
                      className="text-[10px] font-semibold leading-none"
                      style={{ color: draftColor === c.hex ? c.hex : 'var(--text-light)' }}
                    >
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Link Completo */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-text-light uppercase tracking-wider">
              Link Completo
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="flex-1 px-3 py-2.5 border border-border rounded-xl bg-body-bg text-text-dark text-sm font-mono truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={copyLink}
                disabled={!generatedLink || isInitializing}
                className="px-4 py-2.5 bg-brand-main text-white rounded-xl font-semibold hover:brightness-110 transition-all flex items-center gap-2 text-sm disabled:opacity-40 whitespace-nowrap"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            {removedCount > 0 && (
              <p className="text-[10px] text-amber-500">
                ⚠️ {removedCount} arquivo(s) local/locais removido(s) do link (arquivos locais não
                são compartilháveis).
              </p>
            )}
          </div>

          {/* Alerta de Segurança */}
          <div className="flex items-start gap-3 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-text-dark leading-relaxed">
              <strong className="text-red-500">Atenção:</strong> Qualquer pessoa com este link ou ID
              poderá visualizar a playlist.{' '}
              <strong>Não compartilhe com pessoas não autorizadas.</strong>
            </p>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="bg-body-bg/50 px-6 py-4 flex items-center justify-between border-t border-border gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold bg-border/60 text-text-dark hover:bg-border transition-colors"
          >
            Fechar
          </button>

          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || isInitializing}
            className={cn(
              'px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200',
              hasChanges && !isSaving
                ? 'bg-brand-main text-white shadow-lg shadow-brand-main/25 hover:brightness-110 hover:scale-105 active:scale-95'
                : 'bg-border/40 text-text-light cursor-not-allowed',
            )}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {hasChanges ? 'Salvar Aparência' : 'Salvo ✓'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-7000">
          <FullscreenPlayer
            items={items.filter((i) => !i.url.startsWith('blob:'))}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            companyName={companyName}
            playlistName={playlistName}
            playlistId={playlistId || 'preview'}
            forcedTheme={draftTheme}
            forcedPrimaryColor={draftColor}
          />
        </div>
      )}
    </div>
  );
}
