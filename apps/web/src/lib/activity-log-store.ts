import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils';
import { UserRole } from './permissions';

export type ActionType =
    | 'login'
    | 'logout'
    | 'failed_login'
    | 'user_created'
    | 'user_updated'
    | 'user_deleted'
    | 'role_changed'
    | 'company_created'
    | 'company_updated'
    | 'company_deleted'
    | 'playlist_created'
    | 'playlist_updated'
    | 'playlist_deleted'
    | 'media_uploaded'
    | 'media_deleted'
    | 'media_updated'
    | 'settings_changed'
    | 'export_performed';

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    userRole: UserRole;
    action: ActionType;
    resource: string; // 'user', 'playlist', 'media', etc.
    resourceId?: string;
    resourceName?: string;
    details: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
    ipAddress?: string;
}

interface ActivityLogState {
    logs: ActivityLog[];

    // Actions
    logAction: (
        userId: string,
        userName: string,
        userRole: UserRole,
        action: ActionType,
        resource: string,
        details: string,
        resourceId?: string,
        resourceName?: string,
        metadata?: Record<string, unknown>
    ) => void;

    getLogs: (filters?: {
        userId?: string;
        action?: ActionType;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
    }) => ActivityLog[];

    getRecentLogs: (limit?: number) => ActivityLog[];
    getUserLogs: (userId: string, limit?: number) => ActivityLog[];
    clearLogs: () => void;
    exportLogs: (logs: ActivityLog[]) => string; // Returns CSV string

    // Backend sync functions
    syncToBackend: (log: ActivityLog) => Promise<void>;
    fetchFromBackend: (filters?: {
        userId?: string;
        action?: ActionType;
        resource?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }) => Promise<{ logs: ActivityLog[]; total: number }>;
    cleanupOldLogs: () => Promise<{ deletedCount: number }>;
}

export const useActivityLogStore = create<ActivityLogState>()(
    persist(
        (set, get) => ({
            logs: [],

            logAction: (userId, userName, userRole, action, resource, details, resourceId, resourceName, metadata) => {
                const log: ActivityLog = {
                    id: generateUUID(),
                    userId,
                    userName,
                    userRole,
                    action,
                    resource,
                    resourceId,
                    resourceName,
                    details,
                    metadata,
                    timestamp: new Date(),
                };

                set((state) => ({
                    logs: [log, ...state.logs].slice(0, 1000), // Keep last 1000 logs
                }));

                // Auto-sync to backend (fire and forget)
                get().syncToBackend(log);
            },

            getLogs: (filters) => {
                let logs = get().logs;

                if (!filters) return logs;

                if (filters.userId) {
                    logs = logs.filter(log => log.userId === filters.userId);
                }

                if (filters.action) {
                    logs = logs.filter(log => log.action === filters.action);
                }

                if (filters.resource) {
                    logs = logs.filter(log => log.resource === filters.resource);
                }

                if (filters.startDate) {
                    logs = logs.filter(log => new Date(log.timestamp) >= filters.startDate!);
                }

                if (filters.endDate) {
                    logs = logs.filter(log => new Date(log.timestamp) <= filters.endDate!);
                }

                return logs;
            },

            getRecentLogs: (limit = 50) => {
                return get().logs.slice(0, limit);
            },

            getUserLogs: (userId, limit = 50) => {
                return get().logs
                    .filter(log => log.userId === userId)
                    .slice(0, limit);
            },

            clearLogs: () => {
                set({ logs: [] });
            },

            exportLogs: (logs) => {
                const headers = ['Data/Hora', 'Usuário', 'Função', 'Ação', 'Recurso', 'Detalhes'];
                const rows = logs.map(log => [
                    new Date(log.timestamp).toLocaleString('pt-BR'),
                    log.userName,
                    log.userRole,
                    log.action,
                    log.resource,
                    log.details,
                ]);

                const csv = [
                    headers.join(';'),
                    ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
                ].join('\n');

                return csv;
            },

            // Backend sync functions
            syncToBackend: async (log) => {
                try {
                    const response = await fetch('/api/audit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: log.userId,
                            userName: log.userName,
                            userRole: log.userRole,
                            action: log.action,
                            resource: log.resource,
                            resourceId: log.resourceId,
                            resourceName: log.resourceName,
                            details: log.details,
                            metadata: log.metadata,
                        }),
                    });

                    if (!response.ok) {
                        console.error('Failed to sync log to backend:', await response.text());
                    }
                } catch (error) {
                    console.error('Error syncing log to backend:', error);
                }
            },

            fetchFromBackend: async (filters) => {
                try {
                    const params = new URLSearchParams();

                    if (filters?.userId) params.append('userId', filters.userId);
                    if (filters?.action) params.append('action', filters.action);
                    if (filters?.resource) params.append('resource', filters.resource);
                    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
                    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
                    if (filters?.limit) params.append('limit', filters.limit.toString());
                    if (filters?.offset) params.append('offset', filters.offset.toString());

                    const response = await fetch(`/api/audit?${params.toString()}`);

                    if (!response.ok) {
                        throw new Error('Failed to fetch logs from backend');
                    }

                    const data = await response.json();

                    // Parse metadata from JSON strings
                    const logs = (data.logs as Array<Record<string, unknown>>).map((log) => ({
                        ...log,
                        timestamp: new Date(log.timestamp as string),
                        metadata: log.metadata ? JSON.parse(log.metadata as string) : undefined,
                    })) as ActivityLog[];

                    return { logs, total: data.total };
                } catch (error) {
                    console.error('Error fetching logs from backend:', error);
                    return { logs: [], total: 0 };
                }
            },

            cleanupOldLogs: async () => {
                try {
                    const response = await fetch('/api/audit/cleanup', {
                        method: 'DELETE',
                    });

                    if (!response.ok) {
                        throw new Error('Failed to cleanup old logs');
                    }

                    const data = await response.json();
                    return { deletedCount: data.deletedCount };
                } catch (error) {
                    console.error('Error cleaning up old logs:', error);
                    return { deletedCount: 0 };
                }
            },
        }),
        {
            name: 'playsync-activity-log',
        }
    )
);

// Helper functions for common actions
export const logLogin = (userId: string, userName: string, userRole: UserRole) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'login',
        'auth',
        `${userName} fez login no sistema`
    );
};

export const logLogout = (userId: string, userName: string, userRole: UserRole) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'logout',
        'auth',
        `${userName} saiu do sistema`
    );
};

export const logUserCreated = (adminId: string, adminName: string, adminRole: UserRole, newUserName: string, newUserRole: UserRole) => {
    useActivityLogStore.getState().logAction(
        adminId,
        adminName,
        adminRole,
        'user_created',
        'user',
        `Criou usuário ${newUserName} com função ${newUserRole}`,
        undefined,
        newUserName
    );
};

export const logUserDeleted = (adminId: string, adminName: string, adminRole: UserRole, deletedUserName: string) => {
    useActivityLogStore.getState().logAction(
        adminId,
        adminName,
        adminRole,
        'user_deleted',
        'user',
        `Excluiu usuário ${deletedUserName}`,
        undefined,
        deletedUserName
    );
};

// ========================================
// COMPANY HELPERS
// ========================================

export const logCompanyCreated = (userId: string, userName: string, userRole: UserRole, companyName: string, color: string) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'company_created',
        'company',
        `Criou empresa "${companyName}"`,
        undefined,
        companyName,
        { color }
    );
};

export const logCompanyUpdated = (userId: string, userName: string, userRole: UserRole, companyName: string, changes: Record<string, { old: unknown; new: unknown }>) => {
    const changeDetails = Object.entries(changes)
        .map(([field, { old, new: newVal }]) => `${field}: "${old}" → "${newVal}"`)
        .join(', ');

    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'company_updated',
        'company',
        `Editou empresa "${companyName}" (${changeDetails})`,
        undefined,
        companyName,
        { changes }
    );
};

export const logCompanyDeleted = (userId: string, userName: string, userRole: UserRole, companyName: string) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'company_deleted',
        'company',
        `Excluiu empresa "${companyName}"`,
        undefined,
        companyName
    );
};

// ========================================
// PLAYLIST HELPERS
// ========================================

export const logPlaylistCreated = (userId: string, userName: string, userRole: UserRole, playlistName: string, companyName?: string) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'playlist_created',
        'playlist',
        `Criou playlist "${playlistName}"${companyName ? ` na empresa "${companyName}"` : ''}`,
        undefined,
        playlistName,
        { companyName }
    );
};

export const logPlaylistUpdated = (userId: string, userName: string, userRole: UserRole, playlistName: string, changes: Record<string, { old: unknown; new: unknown }>) => {
    const changeDetails = Object.entries(changes)
        .map(([field, { old, new: newVal }]) => `${field}: "${old}" → "${newVal}"`)
        .join(', ');

    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'playlist_updated',
        'playlist',
        `Editou playlist "${playlistName}" (${changeDetails})`,
        undefined,
        playlistName,
        { changes }
    );
};

export const logPlaylistDeleted = (userId: string, userName: string, userRole: UserRole, playlistName: string) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'playlist_deleted',
        'playlist',
        `Excluiu playlist "${playlistName}"`,
        undefined,
        playlistName
    );
};

// ========================================
// MEDIA HELPERS
// ========================================

export const logMediaUploaded = (userId: string, userName: string, userRole: UserRole, fileName: string, playlistName: string) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'media_uploaded',
        'media',
        `Fez upload de "${fileName}" na playlist "${playlistName}"`,
        undefined,
        fileName,
        { playlistName }
    );
};

export const logMediaUpdated = (userId: string, userName: string, userRole: UserRole, fileName: string, changes: Record<string, { old: unknown; new: unknown }>) => {
    const changeDetails = Object.entries(changes)
        .map(([field, { old, new: newVal }]) => `${field}: "${old}" → "${newVal}"`)
        .join(', ');

    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'media_updated',
        'media',
        `Editou mídia "${fileName}" (${changeDetails})`,
        undefined,
        fileName,
        { changes }
    );
};

export const logMediaDeleted = (userId: string, userName: string, userRole: UserRole, fileName: string, playlistName: string) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'media_deleted',
        'media',
        `Excluiu mídia "${fileName}" da playlist "${playlistName}"`,
        undefined,
        fileName,
        { playlistName }
    );
};

// ========================================
// CONFIGURATION HELPERS
// ========================================

export const logScheduleChanged = (userId: string, userName: string, userRole: UserRole, mediaName: string, changes: Record<string, { old: unknown; new: unknown }>) => {
    const changeDetails = Object.entries(changes)
        .map(([field, { old, new: newVal }]) => `${field}: "${old}" → "${newVal}"`)
        .join(', ');

    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'settings_changed',
        'media',
        `Alterou agendamento de "${mediaName}" (${changeDetails})`,
        undefined,
        mediaName,
        { type: 'schedule', changes }
    );
};

export const logLayoutChanged = (userId: string, userName: string, userRole: UserRole, mediaName: string, oldLayout: string, newLayout: string) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'settings_changed',
        'media',
        `Alterou layout de "${mediaName}": "${oldLayout}" → "${newLayout}"`,
        undefined,
        mediaName,
        { type: 'layout', oldLayout, newLayout }
    );
};

export const logDurationChanged = (userId: string, userName: string, userRole: UserRole, mediaName: string, oldDuration: number, newDuration: number) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'settings_changed',
        'media',
        `Alterou duração de "${mediaName}": ${oldDuration}s → ${newDuration}s`,
        undefined,
        mediaName,
        { type: 'duration', oldDuration, newDuration }
    );
};

// ========================================
// TRASH HELPERS
// ========================================

export const logItemRestored = (userId: string, userName: string, userRole: UserRole, itemType: string, itemName: string) => {
    useActivityLogStore.getState().logAction(
        userId,
        userName,
        userRole,
        'settings_changed',
        itemType,
        `Restaurou ${itemType} "${itemName}" da lixeira`,
        undefined,
        itemName,
        { action: 'restore' }
    );
};
