'use client';

import { useState, useEffect, useCallback } from 'react';
import { KeyRound, X, Loader2, Copy, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { notifySuccess, notifyError } from '@/lib/notification-store';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installationId: string;
  onActivated: () => void;
  onRefreshStatus?: () => void; // Callback to refresh license status
};

export function TokenActivationModal({
  open,
  onOpenChange,
  installationId,
  onActivated,
  onRefreshStatus,
}: Props) {
  const [token, setToken] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentInstallationId, setCurrentInstallationId] = useState(installationId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Only set the installation ID once when component mounts, NOT every time modal opens
  // This ensures the ID stays consistent while the user is preparing to activate
  useEffect(() => {
    if (open && !currentInstallationId) {
      setCurrentInstallationId(installationId);
    }
  }, [open]);

  // Update from parent only if we don't have one yet (first time)
  useEffect(() => {
    if (installationId && !currentInstallationId) {
      setCurrentInstallationId(installationId);
    }
  }, [installationId, currentInstallationId]);

  // Reset form state when modal closes
  useEffect(() => {
    if (!open) {
      setToken('');
      setError('');
      setCopied(false);
    }
  }, [open]);

  const handleRefreshId = useCallback(() => {
    if (onRefreshStatus) {
      setIsRefreshing(true);
      onRefreshStatus();
      setTimeout(() => {
        setIsRefreshing(false);
      }, 300);
    }
  }, [onRefreshStatus]);

  if (!open) return null;

  const handleApply = async () => {
    if (!token.trim()) {
      setError('Cole o token JWT antes de ativar.');
      return;
    }
    setIsApplying(true);
    setError('');
    try {
      const res = await fetch('/api/license/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          installationId: currentInstallationId, // Send the ID that was displayed
        }),
      });
      if (res.ok) {
        notifySuccess('Sistema ativado com sucesso!', 'A licen\u00e7a foi aplicada ao sistema');
        onOpenChange(false);
        onActivated();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.reason || data?.error || 'Falha ao ativar licen\u00e7a');
      }
    } catch {
      setError('Erro de conex\u00e3o com o servidor.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
            <KeyRound className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">
              Aplicar Token de Licença
            </h2>
            <p className="text-zinc-500 text-xs">Cole o token JWT (RS256) enviado pelo suporte.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Installation ID
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 block p-3 bg-black/50 border border-zinc-800 rounded-xl text-emerald-400 font-mono text-xs break-all">
                {isRefreshing ? 'Gerando novo ID...' : currentInstallationId}
              </code>
              <button
                onClick={handleRefreshId}
                className="p-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 disabled:opacity-50"
                disabled={isRefreshing || !currentInstallationId}
                title="Gerar novo ID"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={async () => {
                  if (isRefreshing || !currentInstallationId) return;
                  try {
                    await navigator.clipboard.writeText(currentInstallationId);
                    setCopied(true);
                    notifySuccess('Copiado!', 'ID copiado para área de transferência');
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    notifyError(
                      'Falha ao copiar',
                      'Não foi possível copiar o ID para área de transferência',
                    );
                  }
                }}
                className="p-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-400 disabled:opacity-50"
                disabled={isRefreshing || !currentInstallationId}
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-[9px] text-zinc-500">
              Copie este ID e envie para o suporte gerar seu token. O ID não muda ao reabrir o
              modal.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80 flex items-center gap-2">
              <KeyRound className="w-3.5 h-3.5" />
              Token de Licença (JWT)
            </label>
            <textarea
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError('');
              }}
              placeholder="Cole o token JWT completo (3 partes separadas por ponto)..."
              className="w-full h-32 p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl text-emerald-100 font-mono text-xs resize-none outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-red-400 text-xs font-bold">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              disabled={!token.trim() || isApplying}
              className="flex-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
            >
              {isApplying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Ativar Sistema
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
