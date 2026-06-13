import { requireLicense } from '@/lib/license-service';
import { NextResponse } from 'next/server';
import { RateLimitRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { UserRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// Cron job to cleanup expired rate limits
export async function GET(request: Request) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
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

    // Delete expired rate limits
    const deletedCount = await RateLimitRepository.cleanupExpired();

    logger.info({ deletedCount }, '[Cron] Cleaned up expired rate limits');

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedCount} expired rate limit records`,
      deletedCount,
    });
  } catch (error) {
    logger.error({ err: error }, '[Cron] Error cleaning up rate limits:');
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup rate limits' },
      { status: 500 },
    );
  }
}
