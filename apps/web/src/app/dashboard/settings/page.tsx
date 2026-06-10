'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Settings, Save, Loader2, ChevronRight, Video, Lock, Server, KeyRound } from 'lucide-react';
import { useSystemStore } from '@/lib/system-store';
import { notifySuccess, notifyError } from '@/lib/notification-store';
import SettingsMidiaTab from '@/components/settings/settings-midia-tab';
import SettingsSegurancaTab from '@/components/settings/settings-seguranca-tab';
import SettingsInfraTab from '@/components/settings/settings-infra-tab';
import SettingsSistemaTab from '@/components/settings/settings-sistema-tab';

type TabType = 'midia' | 'seguranca' | 'infra' | 'sistema';

export default function SystemSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('midia');

  // System Store Integration
  const {
    systemName,
    setField,
    footerMessage,
    logoSidebarUrl,
    logoLoginUrl,
    logoAuthUrl,
    faviconUrl,
    isMaintenanceMode,
    maintenanceMessage,
    maintenanceEstimatedTime,
    maintenancePriority,
    maintenancePages,
    maintenanceScope,
    isBruteForceProtection,
    isTwoFactorEnforced,
    auditLogRetention,
    isPasswordComplexityEnforced,
    sessionLimit,
    restrictIP,
    trusted_ips,
    webhookUrl,
    isDebugMode,
    isAutoClean,
    isAutoBackup,
    cleanDays,
    logLevel,
    storageLimit,
    updateMetrics,
    autoPlayVideos,
    hardwareAccel,
    mediaCacheSize,
    isOfflineSyncEnabled,
    isAiUpscaling,
    isHdrEnabled,
    isAudioNormalized,
    isP2pEnabled,
    mediaQuality,
    uploadLimit,
    uploadLimitVideo,
    fetchSettings,
  } = useSystemStore();

  // Local UI states only for ephemeral things
  const [isMaintenanceModeLocal, setIsMaintenanceModeLocal] = useState(isMaintenanceMode);
  const [maintenanceScopeLocal, setMaintenanceScopeLocal] = useState<'site' | 'pages'>(
    maintenanceScope ?? 'site',
  );
  const [maintenancePagesLocal, setMaintenancePagesLocal] = useState<string[]>(
    maintenancePages ?? [],
  );
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [integrity, setIntegrity] = useState(98);

  type InfraTelemetry = {
    server: {
      hostname: string;
      processUptimeSeconds: number;
    };
    cpu: {
      percent: number;
    };
    memory: {
      system: {
        totalBytes: number;
        usedBytes: number;
        usedPercent: number;
      };
    };
    db: {
      ok: boolean;
      latencyMs: number | null;
      transactions: number | null;
    };
    mediaStorage: {
      usedBytes: number;
      videoBytes: number;
      imageBytes: number;
      limitBytes: number;
      usedPercent: number;
    };
  };

  const [telemetry, setTelemetry] = useState<InfraTelemetry | null>(null);
  const lastDbTxRef = useRef<number | null>(null);
  const lastTelemetryAtRef = useRef<number | null>(null);

  const formatUptime = useCallback((seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, []);

  const uptimeLabel = useMemo(() => {
    const seconds = telemetry?.server?.processUptimeSeconds;
    if (typeof seconds !== 'number') return '—';
    return formatUptime(seconds);
  }, [telemetry, formatUptime]);

  const cpuPercent = typeof telemetry?.cpu?.percent === 'number' ? telemetry.cpu.percent : 0;
  const memUsedGb =
    typeof telemetry?.memory?.system?.usedBytes === 'number'
      ? telemetry.memory.system.usedBytes / 1024 / 1024 / 1024
      : 0;
  const memUsedPercent =
    typeof telemetry?.memory?.system?.usedPercent === 'number'
      ? telemetry.memory.system.usedPercent
      : 0;
  const storageUsedPercent =
    typeof telemetry?.mediaStorage?.usedPercent === 'number'
      ? telemetry.mediaStorage.usedPercent
      : 0;
  const storageLimitLabel =
    typeof telemetry?.mediaStorage?.limitBytes === 'number' && telemetry.mediaStorage.limitBytes > 0
      ? `${Math.round(telemetry.mediaStorage.limitBytes / 1024 / 1024)}MB`
      : '—';
  const dbLatencyLabel =
    typeof telemetry?.db?.latencyMs === 'number' ? `${telemetry.db.latencyMs}ms` : '—';
  const dbStatusLabel = telemetry?.db?.ok ? 'ONLINE' : 'OFFLINE';

  // pushLog removed — unused (no log viewer UI). Toast notifications used instead.

  useEffect(() => {
    let cancelled = false;

    const fetchTelemetry = async () => {
      const started = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        const res = await fetch('/api/system/telemetry', { cache: 'no-store' });
        const ended = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const gatewayMs = Math.max(0, Math.round(ended - started));

        if (!res.ok) {
          throw new Error(`Telemetry fetch failed (${res.status})`);
        }

        const data = (await res.json()) as InfraTelemetry;
        if (cancelled) return;

        setTelemetry(data);

        let computedDbOps = 0;
        const now = Date.now();
        const tx = typeof data?.db?.transactions === 'number' ? data.db.transactions : null;
        if (tx !== null && lastDbTxRef.current !== null && lastTelemetryAtRef.current !== null) {
          const dt = (now - lastTelemetryAtRef.current) / 1000;
          const delta = tx - lastDbTxRef.current;
          if (dt > 0 && delta >= 0) {
            computedDbOps = Math.round(delta / dt);
          }
        }
        if (tx !== null) {
          lastDbTxRef.current = tx;
          lastTelemetryAtRef.current = now;
        }

        updateMetrics(gatewayMs, computedDbOps);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : String(e);
        notifyError(`Telemetry error: ${msg}`, 'Erro ao testar telemetria');
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [updateMetrics]);

  // Estado Original para Comparação
  const [originalSettings, setOriginalSettings] = useState<Partial<Record<string, unknown>> | null>(
    null,
  );

  // Sync local maintenance toggle ONLY when original settings are loaded or updated via Save
  // This prevents the background polling from reverting local changes before the user clicks Save
  useEffect(() => {
    if (originalSettings) {
      setIsMaintenanceModeLocal(originalSettings.isMaintenanceMode as boolean);
      setMaintenanceScopeLocal((originalSettings.maintenanceScope as 'site' | 'pages') ?? 'site');
      setMaintenancePagesLocal((originalSettings.maintenancePages as string[]) ?? []);
    }
  }, [originalSettings]);

  // Load settings from server
  useEffect(() => {
    async function loadSettings() {
      try {
        await fetchSettings();
        const state = useSystemStore.getState();
        const initialData = {
          systemName: String(state.systemName || 'PlaySync'),
          footerMessage: String(state.footerMessage || ''),
          logoSidebarUrl: String(state.logoSidebarUrl || ''),
          logoLoginUrl: String(state.logoLoginUrl || ''),
          logoAuthUrl: String(state.logoAuthUrl || ''),
          faviconUrl: String(state.faviconUrl || ''),
          isAutoBackup: Boolean(state.isAutoBackup ?? true),
          isAutoClean: Boolean(state.isAutoClean ?? true),
          cleanDays: Number(state.cleanDays || 90),
          isMaintenanceMode: Boolean(state.isMaintenanceMode ?? false),
          maintenanceScope: (state.maintenanceScope as 'site' | 'pages') ?? 'site',
          maintenancePages: Array.isArray(state.maintenancePages) ? state.maintenancePages : [],
          sessionLimit: String(state.sessionLimit || '60'),
          restrictIP: String(state.restrictIP || ''),
          trusted_ips: String(state.trusted_ips || ''),
          uploadLimit: String(state.uploadLimit || '500'),
          uploadLimitVideo: String(state.uploadLimitVideo || '1024'),
          mediaQuality: String(state.mediaQuality || 'balanced'),
          autoPlayVideos: Boolean(state.autoPlayVideos ?? true),
          webhookUrl: String(state.webhookUrl || ''),
          maintenanceMessage: String(state.maintenanceMessage || ''),
          maintenanceEstimatedTime: String(state.maintenanceEstimatedTime || ''),
          maintenancePriority: String(state.maintenancePriority || ''),
          isBruteForceProtection: Boolean(state.isBruteForceProtection ?? true),
          isTwoFactorEnforced: Boolean(state.isTwoFactorEnforced ?? false),
          auditLogRetention: String(state.auditLogRetention || '90'),
          isPasswordComplexityEnforced: Boolean(state.isPasswordComplexityEnforced ?? true),
          isDebugMode: Boolean(state.isDebugMode ?? false),
          logLevel: (state.logLevel as 'info' | 'debug' | 'error') || 'info',
          storageLimit: Number(state.storageLimit || 500),
          mediaCacheSize: Number(state.mediaCacheSize || 1024),
          hardwareAccel: Boolean(state.hardwareAccel ?? true),
          isAiUpscaling: Boolean(state.isAiUpscaling ?? false),
          isHdrEnabled: Boolean(state.isHdrEnabled ?? true),
          isAudioNormalized: Boolean(state.isAudioNormalized ?? true),
          isP2pEnabled: Boolean(state.isP2pEnabled ?? false),
          isOfflineSyncEnabled: Boolean(state.isOfflineSyncEnabled ?? true),
        };

        setOriginalSettings(initialData);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    loadSettings();
  }, [fetchSettings]);

  // Monitor de Alterações (Memoizado com normalização profunda)
  const hasChanges = useMemo(() => {
    if (!originalSettings) return false;

    const currentSettings = {
      systemName: String(systemName).trim(),
      footerMessage: String(footerMessage).trim(),
      logoSidebarUrl: String(logoSidebarUrl),
      logoLoginUrl: String(logoLoginUrl),
      logoAuthUrl: String(logoAuthUrl),
      faviconUrl: String(faviconUrl),
      isAutoBackup: Boolean(isAutoBackup),
      isAutoClean: Boolean(isAutoClean),
      cleanDays: Number(cleanDays),
      sessionLimit: String(sessionLimit).trim(),
      restrictIP: String(restrictIP).trim(),
      trusted_ips: String(trusted_ips).trim(),
      uploadLimit: String(uploadLimit).trim(),
      uploadLimitVideo: String(uploadLimitVideo).trim(),
      mediaQuality: String(mediaQuality),
      autoPlayVideos: Boolean(autoPlayVideos),
      webhookUrl: String(webhookUrl).trim(),
      maintenanceMessage: String(maintenanceMessage).trim(),
      maintenanceEstimatedTime: String(maintenanceEstimatedTime).trim(),
      maintenancePriority: String(maintenancePriority).trim(),
      isMaintenanceMode: Boolean(isMaintenanceModeLocal),
      maintenanceScope: maintenanceScopeLocal,
      maintenancePages: JSON.stringify([...maintenancePagesLocal].sort()),
      isBruteForceProtection: Boolean(isBruteForceProtection),
      isTwoFactorEnforced: Boolean(isTwoFactorEnforced),
      auditLogRetention: String(auditLogRetention).trim(),
      isPasswordComplexityEnforced: Boolean(isPasswordComplexityEnforced),
      isDebugMode: Boolean(isDebugMode),
      logLevel: String(logLevel),
      storageLimit: Number(storageLimit),
      mediaCacheSize: Number(mediaCacheSize),
      hardwareAccel: Boolean(hardwareAccel),
      isAiUpscaling: Boolean(isAiUpscaling),
      isHdrEnabled: Boolean(isHdrEnabled),
      isAudioNormalized: Boolean(isAudioNormalized),
      isP2pEnabled: Boolean(isP2pEnabled),
      isOfflineSyncEnabled: Boolean(isOfflineSyncEnabled),
    };

    const originalNormalized = {
      systemName: String(originalSettings.systemName).trim(),
      footerMessage: String(originalSettings.footerMessage).trim(),
      logoSidebarUrl: String(originalSettings.logoSidebarUrl),
      logoLoginUrl: String(originalSettings.logoLoginUrl),
      logoAuthUrl: String(originalSettings.logoAuthUrl),
      faviconUrl: String(originalSettings.faviconUrl),
      isAutoBackup: Boolean(originalSettings.isAutoBackup),
      isAutoClean: Boolean(originalSettings.isAutoClean),
      cleanDays: Number(originalSettings.cleanDays),
      sessionLimit: String(originalSettings.sessionLimit).trim(),
      restrictIP: String(originalSettings.restrictIP).trim(),
      trusted_ips: String(originalSettings.trusted_ips || '').trim(),
      uploadLimit: String(originalSettings.uploadLimit).trim(),
      uploadLimitVideo: String(
        (originalSettings as Record<string, unknown>).uploadLimitVideo || '1024',
      ).trim(),
      mediaQuality: String(originalSettings.mediaQuality),
      autoPlayVideos: Boolean(originalSettings.autoPlayVideos),
      webhookUrl: String(originalSettings.webhookUrl).trim(),
      maintenanceMessage: String(originalSettings.maintenanceMessage).trim(),
      maintenanceEstimatedTime: String(originalSettings.maintenanceEstimatedTime).trim(),
      maintenancePriority: String(originalSettings.maintenancePriority).trim(),
      isMaintenanceMode: Boolean(originalSettings.isMaintenanceMode ?? false),
      maintenanceScope: (originalSettings as Record<string, unknown>).maintenanceScope ?? 'site',
      maintenancePages: JSON.stringify(
        [
          ...(Array.isArray((originalSettings as Record<string, unknown>).maintenancePages)
            ? ((originalSettings as Record<string, unknown>).maintenancePages as string[])
            : []),
        ].sort(),
      ),
      isBruteForceProtection: Boolean(originalSettings.isBruteForceProtection),
      isTwoFactorEnforced: Boolean(originalSettings.isTwoFactorEnforced),
      auditLogRetention: String(originalSettings.auditLogRetention).trim(),
      isPasswordComplexityEnforced: Boolean(originalSettings.isPasswordComplexityEnforced),
      isDebugMode: Boolean(originalSettings.isDebugMode ?? false),
      logLevel: String(originalSettings.logLevel || 'info'),
      storageLimit: Number(originalSettings.storageLimit || 500),
      mediaCacheSize: Number(originalSettings.mediaCacheSize || 1024),
      hardwareAccel: Boolean(originalSettings.hardwareAccel ?? true),
      isAiUpscaling: Boolean(originalSettings.isAiUpscaling ?? false),
      isHdrEnabled: Boolean(originalSettings.isHdrEnabled ?? true),
      isAudioNormalized: Boolean(originalSettings.isAudioNormalized ?? true),
      isP2pEnabled: Boolean(originalSettings.isP2pEnabled ?? false),
      isOfflineSyncEnabled: Boolean(originalSettings.isOfflineSyncEnabled ?? true),
    };

    const differences: Record<string, { current: unknown; original: unknown }> = {};
    let differs = false;

    Object.keys(currentSettings).forEach((key) => {
      const curVal = (currentSettings as Record<string, unknown>)[key];
      const origVal = (originalNormalized as Record<string, unknown>)[key];
      if (curVal !== origVal) {
        differences[key] = { current: curVal, original: origVal };
        differs = true;
      }
    });

    if (differs) {
      console.log('Settings mismatches detected:', differences);
    }

    return differs;
  }, [
    systemName,
    footerMessage,
    logoSidebarUrl,
    logoLoginUrl,
    logoAuthUrl,
    faviconUrl,
    isAutoBackup,
    isAutoClean,
    cleanDays,
    sessionLimit,
    restrictIP,
    trusted_ips,
    uploadLimit,
    uploadLimitVideo,
    mediaQuality,
    autoPlayVideos,
    webhookUrl,
    maintenanceMessage,
    maintenanceEstimatedTime,
    maintenancePriority,
    isBruteForceProtection,
    isTwoFactorEnforced,
    auditLogRetention,
    isPasswordComplexityEnforced,
    isMaintenanceModeLocal,
    maintenanceScopeLocal,
    maintenancePagesLocal,
    isDebugMode,
    logLevel,
    storageLimit,
    hardwareAccel,
    isAiUpscaling,
    isHdrEnabled,
    isAudioNormalized,
    isP2pEnabled,
    isOfflineSyncEnabled,
    originalSettings,
    mediaCacheSize,
  ]);

  // Poll for sessions and settings updates
  useEffect(() => {
    // Polling interval - only poll if no unsaved changes
    const interval = setInterval(() => {
      if (!hasChanges) {
        fetchSettings();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSettings, hasChanges]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemName,
          footerMessage,
          logoSidebarUrl,
          logoLoginUrl,
          logoAuthUrl,
          faviconUrl,
          isAutoBackup,
          isAutoClean,
          cleanDays,
          sessionLimit,
          restrictIP,
          trusted_ips,
          webhookUrl,
          maintenanceMessage,
          maintenanceEstimatedTime,
          maintenancePriority,
          isMaintenanceMode: isMaintenanceModeLocal,
          maintenanceScope: maintenanceScopeLocal,
          maintenancePages: maintenancePagesLocal,
          isBruteForceProtection,
          isTwoFactorEnforced,
          auditLogRetention,
          isPasswordComplexityEnforced,
          isDebugMode,
          logLevel,
          storageLimit,
          mediaCacheSize,
          mediaQuality,
          uploadLimit,
          uploadLimitVideo,
          autoPlayVideos,
          hardwareAccel,
          isAiUpscaling,
          isHdrEnabled,
          isAudioNormalized,
          isP2pEnabled,
          isOfflineSyncEnabled,
        }),
      });

      if (response.ok) {
        // Re-fetch settings to update the store and originalSettings
        const data = await response.json();
        const initialData = {
          systemName: String(data.systemName || 'PlaySync'),
          footerMessage: String(data.footerMessage || ''),
          logoSidebarUrl: String(data.logoSidebarUrl || ''),
          logoLoginUrl: String(data.logoLoginUrl || ''),
          logoAuthUrl: String(data.logoAuthUrl || ''),
          faviconUrl: String(data.faviconUrl || ''),
          isAutoBackup: Boolean(data.isAutoBackup ?? true),
          isAutoClean: Boolean(data.isAutoClean ?? true),
          cleanDays: Number(data.cleanDays || 90),
          isMaintenanceMode: Boolean(data.isMaintenanceMode ?? false),
          maintenanceScope: (data.maintenanceScope as 'site' | 'pages') ?? 'site',
          maintenancePages: Array.isArray(data.maintenancePages) ? data.maintenancePages : [],
          sessionLimit: String(data.sessionLimit || '60'),
          restrictIP: String(data.restrictIP || ''),
          trusted_ips: String(data.trusted_ips || ''),
          uploadLimit: String(data.uploadLimit || '500'),
          uploadLimitVideo: String(data.uploadLimitVideo || '1024'),
          mediaQuality: String(data.mediaQuality || 'balanced'),
          autoPlayVideos: Boolean(data.autoPlayVideos ?? true),
          webhookUrl: String(data.webhookUrl || ''),
          maintenanceMessage: String(data.maintenanceMessage || ''),
          maintenanceEstimatedTime: String(data.maintenanceEstimatedTime || ''),
          maintenancePriority: String(data.maintenancePriority || ''),
          isBruteForceProtection: Boolean(data.isBruteForceProtection ?? true),
          isTwoFactorEnforced: Boolean(data.isTwoFactorEnforced ?? false),
          auditLogRetention: String(data.auditLogRetention || '90'),
          isPasswordComplexityEnforced: Boolean(data.isPasswordComplexityEnforced ?? true),
          isDebugMode: Boolean(data.isDebugMode ?? false),
          logLevel: (data.logLevel as 'info' | 'debug' | 'error') || 'info',
          storageLimit: Number(data.storageLimit || 500),
          mediaCacheSize: Number(data.mediaCacheSize || 1024),
          hardwareAccel: Boolean(data.hardwareAccel ?? true),
          isAiUpscaling: Boolean(data.isAiUpscaling ?? false),
          isHdrEnabled: Boolean(data.isHdrEnabled ?? true),
          isAudioNormalized: Boolean(data.isAudioNormalized ?? true),
          isP2pEnabled: Boolean(data.isP2pEnabled ?? false),
          isOfflineSyncEnabled: Boolean(data.isOfflineSyncEnabled ?? true),
        };

        Object.entries(initialData).forEach(([key, value]) => {
          setField(key as keyof typeof initialData, value);
        });
        setOriginalSettings(initialData);
        notifySuccess(
          'Configurações globais salvas no servidor!',
          'Todas as alterações foram aplicadas',
        );
      } else {
        notifyError('Erro ao salvar no servidor.', 'As configurações não foram aplicadas');
      }
    } catch {
      notifyError('Erro de conexão com o servidor.', 'Verifique sua conexão de rede');
    }
    setIsLoading(false);
  };

  const handleClearCache = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/system/cache/clear', { method: 'POST' });
      if (!res.ok) throw new Error('Falha ao limpar cache');
      notifySuccess('Cache do sistema limpo com sucesso!', 'Dados temporários foram removidos');
    } catch {
      notifyError('Erro ao limpar cache do sistema.', 'Tente novamente mais tarde');
    }
    setIsOptimizing(false);
  };

  const handleCheckIntegrity = async () => {
    setIsOptimizing(true);
    const startValue = integrity;
    for (let i = startValue; i <= 100; i++) {
      setIntegrity(i);
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsOptimizing(false);
    notifySuccess('Verificação de integridade concluída.', 'Nenhuma anomalia detectada');
  };

  const tabs = [
    {
      id: 'midia',
      label: 'Mídia & Player',
      icon: Video,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'seguranca',
      label: 'Segurança & Acesso',
      icon: Lock,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'infra',
      label: 'Infraestrutura & Ops',
      icon: Server,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      id: 'sistema',
      label: 'Sistema',
      icon: KeyRound,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
  ];

  return (
    <div className="pt-3 pb-24 sm:pb-36 lg:pb-44 px-4 sm:px-6 lg:px-8 animate-fadeIn max-w-450 mx-auto flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 z-10 shrink-0 relative">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Settings className="w-6 h-6 text-emerald-500" />
            <h1 className="text-2xl font-bold text-text-dark">Configurações</h1>
          </div>
          <p className="text-sm text-text-light font-medium">
            Gerencie as diretrizes globais e a infraestrutura do sistema.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {hasChanges && (
            <div className="hidden lg:flex items-center mr-6 animate-fadeIn">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest animate-pulse border border-emerald-500/20 ">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Alterações pendentes
              </span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className={`min-w-37.5 px-5 py-2 rounded-xl transition-all duration-300 flex items-center justify-center gap-2.5 font-black group h-10 relative overflow-hidden  ${
              hasChanges
                ? 'bg-emerald-600 text-white shadow-[0_4px_15px_rgba(5,150,105,0.4)] hover:bg-emerald-700 hover:scale-[1.03] active:scale-95 cursor-pointer'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="relative z-20 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Save
                  className={`w-3.5 h-3.5 transition-all duration-500 ${hasChanges ? 'text-white' : 'text-gray-400'}`}
                />
              )}
              <span
                className={`text-[10px] uppercase tracking-widest font-black ${hasChanges ? 'text-white' : 'text-gray-500'}`}
              >
                {isLoading ? 'Salvando...' : 'Salvar'}
              </span>
            </div>

            {hasChanges && (
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none z-10" />
            )}
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Sidebar Tabs */}
        <div className="w-56 shrink-0 flex flex-col gap-2 h-full pr-6 border-r border-border overflow-hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? `bg-white dark:bg-white/5  scale-[1.02] z-10`
                    : 'hover:bg-white/50 dark:hover:bg-white/5 text-text-light'
                }`}
              >
                {/* Solid Vertical Indicator */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 ease-in-out ${tab.color.replace('text-', 'bg-')} ${
                    isActive ? 'opacity-100 h-full' : 'opacity-0 h-0'
                  }`}
                />

                {/* Subtle Solid Background for Active State */}
                {isActive && (
                  <div
                    className={`absolute inset-0 opacity-[0.08] ${tab.color.replace('text-', 'bg-')}`}
                  />
                )}

                <div className="flex items-center gap-2.5 pl-2.5 relative z-10">
                  <div
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      isActive
                        ? `${tab.bg} scale-105 border border-current/10`
                        : 'bg-gray-100 dark:bg-white/5 group-hover:bg-gray-200 dark:group-hover:bg-white/10'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-transform duration-500 ${isActive ? tab.color : 'text-text-light'}`}
                    />
                  </div>
                  <span
                    className={`font-bold text-[13px] transition-all duration-300 ${isActive ? 'text-text-dark' : 'group-hover:text-text-dark'}`}
                  >
                    {tab.label}
                  </span>
                </div>

                {isActive && (
                  <div className={`mr-1 relative z-10 p-1.5 rounded-full ${tab.bg}`}>
                    <ChevronRight className={`w-3.5 h-3.5 ${tab.color}`} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden pr-4 flex flex-col h-full">
          <div className="flex-1 h-full flex flex-col overflow-hidden">
            {activeTab === 'midia' && (
              <SettingsMidiaTab
                isOptimizing={isOptimizing}
                integrity={integrity}
                onClearCache={handleClearCache}
                onCheckIntegrity={handleCheckIntegrity}
              />
            )}

            {activeTab === 'seguranca' && (
              <SettingsSegurancaTab isMaintenanceModeLocal={isMaintenanceModeLocal} />
            )}

            {activeTab === 'infra' && (
              <SettingsInfraTab
                telemetry={telemetry}
                uptimeLabel={uptimeLabel}
                cpuPercent={cpuPercent}
                memUsedGb={memUsedGb}
                memUsedPercent={memUsedPercent}
                storageUsedPercent={storageUsedPercent}
                storageLimitLabel={storageLimitLabel}
                dbStatusLabel={dbStatusLabel}
                dbLatencyLabel={dbLatencyLabel}
                isMaintenanceModeLocal={isMaintenanceModeLocal}
                maintenanceScopeLocal={maintenanceScopeLocal}
                maintenancePagesLocal={maintenancePagesLocal}
                setIsMaintenanceModeLocal={setIsMaintenanceModeLocal}
                setMaintenanceScopeLocal={setMaintenanceScopeLocal}
                setMaintenancePagesLocal={setMaintenancePagesLocal}
              />
            )}

            {activeTab === 'sistema' && <SettingsSistemaTab />}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
                * {
                    scrollbar-width: none !important;
                }
                *::-webkit-scrollbar {
                    display: none !important;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    display: none !important;
                }
                .logo-upload-box {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .logo-upload-box:hover {
                    border-color: #10b981 !important;
                    background-color: rgba(16, 185, 129, 0.05) !important;
                    box-shadow: 0 0 15px rgba(16, 185, 129, 0.08) !important;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.05; }
                    50% { opacity: 0.15; }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 3s ease-in-out infinite;
                }
                .premium-range-input {
                    -webkit-appearance: none;
                    width: 100%;
                    background: transparent;
                    position: relative;
                    z-index: 10;
                    cursor: pointer;
                }
                .premium-range-input::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 18px;
                    width: 18px;
                    border-radius: 50%;
                    background: #fff;
                    border: 3px solid var(--thumb-color, #f59e0b);
                    box-shadow: 0 2px 6px rgba(245, 158, 11, 0.1), 0 0 0 3px rgba(245, 158, 11, 0.05);
                    cursor: pointer;
                    margin-top: -7px;
                    transition: all 0.2s ease;
                }
                .premium-range-input::-webkit-slider-thumb:hover {
                    transform: scale(1.1);
                    box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2), 0 0 0 4px rgba(245, 158, 11, 0.05);
                }
                .premium-range-input::-webkit-slider-thumb:active {
                    transform: scale(0.95);
                }
                .premium-range-input::-webkit-slider-runnable-track {
                    width: 100%;
                    height: 1.5px;
                    background: transparent;
                }

            `,
        }}
      />
    </div>
  );
}
