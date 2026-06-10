import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { AuditLogRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { logger } from '@/lib/logger';

// POST /api/audit/cleanup/auto - Automatic cleanup endpoint (can be called by cron)
export async function POST(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    // For automated cleanup, allow either admin user OR secret key
    const authHeader = request.headers.get('Authorization');
    const currentUser = await getCurrentUser();

    // Check if it's a cron job with secret or an admin user
    const isCronJob = authHeader === `Bearer ${process.env.CRON_SECRET_KEY}`;
    const isAdmin = currentUser?.role === 'admin';

    if (!isCronJob && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default retention: 180 days
    const retentionDays = 180;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete old logs
    const deletedCount = await AuditLogRepository.deleteOlderThan(cutoffDate);

    logger.info(
      {
        deletedCount,
        retentionDays,
        cutoffDate: cutoffDate.toISOString(),
        triggeredBy: isCronJob ? 'cron-job' : currentUser?.id,
      },
      'Automatic audit log cleanup completed',
    );

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} logs older than ${retentionDays} days`,
      deletedCount,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error in automatic audit log cleanup:');
    return NextResponse.json({ error: 'Failed to cleanup audit logs' }, { status: 500 });
  }
}
