import { query } from '@playsync/database';
import { logger } from '@/lib/logger';

export interface SystemSettings {
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
    webhookUrl: string;
    sessionLimit: string;
    uploadLimit: string;
    uploadLimitVideo: string;
    isAutoBackup: boolean;
    isAutoClean: boolean;
    cleanDays: number;
    restrictIP: string;
    trusted_ips: string;
    mediaQuality: string;
    autoPlayVideos: boolean;
    isBruteForceProtection: boolean;
    isTwoFactorEnforced: boolean;
    auditLogRetention: string;
    isPasswordComplexityEnforced: boolean;
    isDebugMode: boolean;
    logLevel: "info" | "debug" | "error";
    storageLimit: number;
    // New Media Settings
    mediaCacheSize: number;
    hardwareAccel: boolean;
    isAiUpscaling: boolean;
    isHdrEnabled: boolean;
    isAudioNormalized: boolean;
    isP2pEnabled: boolean;
    isOfflineSyncEnabled: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
    isMaintenanceMode: false,
    maintenancePages: [],
    maintenanceScope: 'site' as const,
    maintenanceMessage: "Estamos realizando melhorias técnicas para garantir o melhor desempenho do seu reprodutor. Voltaremos em breve com novidades!",
    maintenanceEstimatedTime: "Poucos minutos",
    maintenancePriority: "Alta Performance",
    systemName: "PlaySync",
    logoSidebarUrl: "",
    logoLoginUrl: "",
    logoAuthUrl: "",
    faviconUrl: "",
    footerMessage: `© ${new Date().getFullYear()} PlaySync - Todos os direitos reservados`,
    webhookUrl: "",
    sessionLimit: "60",
    uploadLimit: "500",
    uploadLimitVideo: "1024",
    isAutoBackup: true,
    isAutoClean: true,
    cleanDays: 90,
    restrictIP: "",
    trusted_ips: "",
    mediaQuality: "1080p",
    autoPlayVideos: true,
    isBruteForceProtection: true,
    isTwoFactorEnforced: false,
    auditLogRetention: "90",
    isPasswordComplexityEnforced: true,
    isDebugMode: false,
    logLevel: "info",
    storageLimit: 500,
    // New Media Defaults
    mediaCacheSize: 1024,
    hardwareAccel: true,
    isAiUpscaling: false,
    isHdrEnabled: true,
    isAudioNormalized: true,
    isP2pEnabled: false,
    isOfflineSyncEnabled: true
};

let didWarnDbUnavailable = false;

// In-memory cache com TTL de 30s — evita SELECT * em toda requisicao
let cachedSettings: SystemSettings | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30_000;

function isCacheValid(): boolean {
    return cachedSettings !== null && (Date.now() - cacheTimestamp) < CACHE_TTL_MS;
}

function setCache(settings: SystemSettings): void {
    cachedSettings = settings;
    cacheTimestamp = Date.now();
}

export function clearCache(): void {
    cachedSettings = null;
    cacheTimestamp = 0;
}

const ensureSystemSettingsTable = async () => {
    await query(`
        CREATE TABLE IF NOT EXISTS system_settings (
            key VARCHAR(255) PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);
};

export async function getSystemSettings(): Promise<SystemSettings> {
    if (!process.env.DATABASE_URL) {
        return DEFAULT_SETTINGS;
    }

    if (isCacheValid()) {
        return cachedSettings!;
    }

    try {
        try {
            await ensureSystemSettingsTable();
        } catch {
        }

        const res = await query('SELECT key, value FROM system_settings');
        
        // If empty, initialize with defaults
        if (res.rowCount === 0) {
            const entries = Object.entries(DEFAULT_SETTINGS);
            for (const [key, value] of entries) {
                await query(
                    'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
                    [key, JSON.stringify(value)]
                );
            }
            setCache(DEFAULT_SETTINGS);
            return DEFAULT_SETTINGS;
        }

        const settings: Record<string, unknown> = { ...DEFAULT_SETTINGS };
        
        for (const row of res.rows) {
            try {
                // Parse JSON value
                settings[row.key] = JSON.parse(row.value);
            } catch (e) {
                logger.error({ err: e }, `Error parsing setting ${row.key}:`);
                // Fallback to default if parsing fails
            }
        }

        const result = settings as unknown as SystemSettings;
        setCache(result);
        return result;
    } catch (error) {
        if (!didWarnDbUnavailable) {
            didWarnDbUnavailable = true;
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`Aviso: não foi possível ler system_settings do banco. Usando padrões. (${msg})`);
        }
        return DEFAULT_SETTINGS;
    }
}

export async function saveSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    try {
        // Get current settings to merge
        const current = await getSystemSettings();
        const updated = { ...current, ...settings };

        // Save updated fields
        const entries = Object.entries(settings);
        for (const [key, value] of entries) {
            await query(
                'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
                [key, JSON.stringify(value)]
            );
        }

        clearCache(); // Invalidate cache after write

        return updated;
    } catch (error) {
        logger.error({ err: error }, "Error saving system settings to DB:");
        throw error;
    }
}
