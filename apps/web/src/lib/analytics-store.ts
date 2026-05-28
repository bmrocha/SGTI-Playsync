import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateUUID } from '@/lib/utils';

export interface MediaAnalytics {
    mediaId: string;
    mediaName: string;
    playCount: number;
    totalDuration: number;
    lastPlayed: Date | null;
    companyName: string;
    playlistName: string;
}

export interface PlaylistAnalytics {
    playlistName: string;
    companyName: string;
    totalPlays: number;
    totalDuration: number;
    lastUsed: Date | null;
}

export interface PlayEvent {
    id: string;
    mediaId: string;
    mediaName: string;
    duration: number;
    timestamp: string; // ISO String
    companyName: string;
    playlistName: string;
}

export interface DateRange {
    start: Date | null; // null means "from beginning"
    end: Date | null;   // null means "until now"
    label: 'hoje' | 'semana' | 'mes' | 'total' | 'custom';
}

interface AnalyticsState {
    mediaAnalytics: Record<string, MediaAnalytics>; // All-time aggregates (Legacy/Fast)
    playlistAnalytics: Record<string, PlaylistAnalytics>; // All-time aggregates
    playHistory: PlayEvent[]; // Detailed history for filtering
    isLoading: boolean;
    error: string | null;

    dateRange: DateRange;

    // Actions
    setDateRange: (range: DateRange) => void;
    trackMediaPlay: (
        mediaId: string, 
        mediaName: string, 
        duration: number, 
        companyName: string, 
        playlistName: string,
        companyId?: string,
        playlistId?: string
    ) => void;
    trackPlaylistUse: (companyName: string, playlistName: string) => void;
    fetchAnalytics: (startDate?: Date, endDate?: Date) => Promise<void>;

    // Getters have to be methods to access state
    getFilteredStats: () => {
        topMedia: MediaAnalytics[];
        totalPlays: number;
        totalDuration: number;
        playsByDay: { date: string; count: number }[];
        distributionByType: { type: string; count: number }[];
        filteredEvents: PlayEvent[];
    };

    // Legacy getters (All time)
    // Legacy getters (All time)
    getMediaStats: (mediaId: string) => MediaAnalytics | null;
    getTopMedia: (limit?: number) => MediaAnalytics[];
    getTopPlaylists: (limit?: number) => PlaylistAnalytics[];
    getCompanyStats: (companyName: string) => {
        totalPlays: number;
        totalDuration: number;
        mediaCount: number;
    };
    clearAnalytics: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>()(
    persist(
        (set, get) => ({
            mediaAnalytics: {},
            playlistAnalytics: {},
            playHistory: [],
            isLoading: false,
            error: null,
            dateRange: { start: null, end: null, label: 'total' },

            setDateRange: (range) => {
                set({ dateRange: range });
                get().fetchAnalytics(range.start || undefined, range.end || undefined);
            },

            fetchAnalytics: async (startDate, endDate) => {
                set({ isLoading: true, error: null });
                try {
                    const params = new URLSearchParams();
                    // If dates are provided, use them. Otherwise use store's dateRange if available
                    const state = get();
                    const start = startDate || state.dateRange.start;
                    const end = endDate || state.dateRange.end;

                    if (start) params.append('startDate', start.toISOString());
                    if (end) params.append('endDate', end.toISOString());

                    const response = await fetch(`/api/analytics/data?${params.toString()}`);
                    
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMsg = errorData.details || errorData.error || `Error ${response.status}: Failed to fetch analytics`;
                        throw new Error(errorMsg);
                    }

                    const logs = await response.json();

                    // Map backend logs to PlayEvent format
                    const events: PlayEvent[] = logs.map((log: any) => ({
                        id: log.id,
                        mediaId: log.media_item_id || 'unknown',
                        mediaName: log.media_name || 'Mídia Desconhecida', // Fallback for missing joins
                        duration: log.duration_played || 0,
                        timestamp: log.played_at, // ISO string from JSON
                        companyName: log.company_name || 'Empresa Desconhecida',
                        playlistName: log.playlist_name || 'Playlist Desconhecida'
                    }));

                    set({ playHistory: events, isLoading: false });
                } catch (error) {
                    console.error('Error fetching analytics:', error);
                    set({ error: (error as Error).message, isLoading: false });
                }
            },

            trackMediaPlay: (mediaId, mediaName, duration, companyName, playlistName, companyId, playlistId) => {
                const now = new Date();
                
                // Send to backend if IDs are present (Web Player / Preview)
                if (companyId && playlistId && typeof window !== 'undefined') {
                    const tempId = localStorage.getItem('web_player_id') || `web-${Date.now()}`;
                    if (!localStorage.getItem('web_player_id')) {
                        localStorage.setItem('web_player_id', tempId);
                    }

                    fetch('/api/analytics/report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            companyId: companyId, // Explicitly pass context for authentication
                            playlistId: playlistId,
                            tempId: tempId,
                            logs: [{
                                mediaItemId: mediaId,
                                playlistId: playlistId,
                                companyId: companyId,
                                playedAt: now.toISOString(),
                                duration: duration,
                                tempId: tempId
                            }]
                        })
                    }).catch(err => console.error('Failed to send analytics', err));
                }

                set((state) => {
                    const existing = state.mediaAnalytics[mediaId];
                    const now = new Date();

                    // Add new event to history
                    const newEvent: PlayEvent = {
                        id: generateUUID(),
                        mediaId,
                        mediaName,
                        duration,
                        timestamp: now.toISOString(),
                        companyName,
                        playlistName
                    };

                    return {
                        mediaAnalytics: {
                            ...state.mediaAnalytics,
                            [mediaId]: {
                                mediaId,
                                mediaName,
                                playCount: (existing?.playCount || 0) + 1,
                                totalDuration: (existing?.totalDuration || 0) + duration,
                                lastPlayed: now,
                                companyName,
                                playlistName,
                            },
                        },
                        playHistory: [...(state.playHistory || []), newEvent]
                    };
                });
            },

            trackPlaylistUse: (companyName, playlistName) => {
                const key = `${companyName}-${playlistName}`;
                set((state) => {
                    const existing = state.playlistAnalytics[key];
                    return {
                        playlistAnalytics: {
                            ...state.playlistAnalytics,
                            [key]: {
                                playlistName,
                                companyName,
                                totalPlays: (existing?.totalPlays || 0) + 1,
                                totalDuration: 0,
                                lastUsed: new Date(),
                            },
                        },
                    };
                });
            },

            getFilteredStats: () => {
                const state = get();
                const { start, end } = state.dateRange;
                let events = state.playHistory || [];

                // Filter by date range
                if (start || end) {
                    events = events.filter(e => {
                        const date = new Date(e.timestamp);
                        if (start && date < start) return false;
                        if (end && date > end) return false;
                        return true;
                    });
                }

                // Aggregate filtered events
                const aggMap = new Map<string, MediaAnalytics>();
                let totalPlays = 0;
                let totalDuration = 0;
                const playsByDayMap = new Map<string, number>();

                events.forEach(e => {
                    totalPlays++;
                    totalDuration += e.duration;

                    // Media Aggregation
                    if (!aggMap.has(e.mediaId)) {
                        aggMap.set(e.mediaId, {
                            mediaId: e.mediaId,
                            mediaName: e.mediaName,
                            playCount: 0,
                            totalDuration: 0,
                            lastPlayed: new Date(e.timestamp),
                            companyName: e.companyName,
                            playlistName: e.playlistName
                        });
                    }
                    const stat = aggMap.get(e.mediaId)!;
                    stat.playCount++;
                    stat.totalDuration += e.duration;
                    if (new Date(e.timestamp) > (stat.lastPlayed || new Date(0))) {
                        stat.lastPlayed = new Date(e.timestamp);
                    }

                    // Daily Aggregation
                    const dayKey = new Date(e.timestamp).toLocaleDateString('pt-BR');
                    playsByDayMap.set(dayKey, (playsByDayMap.get(dayKey) || 0) + 1);
                });

                // Sort Top Media
                const topMedia = Array.from(aggMap.values())
                    .sort((a, b) => b.playCount - a.playCount)
                    .slice(0, 10);

                // Format Daily Stats
                const playsByDay = Array.from(playsByDayMap.entries())
                    .map(([date, count]) => ({ date, count }))
                    .sort((a, b) => {
                        const [da, ma, ya] = a.date.split('/').map(Number);
                        const [db, mb, yb] = b.date.split('/').map(Number);
                        return new Date(ya, ma - 1, da).getTime() - new Date(yb, mb - 1, db).getTime();
                    });

                return {
                    topMedia,
                    totalPlays,
                    totalDuration,
                    playsByDay,
                    distributionByType: [], // Placeholder
                    filteredEvents: events
                };
            },

            getMediaStats: (mediaId) => {
                return get().mediaAnalytics[mediaId] || null;
            },

            getTopMedia: (limit = 10) => {
                // Fallback to mediaAnalytics (all-time) if no date range, or use getFilteredStats?
                // Keeping original API signature for compatibility, but implemented using mediaAnalytics
                const analytics = Object.values(get().mediaAnalytics);
                return analytics
                    .sort((a, b) => b.playCount - a.playCount)
                    .slice(0, limit);
            },

            getTopPlaylists: (limit = 10) => {
                const analytics = Object.values(get().playlistAnalytics);
                return analytics
                    .sort((a, b) => b.totalPlays - a.totalPlays)
                    .slice(0, limit);
            },

            getCompanyStats: (companyName) => {
                const mediaAnalytics = Object.values(get().mediaAnalytics).filter(
                    (m) => m.companyName === companyName
                );

                return {
                    totalPlays: mediaAnalytics.reduce((sum, m) => sum + m.playCount, 0),
                    totalDuration: mediaAnalytics.reduce((sum, m) => sum + m.totalDuration, 0),
                    mediaCount: mediaAnalytics.length,
                };
            },

            clearAnalytics: () => {
                set({ mediaAnalytics: {}, playlistAnalytics: {}, playHistory: [] });
            },
        }),
        {
            name: 'playsync-analytics',
        }
    )
);
