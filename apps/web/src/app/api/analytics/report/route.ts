import { requireLicense } from '@/lib/license-service';
import { NextResponse } from 'next/server';
import { PlayerRepository, AnalyticsRepository } from '@playsync/database';
import type { CreatePlaybackLogDTO } from '@playsync/database';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

export async function POST(request: Request) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const body = await request.json();
        const authHeader = request.headers.get('Authorization');
        let token = authHeader?.replace('Bearer ', '');

        // Fallback: Check body for token (Agent V1 compatibility)
        if (!token && body.token) {
            token = body.token;
        }

        let player = null;
        if (token) {
            player = await PlayerRepository.findByToken(token);
            if (!player) {
                return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
            }
        } else if (!body.companyId) {
            // If no token AND no companyId, reject
            return NextResponse.json({ error: 'Missing authentication (token or companyId)' }, { status: 401 });
        }

        if (!body.logs || !Array.isArray(body.logs)) {
            return NextResponse.json({ error: 'Invalid logs format' }, { status: 400 });
        }

        const logs: CreatePlaybackLogDTO[] = body.logs.map((log: unknown) => {
            const record: Record<string, unknown> = (typeof log === 'object' && log !== null) ? (log as Record<string, unknown>) : {};

            const pickString = (keys: string[]): string | undefined => {
                for (const key of keys) {
                    const value = record[key];
                    if (typeof value === 'string' && value.trim() !== '') return value;
                }
                return undefined;
            };

            const pickNumber = (keys: string[]): number | undefined => {
                for (const key of keys) {
                    const value = record[key];
                    if (typeof value === 'number') return value;
                    if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
                }
                return undefined;
            };

            const playedAtValue = record.playedAt ?? record.played_at;

            return {
                player_id: player?.id || null,
                media_item_id: pickString(['mediaItemId', 'media_item_id']),
                playlist_id: pickString(['playlistId', 'playlist_id']),
                company_id: pickString(['companyId', 'company_id']) || player?.company_id || (typeof body.companyId === 'string' ? body.companyId : undefined),
                played_at: (typeof playedAtValue === 'string' || playedAtValue instanceof Date) ? playedAtValue : new Date().toISOString(),
                duration_played: pickNumber(['duration', 'duration_played']) ?? 0,
                error_message: pickString(['error', 'error_message'])
            };
        });

        await AnalyticsRepository.createMany(logs);

        if (player) {
            logServerAction({
                userId: player.id,
                userName: player.name,
                userRole: 'player',
                action: 'REPORT',
                resource: 'analytics',
                details: `${logs.length} logs de playback reportados`,
                metadata: { count: logs.length, playerId: player.id }
            });
        }

        return NextResponse.json({ success: true, count: logs.length });
    } catch (error) {
        logger.error({ err: error }, 'Error reporting analytics:');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
