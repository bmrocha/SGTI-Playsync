import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils';

// Redefine minimal interfaces to avoid circular dependencies
export interface MediaItem {
    id: string;
    type: 'image' | 'video' | 'youtube' | 'layout';
    name: string;
}

export interface Company {
    id: string;
    name: string;
}

export interface Playlist {
    id: string;
    name: string;
}

export type DeletedItemType = 'company' | 'playlist' | 'media';
export type HistoryAction = 'created' | 'updated' | 'deleted' | 'restored';

export interface DeletedItem {
    id: string;
    type: DeletedItemType;
    originalData: Company | MediaItem | { name: string; items: MediaItem[] };
    deletedAt: Date;
    deletedBy: string;
    deletedByName: string;
    companyName: string;
    playlistName?: string;
    reason?: string;
}

export interface HistoryEntry {
    id: string;
    action: HistoryAction;
    type: DeletedItemType;
    itemName: string;
    companyName: string;
    playlistName?: string;
    timestamp: Date;
    userId: string;
    userName: string;
    changes?: Record<string, unknown>;
}

export interface StorageStats {
    totalCompanies: number;
    totalPlaylists: number;
    totalMedia: number;
    deletedItems: number;
    historyEntries: number;
}

interface StorageState {
    deletedItems: DeletedItem[];
    history: HistoryEntry[];

    // Trash Actions
    moveToTrash: (
        item: Company | MediaItem | { name: string; items: MediaItem[] },
        type: DeletedItemType,
        userId: string,
        userName: string,
        companyName: string,
        playlistName?: string,
        reason?: string
    ) => void;

    restoreFromTrash: (itemId: string) => DeletedItem | null;
    permanentDelete: (itemId: string) => void;
    emptyTrash: () => void;

    // History Actions
    addHistoryEntry: (
        action: HistoryAction,
        type: DeletedItemType,
        itemName: string,
        userId: string,
        userName: string,
        companyName: string,
        playlistName?: string,
        changes?: Record<string, unknown>
    ) => void;

    // Getters
    getTrashItems: (filters?: {
        type?: DeletedItemType;
        companyName?: string;
        startDate?: Date;
        endDate?: Date;
    }) => DeletedItem[];

    getHistory: (filters?: {
        action?: HistoryAction;
        type?: DeletedItemType;
        companyName?: string;
        userId?: string;
        startDate?: Date;
        endDate?: Date;
    }) => HistoryEntry[];

    getStats: () => StorageStats;

    // Auto-cleanup (items older than 30 days)
    cleanupOldItems: () => void;
}

export const useStorageStore = create<StorageState>()(
    persist(
        (set, get) => ({
            deletedItems: [],
            history: [],

            moveToTrash: (item, type, userId, userName, companyName, playlistName, reason) => {
                const deletedItem: DeletedItem = {
                    id: generateUUID(),
                    type,
                    originalData: item,
                    deletedAt: new Date(),
                    deletedBy: userId,
                    deletedByName: userName,
                    companyName,
                    playlistName,
                    reason,
                };

                set((state) => ({
                    deletedItems: [deletedItem, ...state.deletedItems],
                }));

                // Add to history
                const itemName = type === 'company'
                    ? (item as Company).name
                    : type === 'playlist'
                        ? playlistName || 'Unknown'
                        : (item as MediaItem).name;

                get().addHistoryEntry(
                    'deleted',
                    type,
                    itemName,
                    userId,
                    userName,
                    companyName,
                    playlistName
                );
            },

            restoreFromTrash: (itemId) => {
                const item = get().deletedItems.find(i => i.id === itemId);
                if (!item) return null;

                set((state) => ({
                    deletedItems: state.deletedItems.filter(i => i.id !== itemId),
                }));

                // Add to history
                const itemName = item.type === 'company'
                    ? (item.originalData as Company).name
                    : item.type === 'playlist'
                        ? item.playlistName || 'Unknown'
                        : (item.originalData as MediaItem).name;

                get().addHistoryEntry(
                    'restored',
                    item.type,
                    itemName,
                    item.deletedBy,
                    item.deletedByName,
                    item.companyName,
                    item.playlistName
                );

                return item;
            },

            permanentDelete: (itemId) => {
                set((state) => ({
                    deletedItems: state.deletedItems.filter(i => i.id !== itemId),
                }));
            },

            emptyTrash: () => {
                set({ deletedItems: [] });
            },

            addHistoryEntry: (action, type, itemName, userId, userName, companyName, playlistName, changes) => {
                const entry: HistoryEntry = {
                    id: generateUUID(),
                    action,
                    type,
                    itemName,
                    companyName,
                    playlistName,
                    timestamp: new Date(),
                    userId,
                    userName,
                    changes,
                };

                set((state) => ({
                    history: [entry, ...state.history].slice(0, 1000), // Keep last 1000 entries
                }));
            },

            getTrashItems: (filters) => {
                let items = get().deletedItems;

                if (!filters) return items;

                if (filters.type) {
                    items = items.filter(item => item.type === filters.type);
                }

                if (filters.companyName) {
                    items = items.filter(item => item.companyName === filters.companyName);
                }

                if (filters.startDate) {
                    items = items.filter(item => new Date(item.deletedAt) >= filters.startDate!);
                }

                if (filters.endDate) {
                    items = items.filter(item => new Date(item.deletedAt) <= filters.endDate!);
                }

                return items;
            },

            getHistory: (filters) => {
                let entries = get().history;

                if (!filters) return entries;

                if (filters.action) {
                    entries = entries.filter(entry => entry.action === filters.action);
                }

                if (filters.type) {
                    entries = entries.filter(entry => entry.type === filters.type);
                }

                if (filters.companyName) {
                    entries = entries.filter(entry => entry.companyName === filters.companyName);
                }

                if (filters.userId) {
                    entries = entries.filter(entry => entry.userId === filters.userId);
                }

                if (filters.startDate) {
                    entries = entries.filter(entry => new Date(entry.timestamp) >= filters.startDate!);
                }

                if (filters.endDate) {
                    entries = entries.filter(entry => new Date(entry.timestamp) <= filters.endDate!);
                }

                return entries;
            },

            getStats: () => {
                const state = get();
                return {
                    totalCompanies: 0, // Will be calculated from main store
                    totalPlaylists: 0, // Will be calculated from main store
                    totalMedia: 0, // Will be calculated from main store
                    deletedItems: state.deletedItems.length,
                    historyEntries: state.history.length,
                };
            },

            cleanupOldItems: () => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                set((state) => ({
                    deletedItems: state.deletedItems.filter(
                        item => new Date(item.deletedAt) > thirtyDaysAgo
                    ),
                }));
            },
        }),
        {
            name: 'playsync-trash',
        }
    )
);

// Helper functions
export const getItemTypeName = (type: DeletedItemType): string => {
    const names = {
        company: 'Empresa',
        playlist: 'Playlist',
        media: 'Mídia',
    };
    return names[type];
};

export const getActionName = (action: HistoryAction): string => {
    const names = {
        created: 'Criado',
        updated: 'Atualizado',
        deleted: 'Excluído',
        restored: 'Restaurado',
    };
    return names[action];
};

export const getActionColor = (action: HistoryAction): string => {
    const colors = {
        created: 'text-green-500',
        updated: 'text-blue-500',
        deleted: 'text-red-500',
        restored: 'text-yellow-500',
    };
    return colors[action];
};

export const getActionIcon = (action: HistoryAction): string => {
    const icons = {
        created: '➕',
        updated: '✏️',
        deleted: '🗑️',
        restored: '↩️',
    };
    return icons[action];
};
