import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { getIpFromHeaders } from '@/lib/ip-utils';
import { getCurrentUser } from '@/lib/server-auth';

export async function GET(request: NextRequest) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
    }

    const ip = getIpFromHeaders(request.headers);
    return NextResponse.json({ 
        ip, 
        headers: {
            'x-forwarded-for': request.headers.get('x-forwarded-for'),
            'x_forwarded_for': request.headers.get('x_forwarded_for'),
            'x-real-ip': request.headers.get('x-real-ip'),
            'x-sgti-client-ip': request.headers.get('x-sgti-client-ip')
        }
    });
}
