import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import * as os from 'os';
import { getCurrentUser } from '@/lib/server-auth';
import { logger } from '@/lib/logger';

// GET /api/server-info - Returns the server's local network IP (Admin only)
export async function GET(request: NextRequest) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
        }

        // Try to get the host from the request itself first (most reliable)
        const requestHost = request.headers.get('host') || '';
        const port = requestHost.includes(':') ? requestHost.split(':')[1] : '3000';

        // Get all non-loopback IPv4 addresses from the server's network interfaces
        const interfaces = os.networkInterfaces();
        const localIPs: string[] = [];

        for (const iface of Object.values(interfaces)) {
            if (!iface) continue;
            for (const alias of iface) {
                if (alias.family === 'IPv4' && !alias.internal) {
                    localIPs.push(alias.address);
                }
            }
        }

        // Prefer 192.168.x.x range (home/office LAN), then 10.x.x.x, then any
        const preferredIP =
            localIPs.find(ip => ip.startsWith('192.168.')) ||
            localIPs.find(ip => ip.startsWith('10.')) ||
            localIPs.find(ip => ip.startsWith('172.')) ||
            localIPs[0] ||
            null;

        return NextResponse.json({
            localIP: preferredIP,
            port,
            allIPs: localIPs,
        }, {
            headers: {
                'Cache-Control': 'no-store',
            }
        });
    } catch (err) {
        logger.error({ err }, 'Error getting server info:');
        return NextResponse.json({ localIP: null, port: '3000', allIPs: [] }, { status: 500 });
    }
}
