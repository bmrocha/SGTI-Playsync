import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MediaItem } from './store';

export interface PlaylistLink {
    id: string; // Unique short ID (e.g., "abc123")
    companyName: string;
    playlistName: string;
    items: MediaItem[]; // Store the actual playlist items
    createdAt: Date;
    lastAccessed?: Date;
    accessCount: number;
}

interface PlaylistLinkState {
    links: Record<string, PlaylistLink>; // Map ID to PlaylistLink (for tracking only)

    // Actions
    generateLink: (companyName: string, playlistName: string, items: MediaItem[]) => string;
    getLinkById: (id: string) => PlaylistLink | null;
    getLink: (companyName: string, playlistName: string) => PlaylistLink | null;
    trackAccess: (id: string) => void;
    deleteLink: (id: string) => void;
    getAllLinks: () => PlaylistLink[];
    updateLinkItems: (id: string, items: MediaItem[]) => void;
}

// Generate a short unique ID (8 characters)
function generateShortId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
        id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
}

// Encode playlist data to base64 for URL
export function encodePlaylistData(companyName: string, playlistName: string, items: MediaItem[]): string {
    const data = {
        companyName,
        playlistName,
        items,
    };
    const json = JSON.stringify(data);
    return btoa(encodeURIComponent(json));
}

// Decode playlist data from base64 URL
export function decodePlaylistData(encoded: string): { companyName: string; playlistName: string; items: MediaItem[] } | null {
    try {
        const json = decodeURIComponent(atob(encoded));
        return JSON.parse(json);
    } catch (error) {
        console.error('Error decoding playlist data:', error);
        return null;
    }
}

export const usePlaylistLinkStore = create<PlaylistLinkState>()(
    persist(
        (set, get) => ({
            links: {},

            generateLink: (companyName, playlistName, items) => {
                // Check if link already exists
                const existing = Object.values(get().links).find(
                    link => link.companyName === companyName && link.playlistName === playlistName
                );

                if (existing) {
                    // Update items in existing link
                    set((state) => ({
                        links: {
                            ...state.links,
                            [existing.id]: {
                                ...existing,
                                items, // Update with latest items
                            },
                        },
                    }));
                    return existing.id;
                }

                // Generate new unique ID
                let id = generateShortId();
                while (get().links[id]) {
                    id = generateShortId();
                }

                const newLink: PlaylistLink = {
                    id,
                    companyName,
                    playlistName,
                    items,
                    createdAt: new Date(),
                    accessCount: 0,
                };

                set((state) => ({
                    links: {
                        ...state.links,
                        [id]: newLink,
                    },
                }));

                return id;
            },

            getLinkById: (id) => {
                return get().links[id] || null;
            },

            getLink: (companyName, playlistName) => {
                return Object.values(get().links).find(
                    link => link.companyName === companyName && link.playlistName === playlistName
                ) || null;
            },

            trackAccess: (id) => {
                const link = get().links[id];
                if (!link) return;

                set((state) => ({
                    links: {
                        ...state.links,
                        [id]: {
                            ...link,
                            lastAccessed: new Date(),
                            accessCount: link.accessCount + 1,
                        },
                    },
                }));
            },

            updateLinkItems: (id, items) => {
                const link = get().links[id];
                if (!link) return;

                set((state) => ({
                    links: {
                        ...state.links,
                        [id]: {
                            ...link,
                            items,
                        },
                    },
                }));
            },

            deleteLink: (id) => {
                set((state) => {
                    const newLinks = { ...state.links };
                    delete newLinks[id];
                    return { links: newLinks };
                });
            },

            getAllLinks: () => {
                return Object.values(get().links);
            },
        }),
        {
            name: 'playsync-playlist-links',
        }
    )
);

// Helper to generate full URL with encoded data
export function getPlaylistUrl(companyName: string, playlistName: string, items: MediaItem[], baseUrl?: string): string {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    const encoded = encodePlaylistData(companyName, playlistName, items);
    return `${base}/player?data=${encoded}`;
}

// Helper to generate QR code data
export function getQRCodeData(companyName: string, playlistName: string, items: MediaItem[], baseUrl?: string): string {
    return getPlaylistUrl(companyName, playlistName, items, baseUrl);
}
