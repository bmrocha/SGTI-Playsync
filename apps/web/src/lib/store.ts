import { create } from 'zustand';
import { LayoutType } from './layouts';
import { generateUUID } from './utils';

export type MediaType = 'image' | 'video' | 'youtube' | 'layout' | 'widget' | 'web';

interface ApiCompany {
    id: string;
    name: string;
    description: string;
    color: string;
}

interface ApiPlaylist {
    id: string;
    name: string;
    companies?: Array<{ id: string; name: string }>;
    items?: Array<{
        id: string;
        type: string;
        url: string;
        name: string;
        duration: number;
        rotation: number;
        layout?: string;
        zones?: string | Array<unknown>;
        layout_template_id?: string;
        layoutTemplateId?: string;
        region_config?: string | Record<string, unknown>;
        regionConfig?: Record<string, unknown>;
        schedule_start_date?: string;
        schedule_end_date?: string;
        schedule_start_time?: string;
        schedule_end_time?: string;
        schedule_days?: string | number[];
        schedule_all_day?: boolean;
        schedule_enabled?: boolean;
        schedule?: {
            startDate?: string;
            endDate?: string;
            startTime?: string;
            endTime?: string;
            daysOfWeek?: number[];
            allDay?: boolean;
            enabled?: boolean;
        };
    }>;
}

// ===== MEDIA ITEM =====
export interface MediaItem {
    id: string;
    type: MediaType;
    url: string;
    name: string;
    duration: number;
    rotation: number;
    layout?: LayoutType;
    zones?: ({
        id: string; // "zone-0", "zone-1"...
        type: MediaType;
        url: string;
        name: string;
        rotation?: number;
    } | null)[];
    layoutTemplateId?: string;
    regionConfig?: Record<string, unknown>;
    schedule: {
        startDate: string | null;
        endDate: string | null;
        startTime: string | null;
        endTime: string | null;
        allDay: boolean;
        daysOfWeek: number[];
        enabled: boolean;
    };
}

export interface Playlist {
    id: string;
    name: string;
    companyNames: string[]; // Linked Company Names (FK)
    companyIds: string[]; // Linked Company IDs
    items: MediaItem[];
}

export interface Company {
    id: string;
    name: string;
    description: string;
    color: string;
    playlists: Record<string, MediaItem[]>;
}

interface AppState {
    companies: Record<string, Company>; // Key: Company Name
    playlists: Record<string, Playlist>; // Key: Playlist ID
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchData: () => Promise<void>;
    addCompany: (name: string, description: string, color: string) => Promise<void>;
    updateCompany: (oldName: string, newName: string, description: string, color: string) => Promise<void>;
    removeCompany: (id: string) => Promise<void>;

    // Playlist Actions
    addPlaylist: (name: string, companyIds: string[]) => Promise<void>;
    updatePlaylist: (id: string, name: string, companyIds: string[]) => Promise<void>;
    removePlaylist: (id: string) => Promise<void>;
    updatePlaylistItems: (playlistId: string, items: MediaItem[]) => Promise<void>;

    // Media Actions - Now use Playlist ID
    addMediaItem: (playlistId: string, item: MediaItem) => Promise<void>;
    removeMediaItem: (playlistId: string, itemIndex: number) => Promise<void>;
    clearPlaylist: (playlistId: string) => Promise<void>;
    updateMediaItem: (playlistId: string, itemIndex: number, updates: Partial<MediaItem>) => Promise<void>;
    reorderMediaItems: (playlistId: string, startIndex: number, endIndex: number) => Promise<void>;
    duplicateMediaItem: (playlistId: string, itemIndex: number) => Promise<void>;

    // Computed
    getGlobalStats: () => { companies: number; playlists: number; photos: number; videos: number };
    getAllMediaFiles: () => (MediaItem & { playlistId: string; playlistName: string; companyNames: string[] })[];
}

export const useAppStore = create<AppState>((set, get) => ({
    companies: {},
    playlists: {},
    isLoading: false,
    error: null,

    fetchData: async () => {
        set({ isLoading: true, error: null });
        try {
            const [compRes, playRes] = await Promise.all([
                fetch('/api/companies'),
                fetch('/api/playlists')
            ]);
            
            if (!compRes.ok || !playRes.ok) throw new Error('Failed to fetch data');

            const { companies: apiCompanies } = await compRes.json();
            const { playlists: apiPlaylists } = await playRes.json();

            // Map to store structure
            const companies: Record<string, Company> = {};
            (apiCompanies as ApiCompany[]).forEach((c) => {
                companies[c.name] = {
                    id: c.id,
                    name: c.name,
                    description: c.description,
                    color: c.color,
                    playlists: {}
                };
            });

            const playlists: Record<string, Playlist> = {};
            (apiPlaylists as ApiPlaylist[]).forEach((p) => {
                const companyNames = p.companies?.map((c) => c.name) || [];
                const companyIds = p.companies?.map((c) => c.id) || [];
                
                // Map DB items to MediaItem interface
                const items = (p.items || []).map((item) => ({
                    id: item.id,
                    type: item.type as MediaType,
                    url: item.url,
                    name: item.name,
                    duration: item.duration,
                    rotation: item.rotation,
                    layout: item.layout as LayoutType | undefined,
                    zones: typeof item.zones === 'string' ? JSON.parse(item.zones) : item.zones,
                    layoutTemplateId: item.layout_template_id || item.layoutTemplateId,
                    regionConfig: typeof item.region_config === 'string' ? JSON.parse(item.region_config) : (item.region_config || item.regionConfig || {}),
                    // If DB item has schedule_ fields, map them
                    schedule: {
                        startDate: item.schedule_start_date || item.schedule?.startDate || null,
                        endDate: item.schedule_end_date || item.schedule?.endDate || null,
                        startTime: item.schedule_start_time || item.schedule?.startTime || null,
                        endTime: item.schedule_end_time || item.schedule?.endTime || null,
                        daysOfWeek: typeof item.schedule_days === 'string' ? JSON.parse(item.schedule_days) : (item.schedule_days || item.schedule?.daysOfWeek || []),
                        allDay: item.schedule_all_day ?? item.schedule?.allDay ?? true,
                        enabled: item.schedule_enabled ?? item.schedule?.enabled ?? true
                    }
                }));

                playlists[p.id] = {
                    ...p,
                    companyNames,
                    companyIds,
                    items
                };

                // Link to companies
                companyNames.forEach((name: string) => {
                    if (companies[name]) {
                        companies[name].playlists[p.id] = items;
                    }
                });
            });

            set({ companies, playlists, isLoading: false });
        } catch (error) {
            console.error(error);
            set({ error: 'Failed to load data', isLoading: false });
        }
    },

    addCompany: async (name, description, color) => {
        try {
            const res = await fetch('/api/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, color })
            });
            if (res.ok) await get().fetchData();
        } catch (error) {
            console.error('Error adding company:', error);
        }
    },

    updateCompany: async (oldName, newName, description, color) => {
        const company = get().companies[oldName];
        if (!company) return;

        try {
            const res = await fetch(`/api/companies/${company.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, description, color })
            });
            if (res.ok) await get().fetchData();
        } catch (error) {
            console.error('Error updating company:', error);
        }
    },

    removeCompany: async (id) => {
        try {
            const res = await fetch(`/api/companies/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) await get().fetchData();
        } catch (error) {
            console.error('Error removing company:', error);
        }
    },

    addPlaylist: async (name, companyIds) => {
        try {
            const res = await fetch('/api/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, companyIds }) // Assuming API accepts companyIds
            });
            if (res.ok) await get().fetchData();
        } catch (error) {
            console.error('Error adding playlist:', error);
        }
    },

    updatePlaylist: async (id, name, companyIds) => {
        try {
            const res = await fetch(`/api/playlists/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, companyIds })
            });
            if (res.ok) await get().fetchData();
        } catch (error) {
            console.error('Error updating playlist:', error);
        }
    },

    removePlaylist: async (id) => {
        try {
            const res = await fetch(`/api/playlists/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) await get().fetchData();
        } catch (error) {
            console.error('Error removing playlist:', error);
        }
    },

    updatePlaylistItems: async (playlistId, items) => {
        try {
            const res = await fetch(`/api/playlists/${playlistId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
            if (res.ok) await get().fetchData();
        } catch (error) {
            console.error('Error updating playlist items:', error);
        }
    },

    // Media Actions - Now use Playlist ID
    addMediaItem: async (playlistId, item) => {
        const playlist = get().playlists[playlistId];
        if (!playlist) return;
        const newItems = [...playlist.items, item];
        set(state => ({
            playlists: {
                ...state.playlists,
                [playlistId]: { ...playlist, items: newItems }
            }
        }));
        await get().updatePlaylistItems(playlistId, newItems);
    },

    removeMediaItem: async (playlistId, itemIndex) => {
        const playlist = get().playlists[playlistId];
        if (!playlist) return;
        const newItems = [...playlist.items];
        newItems.splice(itemIndex, 1);
        set(state => ({
            playlists: {
                ...state.playlists,
                [playlistId]: { ...playlist, items: newItems }
            }
        }));
        await get().updatePlaylistItems(playlistId, newItems);
    },

    clearPlaylist: async (playlistId) => {
        const playlist = get().playlists[playlistId];
        if (!playlist) return;
        set(state => ({
            playlists: {
                ...state.playlists,
                [playlistId]: { ...playlist, items: [] }
            }
        }));
        await get().updatePlaylistItems(playlistId, []);
    },

    updateMediaItem: async (playlistId, itemIndex, updates) => {
        const playlist = get().playlists[playlistId];
        if (!playlist) return;
        const newItems = [...playlist.items];
        newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
        set(state => ({
            playlists: {
                ...state.playlists,
                [playlistId]: { ...playlist, items: newItems }
            }
        }));
        await get().updatePlaylistItems(playlistId, newItems);
    },

    reorderMediaItems: async (playlistId, startIndex, endIndex) => {
        const playlist = get().playlists[playlistId];
        if (!playlist) return;
        const newItems = Array.from(playlist.items);
        const [removed] = newItems.splice(startIndex, 1);
        newItems.splice(endIndex, 0, removed);
        set(state => ({
            playlists: {
                ...state.playlists,
                [playlistId]: { ...playlist, items: newItems }
            }
        }));
        await get().updatePlaylistItems(playlistId, newItems);
    },

    duplicateMediaItem: async (playlistId, itemIndex) => {
        const playlist = get().playlists[playlistId];
        if (!playlist) return;
        const item = playlist.items[itemIndex];
        const newItem = { ...item, id: generateUUID(), name: `${item.name} (Copy)` };
        const newItems = [...playlist.items];
        newItems.splice(itemIndex + 1, 0, newItem);
        set(state => ({
            playlists: {
                ...state.playlists,
                [playlistId]: { ...playlist, items: newItems }
            }
        }));
        await get().updatePlaylistItems(playlistId, newItems);
    },




            getGlobalStats: () => {
                const state = get();
                const companies = Object.keys(state.companies).length;
                let playlists = 0;
                let photos = 0;
                let videos = 0;

                Object.values(state.playlists).forEach(pl => {
                    playlists++;
                    pl.items.forEach(item => {
                        if (item.type === 'image') photos++;
                        else videos++;
                    });
                });

                return { companies, playlists, photos, videos };
            },

            getAllMediaFiles: () => {
                const state = get();
                const files: (MediaItem & { playlistId: string; playlistName: string; companyNames: string[] })[] = [];
                Object.values(state.playlists).forEach(pl => {
                    pl.items.forEach(item => {
                        files.push({ ...item, playlistId: pl.id, playlistName: pl.name, companyNames: pl.companyNames });
                    });
                });
                return files;
            }
}));
