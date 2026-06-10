import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuditLogRepository } from '@playsync/database';
import { getIpFromHeaders } from '@/lib/ip-utils';
import { getCurrentUser } from '@/lib/server-auth';

const auditLogSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  userName: z.string().min(1, 'userName is required'),
  userRole: z.string().min(1, 'userRole is required'),
  action: z.string().min(1, 'action is required'),
  resource: z.enum(
    ['auth', 'user', 'playlist', 'player', 'company', 'sector', 'media', 'settings', 'system'],
    {
      message:
        'resource must be one of: auth, user, playlist, player, company, sector, media, settings, system',
    },
  ),
  resourceId: z.string().optional(),
  resourceName: z.string().optional(),
  details: z.string().min(1, 'details is required'),
  metadata: z.any().optional(),
});

const auditFilterSchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  resources: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
});
import { logger } from '@/lib/logger';

// GET /api/audit - Fetch audit logs with filters (Admin only)
export async function GET(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const filters = auditFilterSchema.safeParse({
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      resource: searchParams.get('resource') || undefined,
      resources: searchParams.get('resources')
        ? searchParams.get('resources')!.split(',')
        : undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!filters.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: filters.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const {
      userId: filterUserId,
      action: filterAction,
      resource: filterResource,
      resources,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = filters.data;

    const { logs: rawLogs, total } = await AuditLogRepository.findMany({
      userId: filterUserId,
      action: filterAction,
      resource: filterResource,
      resources,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      offset: (page - 1) * limit,
      limit,
    });

    const logs = rawLogs.map((log) => ({
      id: log.id,
      userId: log.user_id,
      userName: log.user_name,
      userRole: log.user_role,
      action: log.action,
      resource: log.resource,
      resourceId: log.resource_id,
      resourceName: log.resource_name,
      details: log.details,
      metadata: log.metadata,
      timestamp: log.timestamp,
      ipAddress: log.ip_address,
    }));

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching audit logs:');
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

// POST /api/audit - Create new audit log (authenticated users only)
export async function POST(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const parsed = auditLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const {
      userId,
      userName,
      userRole,
      action,
      resource,
      resourceId,
      resourceName,
      details,
      metadata,
    } = parsed.data;

    // Extract IP from request headers
    const ipAddress = getIpFromHeaders(request.headers);
    const forwardedFor =
      request.headers.get('x-forwarded-for') || request.headers.get('x_forwarded_for');
    const realIp = request.headers.get('x-real-ip');
    const internalIp = request.headers.get('x-sgti-client-ip');

    const mergedMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? metadata
        : metadata
          ? { value: metadata }
          : undefined;

    const metadataWithHeaders = {
      ...(mergedMetadata || {}),
      ...(forwardedFor ? { x_forwarded_for: forwardedFor } : {}),
      ...(realIp ? { x_real_ip: realIp } : {}),
      ...(internalIp ? { x_sgti_client_ip: internalIp } : {}),
    };

    // Create audit log
    const log = await AuditLogRepository.create({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action,
      resource,
      resource_id: resourceId,
      resource_name: resourceName,
      details,
      metadata:
        Object.keys(metadataWithHeaders).length > 0
          ? JSON.stringify(metadataWithHeaders)
          : undefined,
      ip_address: ipAddress,
    });

    return NextResponse.json(
      {
        id: log.id,
        userId: log.user_id,
        userName: log.user_name,
        userRole: log.user_role,
        action: log.action,
        resource: log.resource,
        resourceId: log.resource_id,
        resourceName: log.resource_name,
        details: log.details,
        metadata: log.metadata,
        timestamp: log.timestamp,
        ipAddress: log.ip_address,
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ err: error }, 'Error creating audit log:');
    return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
  }
}

// DELETE /api/audit/cleanup - Delete logs older than configured retention period (Admin only)
export async function DELETE(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
    }

    // Allow custom retention period via query parameter (default 180 days)
    const { searchParams } = new URL(request.url);
    const retentionDays = parseInt(searchParams.get('retentionDays') || '180');

    // Validate retention period (min 30 days, max 365 days)
    if (retentionDays < 30 || retentionDays > 365) {
      return NextResponse.json(
        {
          error: 'Retention period must be between 30 and 365 days',
        },
        { status: 400 },
      );
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Delete old logs
    const deletedCount = await AuditLogRepository.deleteOlderThan(cutoffDate);

    return NextResponse.json({
      message: `Deleted ${deletedCount} logs older than ${retentionDays} days`,
      deletedCount,
      retentionDays,
      cutoffDate: cutoffDate.toISOString(),
    });
  } catch (error) {
    logger.error({ err: error }, 'Error cleaning up audit logs:');
    return NextResponse.json({ error: 'Failed to cleanup audit logs' }, { status: 500 });
  }
}
