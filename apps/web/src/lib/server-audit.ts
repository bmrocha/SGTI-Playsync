import { NextRequest } from 'next/server';
import { AuditLogRepository } from '@playsync/database';
import { UserRole } from './permissions';
import { getIpFromHeaders } from './ip-utils';
import { logger } from '@/lib/logger';

/**
 * Extracts the user's IP address from the request headers
 */
export function getIpAddress(req: NextRequest): string {
    return getIpFromHeaders(req.headers);
}

interface ServerAuditLogParams {
    req?: NextRequest;
    ip?: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    resource: string;
    details: string;
    resourceId?: string;
    resourceName?: string;
    metadata?: Record<string, any>;
}

/**
 * Server-side audit logger that captures IP and writes directly to Database
 */
export async function logServerAction({
    req,
    ip,
    userId,
    userName,
    userRole,
    action,
    resource,
    details,
    resourceId,
    resourceName,
    metadata
}: ServerAuditLogParams) {
    try {
        const ipAddress = ip || (req ? getIpAddress(req) : 'system');
        const forwardedFor = req ? (req.headers.get('x-forwarded-for') || req.headers.get('x_forwarded_for')) : null;
        const realIp = req ? req.headers.get('x-real-ip') : null;
        const internalIp = req ? req.headers.get('x-sgti-client-ip') : null;

        const metadataWithHeaders = {
            ...(metadata || {}),
            ...(forwardedFor ? { x_forwarded_for: forwardedFor } : {}),
            ...(realIp ? { x_real_ip: realIp } : {}),
            ...(internalIp ? { x_sgti_client_ip: internalIp } : {}),
        };

        const logEntry = {
            timestamp: new Date().toISOString(),
            userId,
            userName,
            userRole,
            action,
            resource,
            details,
            resourceId,
            resourceName,
            ipAddress,
            metadata: metadataWithHeaders
        };

        // Output structured JSON for log aggregators (ELK, Loki, etc.)
        console.log(JSON.stringify({ type: 'AUDIT', ...logEntry }));

        await AuditLogRepository.create({
            user_id: userId,
            user_name: userName,
            user_role: userRole,
            action,
            resource,
            details,
            resource_id: resourceId,
            resource_name: resourceName,
            metadata: Object.keys(metadataWithHeaders).length > 0 ? JSON.stringify(metadataWithHeaders) : undefined,
            ip_address: ipAddress
        });
    } catch (error) {
        logger.error({ err: error }, 'Failed to write server audit log:');
        // Don't throw, we don't want to break the main request flow for logging failure
    }
}
