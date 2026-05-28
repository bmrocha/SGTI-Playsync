import { requireLicense } from '@/lib/license-service';
import { NextResponse } from 'next/server';
import { AuditLogRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { UserRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// Cron job to cleanup audit logs older than 90 days
export async function GET(request: Request) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const authHeader = request.headers.get('authorization') || '';
        const bearer = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
        const cronSecret = process.env.CRON_SECRET || '';
        const isCronAuthorized = cronSecret.length > 0 && bearer === cronSecret;

        if (!isCronAuthorized) {
            const currentUser = await getCurrentUser();
            if (!currentUser) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            if (currentUser.role !== UserRole.ADMIN) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        // Calculate 90 days ago
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Delete old logs
        const deletedCount = await AuditLogRepository.deleteOlderThan(ninetyDaysAgo);

        logger.info({ deletedCount, cutoffDate: ninetyDaysAgo.toISOString() }, '[Cron] Deleted audit logs older than 90 days');

        return NextResponse.json({
            success: true,
            message: `Deleted ${deletedCount} logs older than 90 days`,
            deletedCount,
            cutoffDate: ninetyDaysAgo.toISOString(),
        });
    } catch (error) {
        logger.error({ err: error }, '[Cron] Error cleaning up audit logs:');
        return NextResponse.json(
            { success: false, error: 'Failed to cleanup audit logs' },
            { status: 500 }
        );
    }
}
