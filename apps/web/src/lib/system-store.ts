import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Session {
    id: string;
    device: string;
    os: string;
    ip: string;
    current: boolean;
    status?: 'online' | 'offline';
    last_seen?: string;
    user_name?: string;
    user_email?: string;
    created_at?: string;
}

interface WebhookEvent {
    id: string;
    event: string;
    status: 'success' | 'error';
    time: string;
}

interface SystemState {
    // Basic Settings
    isMaintenanceMode: boolean;
    maintenancePages: string[];
    maintenanceScope: 'site' | 'pages';
    maintenanceMessage: string;
    maintenanceEstimatedTime: string;
    maintenancePriority: string;
    systemName: string;
    logoSidebarUrl: string;
    logoLoginUrl: string;
    logoAuthUrl: string;
    faviconUrl: string;
    footerMessage: string;

    // Security Settings
    isBruteForceProtection: boolean;
    isTwoFactorEnforced: boolean;
    auditLogRetention: string;
    isPasswordComplexityEnforced: boolean;
    sessionLimit: string;
    restrictIP: string;
    trusted_ips: string;
    sessions: Session[];

    // SysAdmin settings
    webhookUrl: string;
    isDebugMode: boolean;
    isAutoClean: boolean;
    isAutoBackup: boolean;
    cleanDays: number;
    logLevel: 'info' | 'debug' | 'error';
    storageLimit: number;
    gatewayLatency: number;
    dbOps: number;
    webhookEvents: WebhookEvent[];

    // Media Settings
    autoPlayVideos: boolean;
    hardwareAccel: boolean;
    mediaCacheSize: number;
    isOfflineSyncEnabled: boolean;
    isAiUpscaling: boolean;
    isHdrEnabled: boolean;
    isAudioNormalized: boolean;
    isP2pEnabled: boolean;
    mediaQuality: 'speed' | 'balanced' | 'quality';
    uploadLimit: string;
    uploadLimitVideo: string;

    // Actions
    setMaintenanceMode: (active: boolean) => Promise<void>;
    setMaintenancePages: (pages: string[]) => Promise<void>;
    setMaintenanceScope: (scope: 'site' | 'pages') => Promise<void>;
    setTwoFactorEnforced: (enforced: boolean) => Promise<void>;
    setBruteForceProtection: (enabled: boolean) => Promise<void>;
    setSessionLimit: (limit: string) => Promise<void>;
    fetchSettings: () => Promise<void>;
    terminateSession: (id: string) => Promise<void>;
    addWebhookEvent: (event: Omit<WebhookEvent, 'id' | 'time'>) => void;
    updateMetrics: (gateway: number, db: number) => void;
    setField: (field: keyof SystemState, value: unknown) => void;
}

export const useSystemStore = create<SystemState>()(
    persist(
        (set) => ({
            isMaintenanceMode: false,
            maintenancePages: [],
            maintenanceScope: 'site' as const,
            maintenanceMessage: "",
            maintenanceEstimatedTime: "",
            maintenancePriority: "medium",
            systemName: "PlaySync",
            logoSidebarUrl: "",
            logoLoginUrl: "",
            logoAuthUrl: "",
            faviconUrl: "",
            footerMessage: "© 2026 PlaySync - Todos os direitos reservados",
            isBruteForceProtection: true,
            isTwoFactorEnforced: false,
            auditLogRetention: "90",
            isPasswordComplexityEnforced: true,
            sessionLimit: "60",
            restrictIP: "",
            trusted_ips: "",
            sessions: [],
            webhookUrl: "",
            isDebugMode: false,
            isAutoClean: true,
            isAutoBackup: true,
            cleanDays: 90,
            logLevel: 'info',
            storageLimit: 500,
            gatewayLatency: 12,
            dbOps: 8400,
            webhookEvents: [],

            // Media Settings Defaults
            autoPlayVideos: true,
            hardwareAccel: true,
            mediaCacheSize: 1024,
            isOfflineSyncEnabled: true,
            isAiUpscaling: false,
            isHdrEnabled: true,
            isAudioNormalized: true,
            isP2pEnabled: false,
            mediaQuality: 'balanced',
            uploadLimit: '500',
            uploadLimitVideo: '1024',

            setField: (field, value) => set((state) => ({ ...state, [field]: value })),

            fetchSettings: async () => {
                // Skip if not authenticated (prevents 401 spam on login page)
                if (!document.cookie.includes('auth_token=')) return;
                try {
                    const settingsRes = await fetch('/api/system/settings');
                    if (settingsRes.ok) {
                        const data = await settingsRes.json();
                        // Ignore sessions from settings API
                        const { sessions, ...settings } = data;
                        set((state) => ({ ...state, ...settings }));
                    }

                    const sessionsRes = await fetch('/api/system/sessions');
                    if (sessionsRes.ok) {
                        const data = await sessionsRes.json();
                        if (data.sessions) {
                            set({ sessions: data.sessions });
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch system settings:", error);
                }
            },

            setMaintenanceMode: async (active: boolean) => {
                set({ isMaintenanceMode: active });
                try {
                    await fetch('/api/system/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isMaintenanceMode: active }),
                    });
                } catch (error) {
                    console.error("Failed to sync maintenance mode:", error);
                }
            },

            setMaintenancePages: async (pages: string[]) => {
                set({ maintenancePages: pages });
                try {
                    await fetch('/api/system/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ maintenancePages: pages }),
                    });
                } catch (error) {
                    console.error("Failed to sync maintenance pages:", error);
                }
            },

            setMaintenanceScope: async (scope: 'site' | 'pages') => {
                set({ maintenanceScope: scope });
                try {
                    await fetch('/api/system/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ maintenanceScope: scope }),
                    });
                } catch (error) {
                    console.error("Failed to sync maintenance scope:", error);
                }
            },

            setTwoFactorEnforced: async (enforced: boolean) => {
                set({ isTwoFactorEnforced: enforced });
                try {
                    await fetch('/api/system/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isTwoFactorEnforced: enforced }),
                    });
                } catch (error) {
                    console.error("Failed to sync 2FA enforcement:", error);
                    // Revert on error?
                    set({ isTwoFactorEnforced: !enforced });
                }
            },

            setBruteForceProtection: async (enabled: boolean) => {
                set({ isBruteForceProtection: enabled });
                try {
                    await fetch('/api/system/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isBruteForceProtection: enabled }),
                    });
                } catch (error) {
                    console.error("Failed to sync brute force protection:", error);
                    set({ isBruteForceProtection: !enabled });
                }
            },

            setSessionLimit: async (limit: string) => {
                set({ sessionLimit: limit });
                try {
                    await fetch('/api/system/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionLimit: limit }),
                    });
                } catch (error) {
                    console.error("Failed to sync session limit:", error);
                }
            },

            terminateSession: async (id) => {
                try {
                    await fetch(`/api/system/sessions?id=${id}`, { method: 'DELETE' });
                    set((state) => ({
                        sessions: state.sessions.filter(s => s.id !== id)
                    }));
                } catch (error) {
                    console.error("Failed to terminate session:", error);
                }
            },

            addWebhookEvent: (event) => set((state) => ({
                webhookEvents: [
                    { ...event, id: Math.random().toString(36).substr(2, 9), time: 'Just now' },
                    ...state.webhookEvents.slice(0, 9)
                ]
            })),

            updateMetrics: (gateway, db) => set({ gatewayLatency: gateway, dbOps: db })
        }),
        {
            name: 'playsync-system-storage',
        }
    )
);
