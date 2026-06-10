'use client';

import { useSystemStore } from '@/lib/system-store';
import { Monitor } from 'lucide-react';

export default function SettingsSistemaTab() {
  const { showPlayersMenu, setField } = useSystemStore();

  return (
    <div className="space-y-4 animate-fadeIn pb-40 flex flex-col h-full overflow-y-auto pr-2 scrollbar-hide">
      {/* Menu Visibility Settings */}
      <div className="bg-white/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
            <Monitor className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-dark dark:text-white">
              Visibilidade de Menus
            </h3>
            <p className="text-[10px] text-text-light uppercase tracking-widest">
              Controle quais menus aparecem na sidebar
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-emerald-500" />
              <span className="text-xs font-bold text-text-dark dark:text-white">Menu "Telas"</span>
            </div>
            <p className="text-[10px] text-text-light mt-1">
              Mostrar ou ocultar o menu de gerenciamento de telas na sidebar
            </p>
          </div>
          <button
            onClick={() => setField('showPlayersMenu', !showPlayersMenu)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              showPlayersMenu ? 'bg-brand-main' : 'bg-zinc-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                showPlayersMenu ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="h-24 sm:h-32 w-full shrink-0" />
    </div>
  );
}
