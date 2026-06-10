'use client';

import { useSystemStore } from '@/lib/system-store';
import {
  Cpu,
  Activity,
  HardDrive,
  Database,
  Settings,
  Globe,
  FileText,
  Link2,
  Home,
  TrendingUp,
  Image as ImageIcon,
  Tv,
  Monitor,
  Building2,
  Users,
  Archive,
  Shield,
} from 'lucide-react';

interface InfraTelemetry {
  server: { hostname: string; processUptimeSeconds: number };
  cpu: { percent: number };
  memory: { system: { totalBytes: number; usedBytes: number; usedPercent: number } };
  db: { ok: boolean; latencyMs: number | null; transactions: number | null };
  mediaStorage: {
    usedBytes: number;
    videoBytes: number;
    imageBytes: number;
    limitBytes: number;
    usedPercent: number;
  };
}

interface Props {
  telemetry: InfraTelemetry | null;
  uptimeLabel: string;
  cpuPercent: number;
  memUsedGb: number;
  memUsedPercent: number;
  storageUsedPercent: number;
  storageLimitLabel: string;
  dbStatusLabel: string;
  dbLatencyLabel: string;
  isMaintenanceModeLocal: boolean;
  maintenanceScopeLocal: 'site' | 'pages';
  maintenancePagesLocal: string[];
  setIsMaintenanceModeLocal: (v: boolean) => void;
  setMaintenanceScopeLocal: (v: 'site' | 'pages') => void;
  setMaintenancePagesLocal: (fn: (prev: string[]) => string[]) => void;
}

const MAINTENANCE_PAGE_OPTIONS = [
  { path: '/dashboard', label: 'Visão Geral', icon: Home },
  { path: '/dashboard/analytics', label: 'Analytics', icon: TrendingUp },
  { path: '/dashboard/library', label: 'Biblioteca', icon: ImageIcon },
  { path: '/dashboard/playlists', label: 'Playlists', icon: Tv },
  { path: '/dashboard/players', label: 'Players', icon: Monitor },
  { path: '/dashboard/companies', label: 'Empresas', icon: Building2 },
  { path: '/dashboard/users', label: 'Usuários', icon: Users },
  { path: '/dashboard/storage', label: 'Armazenamento', icon: Archive },
  { path: '/dashboard/audit', label: 'Auditoria', icon: Shield },
];

export default function SettingsInfraTab({
  telemetry,
  uptimeLabel: _uptimeLabel,
  cpuPercent,
  memUsedGb,
  memUsedPercent,
  storageUsedPercent,
  storageLimitLabel,
  dbStatusLabel,
  dbLatencyLabel,
  isMaintenanceModeLocal,
  maintenanceScopeLocal,
  maintenancePagesLocal,
  setIsMaintenanceModeLocal,
  setMaintenanceScopeLocal,
  setMaintenancePagesLocal,
}: Props) {
  const {
    setField,
    webhookUrl,
    maintenanceMessage,
    maintenanceEstimatedTime,
    maintenancePriority,
  } = useSystemStore();

  return (
    <div className="space-y-4 animate-fadeIn pb-40 flex flex-col h-full overflow-y-auto pr-2 scrollbar-hide">
      {/* Metrics HUD */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPU Card */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Cpu className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-text-dark dark:text-white tracking-tighter">
              {telemetry ? `${Math.round(cpuPercent)}%` : '—'}
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-text-light uppercase tracking-widest">
              Processamento
            </h4>
            <div className="h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${cpuPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* RAM Card */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-text-dark dark:text-white tracking-tighter">
              {telemetry ? memUsedGb.toFixed(1) : '—'} GB
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-text-light uppercase tracking-widest">
              Memória RAM
            </h4>
            <div className="h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${memUsedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Storage Card */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <HardDrive className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-text-dark dark:text-white tracking-tighter">
              {telemetry ? `${storageUsedPercent.toFixed(1)}%` : '—'}
            </span>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-text-light uppercase tracking-widest">
              Storage ({storageLimitLabel})
            </h4>
            <div className="h-1.5 bg-emerald-500/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${storageUsedPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Database Card */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Database className="w-6 h-6" />
            </div>
            <div className="text-right">
              <span className="block text-lg font-black text-emerald-500 tracking-tighter">
                {dbStatusLabel}
              </span>
              <span className="text-[9px] font-mono text-text-light">{dbLatencyLabel} latency</span>
            </div>
          </div>
          <div className="space-y-1">
            <h4 className="text-[10px] font-black text-text-light uppercase tracking-widest">
              Database Cluster
            </h4>
            <div className="h-1.5 bg-emerald-500/20 rounded-full overflow-hidden">
              <div className="h-full w-full bg-emerald-500/60 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-24 sm:pb-36">
        {/* Maintenance & DevOps */}
        <div className="space-y-4">
          <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-4xl p-6 space-y-4">
            <h3 className="text-xs font-black text-text-dark uppercase tracking-widest flex items-center gap-2">
              <Settings className="w-4 h-4 text-emerald-500" /> Controle de Manutenção
            </h3>

            <div className="flex items-center justify-between p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${isMaintenanceModeLocal ? 'bg-zinc-400/20 text-zinc-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                >
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="block font-black text-[10px] uppercase tracking-wide">
                    Modo Manutenção
                  </span>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                    Bloqueia acesso público
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsMaintenanceModeLocal(!isMaintenanceModeLocal)}
                className={`w-12 h-6 rounded-full transition-all relative ${isMaintenanceModeLocal ? 'bg-zinc-400' : 'bg-zinc-200 dark:bg-zinc-700'}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMaintenanceModeLocal ? 'left-7' : 'left-1'}`}
                />
              </button>
            </div>

            <div className="p-3 bg-zinc-400/5 rounded-2xl border border-zinc-400/10 space-y-4 animate-fadeIn">
              <div className="flex gap-2">
                {[
                  { value: 'site', label: 'Sistema', icon: Globe },
                  { value: 'pages', label: 'Páginas', icon: FileText },
                ].map((opt) => {
                  const IconComponent = opt.icon;
                  const isActive = maintenanceScopeLocal === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setMaintenanceScopeLocal(opt.value as 'site' | 'pages')}
                      className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border flex items-center justify-center gap-1.5 transition-all ${
                        isActive
                          ? 'bg-zinc-100 dark:bg-white/10 text-zinc-500 dark:text-zinc-400 border-zinc-400'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-400'
                      }`}
                    >
                      <IconComponent className="w-3.5 h-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Páginas selector */}
              {maintenanceScopeLocal === 'pages' && (
                <div className="space-y-2 border-t border-zinc-400/10 pt-3">
                  <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">
                    Selecione as Páginas
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-hide">
                    {MAINTENANCE_PAGE_OPTIONS.map((optPage) => {
                      const PageIcon = optPage.icon;
                      const isSelected = maintenancePagesLocal.includes(optPage.path);
                      return (
                        <button
                          key={optPage.path}
                          type="button"
                          onClick={() =>
                            setMaintenancePagesLocal((prev) =>
                              prev.includes(optPage.path)
                                ? prev.filter((p) => p !== optPage.path)
                                : [...prev, optPage.path],
                            )
                          }
                          className={`flex items-center justify-between p-2 rounded-xl border text-[9px] font-black uppercase transition-all ${
                            isSelected
                              ? 'bg-zinc-400/10 border-zinc-400 text-zinc-600 dark:text-zinc-300'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <PageIcon className="w-3.5 h-3.5" />
                            <span className="truncate max-w-17.5">{optPage.label}</span>
                          </div>
                          <div
                            className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-zinc-400 bg-zinc-400'
                                : 'border-zinc-300 dark:border-zinc-700'
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">
                    Previsão
                  </label>
                  <input
                    type="text"
                    value={maintenanceEstimatedTime}
                    onChange={(e) => setField('maintenanceEstimatedTime', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-zinc-900 border border-zinc-400/20 rounded-xl text-[10px] text-zinc-900 dark:text-white outline-none transition-all focus:border-zinc-400/50"
                    placeholder="Ex: 2 horas, 15:30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest pl-1">
                    Nível / Prioridade
                  </label>
                  <input
                    type="text"
                    value={maintenancePriority}
                    onChange={(e) => setField('maintenancePriority', e.target.value)}
                    className="w-full p-2 bg-white dark:bg-zinc-900 border border-zinc-400/20 rounded-xl text-[10px] text-zinc-900 dark:text-white outline-none transition-all focus:border-zinc-400/50"
                    placeholder="Ex: Programada, Crítica"
                  />
                </div>
              </div>

              <textarea
                value={maintenanceMessage}
                onChange={(e) => setField('maintenanceMessage', e.target.value)}
                className="w-full h-16 p-2 bg-white dark:bg-zinc-900 border border-zinc-400/20 rounded-xl text-[10px] outline-none resize-none animate-fadeIn text-zinc-900 dark:text-white"
                placeholder="Mensagem de manutenção..."
              />
            </div>
          </div>
        </div>

        {/* Webhooks & Connectivity */}
        <div className="bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/20 rounded-4xl p-6 space-y-4">
          <h3 className="text-xs font-black text-text-dark uppercase tracking-widest flex items-center gap-2">
            <Link2 className="w-4 h-4 text-emerald-500" /> Webhooks & Integrações
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-text-light uppercase tracking-widest">
                Endpoint URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setField('webhookUrl', e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-xl text-xs font-mono text-text-dark"
                placeholder="https://api.hook.io/..."
              />
            </div>
          </div>
        </div>
      </div>
      <div className="h-32 sm:h-48 w-full shrink-0" />
    </div>
  );
}
