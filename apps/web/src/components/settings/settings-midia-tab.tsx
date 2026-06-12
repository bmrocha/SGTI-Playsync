'use client';

import { useSystemStore } from '@/lib/system-store';
import { HardDrive, Trash2, Loader2, ShieldCheck, Zap, Cpu, Database, Tv } from 'lucide-react';

interface Props {
  isOptimizing: boolean;
  integrity: number;
  onClearCache: () => void;
  onCheckIntegrity: () => void;
}

export default function SettingsMidiaTab({
  isOptimizing,
  integrity: _integrity,
  onClearCache,
  onCheckIntegrity,
}: Props) {
  const {
    storageLimit,
    mediaCacheSize,
    uploadLimit,
    uploadLimitVideo,
    mediaQuality,
    autoPlayVideos,
    hardwareAccel,
    isOfflineSyncEnabled,
    setField,
  } = useSystemStore();

  return (
    <div className="space-y-8 animate-fadeIn pb-40 flex flex-col h-full overflow-y-auto pr-2 scrollbar-hide">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left Col: Storage & Cache */}
        <div className="space-y-4 flex flex-col h-full">
          <h3 className="flex items-center gap-2 text-[10px] font-black text-text-dark uppercase tracking-widest pl-4">
            <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
            Recursos & Storage
          </h3>

          <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-6 space-y-6 relative overflow-hidden group flex-1 flex flex-col">
            {/* Global Limit Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-bold text-text-light uppercase tracking-widest">
                  Limite Global
                </span>
                <span className="text-2xl font-black text-emerald-500 tracking-tighter">
                  {storageLimit} <span className="text-[10px] text-emerald-500 font-bold">GB</span>
                </span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={storageLimit}
                onChange={(e) => setField('storageLimit', parseInt(e.target.value))}
                className="w-full h-1.5 bg-emerald-500/20 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all"
              />
            </div>

            {/* Cache Size Slider */}
            <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="flex justify-between items-end">
                <label className="text-[9px] font-black text-text-light uppercase tracking-widest pl-1">
                  Buffer de Cache
                </label>
                <span className="text-xl font-black text-emerald-500 tracking-tighter">
                  {mediaCacheSize}{' '}
                  <span className="text-[10px] text-emerald-500 font-bold">MB</span>
                </span>
              </div>
              <input
                type="range"
                min="128"
                max="4096"
                step="128"
                value={mediaCacheSize}
                onChange={(e) => setField('mediaCacheSize', parseInt(e.target.value))}
                className="w-full h-1.5 bg-emerald-500/20 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600 transition-all"
              />
            </div>

            <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-500/20">
                  <div>
                    <div className="text-[10px] font-bold text-text-dark dark:text-white">
                      Upload (Imagens)
                    </div>
                    <div className="text-[8px] font-medium text-text-light">
                      Limite por arquivo em MB
                    </div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={uploadLimit}
                    onChange={(e) => setField('uploadLimit', e.target.value)}
                    className="w-28 h-9 px-3 rounded-xl border border-emerald-500/20 bg-zinc-50 dark:bg-black/20 text-text-dark dark:text-white text-sm font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-500/20">
                  <div>
                    <div className="text-[10px] font-bold text-text-dark dark:text-white">
                      Upload (Vídeos)
                    </div>
                    <div className="text-[8px] font-medium text-text-light">
                      Limite por arquivo em MB
                    </div>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={uploadLimitVideo}
                    onChange={(e) => setField('uploadLimitVideo', e.target.value)}
                    className="w-28 h-9 px-3 rounded-xl border border-emerald-500/20 bg-zinc-50 dark:bg-black/20 text-text-dark dark:text-white text-sm font-bold outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Maintenance Actions */}
            <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3">
              <button
                onClick={onClearCache}
                disabled={isOptimizing}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group/btn disabled:opacity-50"
              >
                {isOptimizing ? (
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 text-emerald-500 group-hover/btn:text-emerald-600 transition-colors" />
                )}
                <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-500">
                  Limpar Cache
                </span>
              </button>
              <button
                onClick={onCheckIntegrity}
                disabled={isOptimizing}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all group/btn disabled:opacity-50"
              >
                {isOptimizing ? (
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover/btn:text-emerald-600 transition-colors" />
                )}
                <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-500">
                  Checar Integridade
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mid Col: Performance & Logic */}
        <div className="space-y-4 flex flex-col h-full">
          <h3 className="flex items-center gap-2 text-[10px] font-black text-text-dark uppercase tracking-widest pl-4">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            Performance & Lógica
          </h3>

          <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] p-6 space-y-4 relative overflow-hidden flex-1 flex flex-col">
            {/* Preload Toggle */}
            <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 text-text-dark dark:text-white rounded-2xl border border-emerald-500/20 transition-all hover:border-emerald-500/40 group/item">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${autoPlayVideos ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800 text-text-light'}`}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold">Preload Inteligente</div>
                  <div className="text-[8px] font-medium text-text-light">Cache em tempo real</div>
                </div>
              </div>
              <button
                onClick={() => setField('autoPlayVideos', !autoPlayVideos)}
                className={`w-10 h-6 rounded-full p-1 transition-all ${autoPlayVideos ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full  transition-all ${autoPlayVideos ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
            </div>

            {/* Hardware Accel Toggle - Coming Soon */}
            <div className="relative group">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 text-text-dark dark:text-white rounded-2xl border border-emerald-500/20 transition-all opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-text-light">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold">Aceleração de Hardware</div>
                    <div className="text-[8px] font-medium text-text-light">
                      Decodificação via GPU
                    </div>
                  </div>
                </div>
                <div className="w-10 h-6 rounded-full p-1 bg-zinc-200 dark:bg-zinc-700 cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full transition-all translate-x-0" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed">
                <span className="bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Em Breve
                </span>
              </div>
            </div>

            {/* Sincronização Offline - Coming Soon */}
            <div className="relative group">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 text-text-dark dark:text-white rounded-2xl border border-emerald-500/20 transition-all opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-text-light">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold">Store & Sync Offline</div>
                    <div className="text-[8px] font-medium text-text-light">
                      Persistência local agressiva
                    </div>
                  </div>
                </div>
                <div className="w-10 h-6 rounded-full p-1 bg-zinc-200 dark:bg-zinc-700 cursor-not-allowed">
                  <div className="w-4 h-4 bg-white rounded-full transition-all translate-x-0" />
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed">
                <span className="bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Em Breve
                </span>
              </div>
            </div>

            {/* Media Quality Selector - Coming Soon */}
            <div className="relative group">
              <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-500/20 opacity-60 cursor-not-allowed">
                <div className="flex items-center gap-2 mb-2.5">
                  <Tv className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[9px] font-black text-text-light uppercase tracking-widest">
                    Qualidade de Transcodificação
                  </span>
                </div>
                <div className="flex gap-1.5 pointer-events-none">
                  {[
                    { value: 'speed', label: 'Velocidade', desc: 'Máxima performance' },
                    { value: 'balanced', label: 'Balanceado', desc: 'Qualidade e fluxo' },
                    { value: 'quality', label: 'Qualidade', desc: 'Máxima fidelidade' },
                  ].map((opt) => {
                    const isActive = mediaQuality === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        tabIndex={-1}
                        className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-black uppercase border flex flex-col items-center gap-0.5 transition-all ${
                          isActive
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500'
                            : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-text-light'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[7px] font-medium normal-case opacity-60">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-black/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed">
                <span className="bg-emerald-500 text-white text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Em Breve
                </span>
              </div>
            </div>

            {/* Flow Stability - Mock Display */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl relative overflow-hidden mt-auto opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-text-light uppercase tracking-widest">
                    Estabilidade de Fluxo
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-500 font-mono">
                  99.9% Nominal
                </span>
              </div>
              <div className="text-[7px] text-text-light mt-2 text-center uppercase tracking-wide">
                Monitoramento em tempo real - Em breve
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-24 sm:h-32 w-full shrink-0" />
    </div>
  );
}
