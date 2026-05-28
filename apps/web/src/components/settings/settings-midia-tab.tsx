"use client";

import { useSystemStore } from "@/lib/system-store";
import {
    Video, HardDrive, Trash2, Loader2, ShieldCheck,
    Zap, Cpu, Database, Tv
} from "lucide-react";

interface Props {
    isOptimizing: boolean;
    integrity: number;
    onClearCache: () => void;
    onCheckIntegrity: () => void;
}

export default function SettingsMidiaTab({ isOptimizing, integrity, onClearCache, onCheckIntegrity }: Props) {
    const {
        storageLimit, mediaCacheSize, uploadLimit, uploadLimitVideo,
        mediaQuality, autoPlayVideos, hardwareAccel, isOfflineSyncEnabled,
        setField
    } = useSystemStore();

    return (
        <div className="space-y-8 animate-fadeIn pb-40 flex flex-col h-full overflow-y-auto pr-2 scrollbar-hide">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-2">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-zinc-400/10 rounded-2xl flex items-center justify-center text-zinc-400  group">
                        <Video className="w-7 h-7 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-text-dark dark:text-white tracking-tight">Gestão de Mídia & Playback</h2>
                            <span className="bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-[1px] px-3 py-1 rounded-full  border border-white/10 flex items-center gap-1.5">
                                Player Core v2
                            </span>
                        </div>
                        <p className="text-text-light dark:text-white/40 font-bold uppercase tracking-widest text-[9px] mt-1 pl-0.5">Controle de alocação de recursos, cache e performance global</p>
                    </div>
                </div>

                <div className="flex gap-4 items-center bg-white dark:bg-white/5 p-2 rounded-2xl border border-border ">
                    <div className="px-5 py-2 text-center border-r border-border/50">
                        <span className="block text-[7px] font-black text-text-light uppercase tracking-widest mb-1">Cache Ativo</span>
                        <span className="text-xl font-black text-text-dark dark:text-white tracking-tighter">1.2 TB</span>
                    </div>
                    <div className="px-5 py-2 text-center">
                        <span className="block text-[7px] font-black text-text-light uppercase tracking-widest mb-1">Taxa Compressão</span>
                        <span className="text-xl font-black text-text-dark dark:text-white tracking-tighter">94.2%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left Col: Storage & Cache */}
                <div className="space-y-4 flex flex-col h-full">
                    <h3 className="flex items-center gap-2 text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest pl-4">
                        <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                        Recursos & Storage
                    </h3>

                    <div className="bg-white/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 space-y-6 relative overflow-hidden group flex-1 flex flex-col">
                        {/* Global Limit Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Limite Global</span>
                                <span className="text-2xl font-black text-zinc-400 tracking-tighter">
                                    {storageLimit} <span className="text-[10px] text-zinc-400 font-bold">GB</span>
                                </span>
                            </div>
                            <input
                                type="range"
                                min="100"
                                max="1000"
                                step="50"
                                value={storageLimit}
                                onChange={(e) => setField('storageLimit', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400 hover:accent-zinc-400 transition-all"
                            />
                        </div>

                        {/* Cache Size Slider */}
                        <div className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                            <div className="flex justify-between items-end">
                                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-1">Buffer de Cache</label>
                                <span className="text-xl font-black text-zinc-400 tracking-tighter">{mediaCacheSize} <span className="text-[10px] text-zinc-400 font-bold">MB</span></span>
                            </div>
                            <input
                                type="range"
                                min="128"
                                max="4096"
                                step="128"
                                value={mediaCacheSize}
                                onChange={(e) => setField('mediaCacheSize', parseInt(e.target.value))}
                                className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-400 hover:accent-zinc-400 transition-all"
                            />
                        </div>

                        <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-900 dark:text-white">Upload (Imagens)</div>
                                        <div className="text-[8px] font-medium text-zinc-400">Limite por arquivo em MB</div>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        value={uploadLimit}
                                        onChange={(e) => setField('uploadLimit', e.target.value)}
                                        className="w-28 h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/20 text-zinc-900 dark:text-white text-sm font-bold outline-none focus:border-zinc-400"
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-900 dark:text-white">Upload (Vídeos)</div>
                                        <div className="text-[8px] font-medium text-zinc-400">Limite por arquivo em MB</div>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        value={uploadLimitVideo}
                                        onChange={(e) => setField('uploadLimitVideo', e.target.value)}
                                        className="w-28 h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-black/20 text-zinc-900 dark:text-white text-sm font-bold outline-none focus:border-zinc-400"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Maintenance Actions */}
                        <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3">
                            <button
                                onClick={onClearCache}
                                disabled={isOptimizing}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 hover:border-zinc-400/30 transition-all group/btn disabled:opacity-50"
                            >
                                {isOptimizing ? (
                                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4 text-zinc-400 group-hover/btn:text-zinc-400 transition-colors" />
                                )}
                                <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400">Limpar Cache</span>
                            </button>
                            <button
                                onClick={onCheckIntegrity}
                                disabled={isOptimizing}
                                className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/5 hover:border-zinc-400/30 transition-all group/btn disabled:opacity-50"
                            >
                                {isOptimizing ? (
                                    <Loader2 className="w-4 h-4 text-zinc-400 animate-spin" />
                                ) : (
                                    <ShieldCheck className="w-4 h-4 text-zinc-400 group-hover/btn:text-zinc-400 transition-colors" />
                                )}
                                <span className="text-[8px] font-black uppercase tracking-tighter text-zinc-400">Checar Integridade</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mid Col: Performance & Logic */}
                <div className="space-y-4 flex flex-col h-full">
                    <h3 className="flex items-center gap-2 text-[10px] font-black text-zinc-900 dark:text-white uppercase tracking-widest pl-4">
                        <Zap className="w-3.5 h-3.5 text-zinc-400" />
                        Performance & Lógica
                    </h3>

                    <div className="bg-white/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] p-6 space-y-4 relative overflow-hidden flex-1 flex flex-col">
                        {/* Preload Toggle */}
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-zinc-800  transition-all hover:border-zinc-400/30 group/item">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${autoPlayVideos ? 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 ' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                    <Zap className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold">Preload Inteligente</div>
                                    <div className="text-[8px] font-medium text-zinc-400">Cache em tempo real</div>
                                </div>
                            </div>
                            <button onClick={() => setField('autoPlayVideos', !autoPlayVideos)} className={`w-10 h-6 rounded-full p-1 transition-all ${autoPlayVideos ? 'bg-zinc-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full  transition-all ${autoPlayVideos ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Hardware Accel Toggle */}
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-zinc-800  transition-all hover:border-zinc-400/30 group/item">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${hardwareAccel ? 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 ' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                    <Cpu className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold">Aceleração de Hardware</div>
                                    <div className="text-[8px] font-medium text-zinc-400">Decodificação via GPU</div>
                                </div>
                            </div>
                            <button onClick={() => setField('hardwareAccel', !hardwareAccel)} className={`w-10 h-6 rounded-full p-1 transition-all ${hardwareAccel ? 'bg-zinc-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full  transition-all ${hardwareAccel ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* New: Sincronização Offline */}
                        <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-zinc-800  transition-all hover:border-zinc-400/30 group/item">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isOfflineSyncEnabled ? 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 ' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                    <Database className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold">Store & Sync Offline</div>
                                    <div className="text-[8px] font-medium text-zinc-400">Persistência local agressiva</div>
                                </div>
                            </div>
                            <button onClick={() => setField('isOfflineSyncEnabled', !isOfflineSyncEnabled)} className={`w-10 h-6 rounded-full p-1 transition-all ${isOfflineSyncEnabled ? 'bg-zinc-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full  transition-all ${isOfflineSyncEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {/* Media Quality Selector */}
                        <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2 mb-2.5">
                                <Tv className="w-3.5 h-3.5 text-zinc-400" />
                                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Qualidade de Transcodificação</span>
                            </div>
                            <div className="flex gap-1.5">
                                {[
                                    { value: 'speed', label: 'Velocidade', desc: 'Máxima performance' },
                                    { value: 'balanced', label: 'Balanceado', desc: 'Qualidade e fluxo' },
                                    { value: 'quality', label: 'Qualidade', desc: 'Máxima fidelidade' }
                                ].map((opt) => {
                                    const isActive = mediaQuality === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setField('mediaQuality', opt.value)}
                                            className={`flex-1 py-2 px-1 rounded-xl text-[9px] font-black uppercase border flex flex-col items-center gap-0.5 transition-all ${
                                                isActive
                                                    ? 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 border-zinc-400'
                                                    : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-zinc-400/30'
                                            }`}
                                        >
                                            <span>{opt.label}</span>
                                            <span className="text-[7px] font-medium normal-case opacity-60">{opt.desc}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="p-4 bg-zinc-400/5 border border-zinc-400/10 rounded-2xl relative overflow-hidden mt-auto">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" />
                                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Estabilidade de Fluxo</span>
                                </div>
                                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 font-mono">99.9% Nominal</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="h-24 sm:h-32 w-full shrink-0" />
        </div>
    );
}
