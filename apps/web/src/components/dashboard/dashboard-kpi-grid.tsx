'use client';

import { useEffect, useState } from 'react';
import { Tv, Building2, Activity, Monitor, HardDrive } from 'lucide-react';
import { useSystemStore } from '@/lib/system-store';

interface DashboardStats {
  companies: number;
  playlists: number;
  videos: number;
  photos: number;
  totalDuration: number;
  screens: number;
  onlineScreens: number;
  storageUsedBytes: number;
  storageLimitMb?: number;
}

export function DashboardKPIGrid() {
  const { showPlayersMenu } = useSystemStore();
  const [stats, setStats] = useState<DashboardStats>({
    companies: 0,
    playlists: 0,
    videos: 0,
    photos: 0,
    totalDuration: 0,
    screens: 0,
    onlineScreens: 0,
    storageUsedBytes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const storageGB = (stats.storageUsedBytes / (1024 * 1024 * 1024)).toFixed(2);
  const storageLimitGB = (stats.storageLimitMb || 50000) / 1024;
  const storagePercent = Math.min(Math.round((Number(storageGB) / storageLimitGB) * 100), 100);

  const totalDurationSeconds = stats.totalDuration;
  const totalHours = Math.floor(totalDurationSeconds / 3600);
  const totalMinutes = Math.floor((totalDurationSeconds % 3600) / 60);

  const offlineScreens = Math.max(stats.screens - stats.onlineScreens, 0);
  const statusLabel = !showPlayersMenu
    ? 'Players Desativado'
    : stats.screens === 0
      ? 'Sem Telas'
      : stats.onlineScreens === 0
        ? 'Offline'
        : offlineScreens > 0
          ? 'Parcial'
          : 'Operacional';

  const statusDetail = !showPlayersMenu
    ? 'Menu Telas oculto'
    : stats.screens === 0
      ? 'Cadastre um player'
      : stats.onlineScreens === 0
        ? 'Nenhuma tela online'
        : offlineScreens > 0
          ? `${offlineScreens} offline`
          : 'Todas online';

  if (loading) {
    return (
      <div className="animate-pulse grid grid-cols-2 laptop:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-panel-bg h-20 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 animate-fadeIn">
      {/* Playlists Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-panel-bg shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 p-5 h-28 flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-main/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -right-4 -top-4 opacity-15 dark:opacity-25 group-hover:opacity-30 dark:group-hover:opacity-45 transition-opacity duration-500 group-hover:scale-110">
          <Tv className="w-24 h-24 text-brand-main" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-brand-main/10 text-brand-main ring-1 ring-brand-main/20">
              <Tv className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-light/80">
              Playlists
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-black text-text-dark">{stats.playlists}</div>
            <div className="text-[10px] font-bold text-text-light/60 uppercase tracking-widest translate-y-[-2px]">
              Ativas
            </div>
          </div>
        </div>
      </div>

      {/* Screens Card - Only show when Players menu is enabled */}
      {showPlayersMenu && (
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-panel-bg shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 p-5 h-28 flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-4 -top-4 opacity-15 dark:opacity-25 group-hover:opacity-30 dark:group-hover:opacity-45 transition-opacity duration-500 group-hover:scale-110">
            <Monitor className="w-24 h-24 text-blue-500" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/20">
                <Monitor className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-light/80">
                Telas
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="text-3xl font-black text-text-dark">{stats.screens}</div>
              <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest translate-y-[-2px]">
                {stats.onlineScreens} Online
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Companies Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-panel-bg shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 p-5 h-28 flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -right-4 -top-4 opacity-15 dark:opacity-25 group-hover:opacity-30 dark:group-hover:opacity-45 transition-opacity duration-500 group-hover:scale-110">
          <Building2 className="w-24 h-24 text-purple-500" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 ring-1 ring-purple-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-light/80">
              Empresas
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-black text-text-dark">{stats.companies}</div>
            <div className="text-[10px] font-bold text-text-light/60 uppercase tracking-widest translate-y-[-2px]">
              Clientes
            </div>
          </div>
        </div>
      </div>

      {/* Storage Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-panel-bg shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 p-5 h-28 flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -right-4 -top-4 opacity-15 dark:opacity-25 group-hover:opacity-30 dark:group-hover:opacity-45 transition-opacity duration-500 group-hover:scale-110">
          <HardDrive className="w-24 h-24 text-rose-500" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/20">
              <HardDrive className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-light/80">
              Armazenamento
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-black text-text-dark">{storageGB}</div>
            <div className="text-[10px] font-bold text-text-light/60 uppercase tracking-widest translate-y-[-2px]">
              GB ({storagePercent}%)
            </div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-panel-bg shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-500 p-5 h-28 flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute -right-4 -top-4 opacity-15 dark:opacity-25 group-hover:opacity-30 dark:group-hover:opacity-45 transition-opacity duration-500 group-hover:scale-110">
          <Activity className="w-24 h-24 text-amber-500" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-light/80">
              Status
            </span>
          </div>
          <div className="flex flex-col">
            <div className="text-xl font-black text-text-dark truncate leading-tight">
              {statusLabel}
            </div>
            <div className="text-[10px] font-bold text-text-light/60 uppercase tracking-widest mt-0.5">
              {statusDetail}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
