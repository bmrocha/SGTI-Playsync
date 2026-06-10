'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, Copy, Phone, Mail, Globe, User } from 'lucide-react';
import { useLicenseStatus } from '@/hooks/use-license-status';
import { formatLicenseDuration, formatDate } from '@/lib/license-utils';
import { notifySuccess, notifyError } from '@/lib/notification-store';
import { TokenActivationModal } from '@/components/settings/token-activation-modal';

export function LicenseStatusCard() {
  const { status, loading, refresh } = useLicenseStatus();
  const [publicKeyPem, setPublicKeyPem] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSupport, setCopiedSupport] = useState(false);
  const [tokenModalOpen, setTokenModalOpen] = useState(false);

  useEffect(() => {
    if (status?.keyConfigured) {
      fetch('/api/license/public-key')
        .then((r) => r.json())
        .then((data) => setPublicKeyPem(data.publicKeyPem || null))
        .catch(() => {});
    }
  }, [status?.keyConfigured]);

  const ls = useMemo(() => {
    if (!status)
      return { active: false, remainingDays: 0, mode: 'off' as const, required: false, reason: '' };
    const now = Date.now();
    const exp = status.expiresAt ? new Date(status.expiresAt).getTime() : NaN;
    const active = Boolean(status.expiresAt && !Number.isNaN(exp) && now <= exp && status.licensed);
    const remainingDays = active ? Math.max(0, Math.floor((exp - now) / (1000 * 60 * 60 * 24))) : 0;
    return {
      mode: status.mode,
      required: status.enforced,
      active,
      remainingDays,
      reason: status.reason || '',
    };
  }, [status]);

  const copyToClipboard = useCallback(
    async (text: string, setter: (v: boolean) => void, msg?: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setter(true);
        notifySuccess(msg || 'Copiado!', 'Chave copiada para \u00e1rea de transfer\u00eancia');
        setTimeout(() => setter(false), 2000);
      } catch {
        notifyError(
          'Falha ao copiar',
          'N\u00e3o foi poss\u00edvel copiar para \u00e1rea de transfer\u00eancia',
        );
      }
    },
    [],
  );

  if (loading) {
    return (
      <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-4xl p-8">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-zinc-400/10 rounded-2xl flex items-center justify-center text-zinc-400 group">
            <KeyRound className="w-7 h-7 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-text-dark dark:text-white tracking-tight">
                Licenciamento
              </h2>
              <span className="bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-[1px] px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                {ls.mode === 'jwt'
                  ? 'JWT RS256'
                  : ls.mode === 'off'
                    ? 'DESATIVADO'
                    : 'DESCONHECIDO'}
              </span>
            </div>
            <p className="text-text-light dark:text-white/40 font-bold uppercase tracking-widest text-[9px] mt-1 pl-0.5">
              {ls.mode === 'jwt'
                ? 'Licenciamento via token JWT com assinatura RS256'
                : 'Licenciamento n\u00e3o configurado'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Installation ID
          </p>
          <p className="text-sm font-bold mt-2 text-text-dark dark:text-white break-all">
            {status?.installationId || '\u2014'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(status?.installationId || '', setCopiedId)}
              disabled={!status?.installationId}
              className="py-2 px-3 bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedId ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</p>
          <div className="mt-3 flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border border-zinc-200 dark:border-zinc-700 flex items-center justify-center ${
                ls.active ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {ls.active ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-text-dark dark:text-white">
                {ls.active
                  ? 'Ativo'
                  : ls.reason === 'NOT_ACTIVATED'
                    ? 'N\u00e3o ativado'
                    : 'Inativo'}
              </p>
              <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                Modo: {ls.mode.toUpperCase()}{' '}
                {ls.active ? `\u2022 Restante: ${ls.remainingDays} dias` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Janela de Licen\u00e7a
          </p>
          <p className="text-[11px] text-zinc-400 mt-2">
            Ativada em:{' '}
            <span className="font-bold text-text-dark dark:text-white">
              {status?.appliedAt ? formatDate(status.appliedAt) : '\u2014'}
            </span>
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Expira em:{' '}
            <span className="font-bold text-text-dark dark:text-white">
              {status?.expiresAt ? formatDate(status.expiresAt) : '\u2014'}
            </span>
          </p>
          {status?.expiresAt && ls.active && (
            <p className="text-[10px] font-bold text-emerald-500 mt-1">
              {formatLicenseDuration(status.expiresAt)} restantes
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-4xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {ls.mode === 'jwt' ? 'Chave Pública Configurada' : 'Modo de Licença'}
            </p>
            {publicKeyPem && (
              <button
                onClick={() => copyToClipboard(publicKeyPem, setCopiedKey)}
                className="py-1.5 px-3 bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5"
              >
                <Copy className="w-3 h-3" />
                {copiedKey ? 'Copiado' : 'Copiar'}
              </button>
            )}
          </div>
          <div className="space-y-3">
            <textarea
              value={ls.mode === 'jwt' ? publicKeyPem || 'Carregando...' : ls.mode.toUpperCase()}
              readOnly
              className="w-full min-h-28 p-4 bg-black/20 dark:bg-black/30 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 font-mono text-[10px] resize-none outline-none"
            />
            <p className="text-[10px] text-zinc-400">
              {ls.mode === 'jwt'
                ? 'Essa chave est\u00e1 configurada no backend (.env) e \u00e9 usada para validar a assinatura RS256 dos tokens.'
                : 'Nenhuma chave p\u00fablica configurada.'}
            </p>
          </div>
          <div className="pt-4 mt-2 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <p className="text-[10px] text-zinc-400 leading-relaxed max-w-[60%]">
              A valida\u00e7\u00e3o RS256 e o bloqueio s\u00e3o aplicados via backend.
            </p>
            <button
              onClick={() => setTokenModalOpen(true)}
              disabled={ls.mode === 'off'}
              className="py-2.5 px-5 bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Aplicar Token
            </button>
          </div>
        </div>

        <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-4xl p-6 space-y-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Suporte e Renova\u00e7\u00e3o
          </p>
          <div className="p-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-bold text-text-dark dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-zinc-400" /> Bruno Martins Rocha
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                <span>31-98439-0045</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>www.sgti.tec.br</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 md:col-span-2">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>suporte@sgti.tec.br</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-text-dark dark:text-white">
              Para gerar/renovar sua licen\u00e7a
            </p>
            <p className="text-[10px] text-zinc-400 leading-relaxed">
              Clique em &quot;Copiar&quot; e envie um e-mail para o suporte com o conte\u00fado
              colado no corpo da mensagem.
            </p>
            <div className="p-4 rounded-2xl bg-black/10 dark:bg-white/5 border border-zinc-200 dark:border-zinc-700 space-y-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                Obrigat\u00f3rio
              </p>
              <button
                onClick={async () => {
                  if (!status?.installationId) return;
                  if (!publicKeyPem) {
                    notifyError(
                      'Chave p\u00fablica indispon\u00edvel',
                      'A chave p\u00fablica solicitada n\u00e3o foi encontrada',
                    );
                    return;
                  }
                  const msg =
                    `Installation ID: ${status.installationId}\n\n` +
                    `Chave p\u00fablica (PUBLIC KEY PEM ou base64):\n${publicKeyPem}\n`;
                  copyToClipboard(msg, setCopiedSupport, 'Dados copiados para suporte');
                }}
                disabled={!status?.installationId || !publicKeyPem}
                className="py-2 px-4 bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedSupport ? 'Copiado' : 'Copiar Dados para Suporte'}
              </button>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Assunto sugerido:{' '}
                <span className="font-bold text-text-dark dark:text-white">
                  Renova\u00e7\u00e3o/Ativa\u00e7\u00e3o
                </span>
                . Destinat\u00e1rio:{' '}
                <span className="font-bold text-text-dark dark:text-white">
                  suporte@sgti.tec.br
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      <TokenActivationModal
        open={tokenModalOpen}
        onOpenChange={setTokenModalOpen}
        installationId={status?.installationId || ''}
        onActivated={() => refresh()}
      />
    </div>
  );
}
