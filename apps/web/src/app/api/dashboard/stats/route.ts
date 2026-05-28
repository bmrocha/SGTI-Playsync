import { requireLicense } from '@/lib/license-service';
import { NextResponse } from 'next/server';
import { pool } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { UserRole } from '@/lib/permissions';
import { getSystemSettings } from '@/lib/system-settings';
import { logger } from '@/lib/logger';

export async function GET() {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const isAdmin = currentUser.role === UserRole.ADMIN;
        const companyId = currentUser.companyId || null;

        const [
            companiesResult,
            playlistsResult,
            mediaStatsResult,
            screensResult,
            onlineScreensResult,
            settings,
            storageRes
        ] = await Promise.all([
            isAdmin
                ? pool.query('SELECT COUNT(*) FROM companies')
                : Promise.resolve({ rows: [{ count: companyId ? '1' : '0' }] } as any),

            isAdmin
                ? pool.query('SELECT COUNT(*) FROM playlists')
                : (
                    companyId
                        ? pool.query('SELECT COUNT(DISTINCT playlist_id) FROM company_playlists WHERE company_id = $1', [companyId])
                        : Promise.resolve({ rows: [{ count: '0' }] } as any)
                ),

            isAdmin
                ? pool.query(`
                    SELECT 
                        type, 
                        COUNT(*) as count,
                        SUM(duration) as total_duration
                    FROM media_items 
                    GROUP BY type
                `)
                : (
                    companyId
                        ? pool.query(`
                            SELECT 
                                mi.type,
                                COUNT(*) as count,
                                SUM(mi.duration) as total_duration
                            FROM company_playlists cp
                            JOIN media_items mi ON mi.playlist_id = cp.playlist_id
                            WHERE cp.company_id = $1
                            GROUP BY mi.type
                        `, [companyId])
                        : Promise.resolve({ rows: [] as any[] })
                ),

            isAdmin
                ? pool.query('SELECT COUNT(*) FROM players')
                : (
                    companyId
                        ? pool.query('SELECT COUNT(*) FROM players WHERE company_id = $1', [companyId])
                        : Promise.resolve({ rows: [{ count: '0' }] } as any)
                ),

            isAdmin
                ? pool.query(`SELECT COUNT(*) FROM players WHERE status = 'online' AND last_seen > NOW() - INTERVAL '30 seconds'`)
                : (
                    companyId
                        ? pool.query(`SELECT COUNT(*) FROM players WHERE company_id = $1 AND status = 'online' AND last_seen > NOW() - INTERVAL '30 seconds'`, [companyId])
                        : Promise.resolve({ rows: [{ count: '0' }] } as any)
                ),

            getSystemSettings(),

            pool.query(`
                SELECT 
                    COALESCE(SUM(size), 0)::bigint as total,
                    COALESCE(SUM(CASE WHEN mime_type LIKE 'video/%' THEN size ELSE 0 END), 0)::bigint as video,
                    COALESCE(SUM(CASE WHEN mime_type LIKE 'image/%' THEN size ELSE 0 END), 0)::bigint as image
                FROM media_library
            `),
        ]);

        const companiesCount = parseInt(companiesResult.rows[0].count);
        const playlistsCount = parseInt(playlistsResult.rows[0].count);
        const screensCount = parseInt(screensResult.rows[0].count);
        const onlineScreensCount = parseInt(onlineScreensResult.rows[0].count);

        let videosCount = 0;
        let photosCount = 0;
        let totalDuration = 0;

        mediaStatsResult.rows.forEach((row: any) => {
            const count = parseInt(row.count);
            const duration = parseInt(row.total_duration || '0');

            if (row.type === 'video') {
                videosCount += count;
            } else if (row.type === 'image') {
                photosCount += count;
            }

            totalDuration += duration;
        });

        let storageUsedBytes = 0;
        let storageUsedVideoBytes = 0;
        let storageUsedImageBytes = 0;
        try {
            storageUsedBytes = Number(storageRes.rows[0].total || 0);
            storageUsedVideoBytes = Number(storageRes.rows[0].video || 0);
            storageUsedImageBytes = Number(storageRes.rows[0].image || 0);
        } catch {
        }

        return NextResponse.json({
            companies: companiesCount,
            playlists: playlistsCount,
            videos: videosCount,
            photos: photosCount,
            totalDuration: totalDuration,
            screens: screensCount,
            onlineScreens: onlineScreensCount,
            storageUsedBytes,
            storageUsedVideoBytes,
            storageUsedImageBytes,
            storageLimitMb: settings.storageLimit,
        });

    } catch (error) {
        logger.error({ err: error }, 'Error fetching dashboard stats:');
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
