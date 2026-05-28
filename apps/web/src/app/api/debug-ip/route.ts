import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings } from '@/lib/system-settings';
import { isIpTrusted, getIpFromHeaders } from '@/lib/ip-utils';
import { getCurrentUser } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
        }

        const ip = getIpFromHeaders(request.headers);
        const settings = await getSystemSettings();

        const trustedIps = settings.trusted_ips || settings.restrictIP || '';
        const isTrusted = isIpTrusted(ip, trustedIps);

        return NextResponse.json({
            ip,
            isTrusted,
            trustedIpsConfig: trustedIps,
            headers: {
                'x-forwarded-for': request.headers.get('x-forwarded-for'),
                'x-real-ip': request.headers.get('x-real-ip'),
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
