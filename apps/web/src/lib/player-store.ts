import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils';

export interface PlayerMetrics {
    cpu: number;
    mem: number;
    disk: number;
    temperature?: number;
    uptime: number;
    display?: {
        width: number;
        height: number;
    };
    latency?: number; // ms
}

export interface Player {
    id: string;      // "dev_XXXX"
    name: string;
    token: string;   // Generated on creation
    status: 'online' | 'offline';
    lastSeen: string | null; // ISO Date
    metrics?: PlayerMetrics;
    version?: {
        agent: string;
        player: string;
    };
    ip?: string; // Captured from heartbeat

    // User defined fields
    companyId: string;
    location: string;
    credentials?: {
        ip: string; // Static/Management IP
        username: string;
        password?: string;
        sshKey?: string;
    };
    attachedFiles?: string[]; // Names of attached files

    currentPlaylistId?: string; // Assigned content
}

interface PlayerState {
    players: Record<string, Player>; // Map id -> Player
    _hasHydrated: boolean;

    // Actions
    addPlayer: (data: { name: string, companyId: string, location: string, credentials?: { ip: string, username: string, password?: string, sshKey?: string }, files?: string[], id?: string, token?: string }) => Player;
    removePlayer: (id: string) => void;
    updateHeartbeat: (id: string, data: Partial<Player>) => void;
    assignPlaylist: (playerId: string, playlistId: string) => void;
    updatePlayer: (id: string, updates: Partial<Player>) => void;
    getPlayer: (id: string) => Player | undefined;
    fetchPlayers: () => Promise<void>;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set, get) => ({
            _hasHydrated: false,
            players: {},

            fetchPlayers: async () => {
                try {
                    const res = await fetch('/api/agent/heartbeat'); // GET returns all players
                    if (res.ok) {
                        const data = await res.json();
                        console.log("📥 Players Fetch Debug:", data); // DEBUG
                        set({ players: data });
                    }
                } catch (error) {
                    console.error("Failed to fetch players", error);
                }
            },

            addPlayer: (data) => {
                const id = data.id || `dev_${Math.random().toString(36).substring(2, 6)}`;
                const token = data.token || btoa(`${id}:${generateUUID()}`); // Simple token generation
                const newPlayer: Player = {
                    id,
                    name: data.name,
                    token,
                    status: 'offline',
                    lastSeen: null,
                    companyId: data.companyId,
                    location: data.location,
                    credentials: data.credentials,
                    attachedFiles: data.files || []
                };

                set((state) => ({
                    players: { ...state.players, [id]: newPlayer }
                }));

                // Optimistically update, but should also persist to server if this was a UI creation
                // Ideally addPlayer should also POST to /api/players
                // But keeping existing logic for now.

                return newPlayer;
            },

            removePlayer: (id) => set((state) => {
                const { [id]: _, ...rest } = state.players;
                return { players: rest };
            }),

            updateHeartbeat: (id, data) => set((state) => {
                const player = state.players[id];
                if (!player) return state;

                return {
                    players: {
                        ...state.players,
                        [id]: {
                            ...player,
                            status: 'online',
                            lastSeen: new Date().toISOString(),
                            ...data
                        }
                    }
                };
            }),

            assignPlaylist: (playerId, playlistId) => set((state) => {
                const player = state.players[playerId];
                if (!player) return state;

                return {
                    players: {
                        ...state.players,
                        [playerId]: { ...player, currentPlaylistId: playlistId }
                    }
                };
            }),

            updatePlayer: (id, updates) => set((state) => {
                const player = state.players[id];
                if (!player) return state;

                return {
                    players: {
                        ...state.players,
                        [id]: { ...player, ...updates }
                    }
                };
            }),

            getPlayer: (id) => get().players[id]
        }),
        {
            name: 'playsync-player-storage',
            partialize: (state) => ({
                players: Object.fromEntries(
                    Object.entries(state.players).map(([id, player]) => [
                        id,
                        {
                            id: player.id,
                            name: player.name,
                            status: player.status,
                            lastSeen: player.lastSeen,
                            companyId: player.companyId,
                            location: player.location,
                            currentPlaylistId: player.currentPlaylistId,
                            version: player.version,
                            attachedFiles: player.attachedFiles,
                            metrics: player.metrics,
                        }
                    ])
                )
            }),
            onRehydrateStorage: () => (state) => {
                if (state) state._hasHydrated = true;
                state?.fetchPlayers();
            }
        }
    )
);
