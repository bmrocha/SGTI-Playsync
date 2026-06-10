'use client';

import { LicenseStatusCard } from '@/components/settings/license-status-card';
import { KeyRound } from 'lucide-react';

export default function SettingsLicenciamentoTab() {
  return (
    <div className="space-y-4 animate-fadeIn pb-40 flex flex-col h-full overflow-y-auto pr-2 scrollbar-hide">
      <LicenseStatusCard />

      {/* Additional Licensing Info */}
      <div className="bg-white/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-dark dark:text-white">
              Sobre o Licenciamento
            </h3>
            <p className="text-[10px] text-text-light uppercase tracking-widest">
              Informações sobre licença e ativação
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-text-light">
          <p>
            O sistema PlaySync utiliza licenciamento via token JWT com assinatura RS256 para
            validação criptográfica. A licença inclui:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Validade e expiração configurável</li>
            <li>Limite de players autorizados</li>
            <li>Verificação de instalação única</li>
            <li>Proteção contra uso não autorizado</li>
          </ul>
          <p className="mt-3">
            Para ativar sua licença, entre em contato com o suporte e aplique o token JWT fornecido
            no campo acima.
          </p>
        </div>
      </div>

      <div className="h-24 sm:h-32 w-full shrink-0" />
    </div>
  );
}
