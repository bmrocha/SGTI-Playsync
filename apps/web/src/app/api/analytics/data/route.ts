import { requireLicense } from '@/lib/license-service';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { AnalyticsRepository } from '@playsync/database';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized', details: 'Acesse novamente sua conta.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const companyIdParam = searchParams.get('companyId');

    // Security check: If not super admin, force companyId to user's company
    logger.debug({ user: user.id, role: user.role }, '[API Analytics] User check');
    // Security check: If not super admin, force companyId to user's company
    const { hasPermission, Permission } = await import('@/lib/permissions');
    
    let targetCompanyId: string | null | undefined = companyIdParam;
    
    // Check if user has global viewing rights
    const canViewAll = hasPermission(user.role as any, Permission.VIEW_ALL_ANALYTICS) || user.role === 'super_admin' || user.role === 'system_admin';

    if (!canViewAll) {
        if (!user.companyId) {
             return NextResponse.json({ error: 'Forbidden', details: `Acesso Negado: Seu perfil (${user.role}) exige vínculo com uma empresa, mas nenhuma foi encontrada.` }, { status: 403 });
        }

        if (targetCompanyId && targetCompanyId !== user.companyId) {
             return NextResponse.json({ error: 'Forbidden', details: 'Acesso negado aos dados desta empresa.' }, { status: 403 });
        }
        targetCompanyId = user.companyId; 
    }

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    try {
        const logs = await AnalyticsRepository.getLogs({
            startDate,
            endDate,
            companyId: targetCompanyId || undefined
        });
        logger.debug({ count: logs.length, companyId: targetCompanyId }, '[API Analytics] Found logs');
        return NextResponse.json(logs, {
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        });
    } catch (error: any) {
        logger.error({ err: error }, '[API Analytics Error]:');
        return new NextResponse(JSON.stringify({ 
            error: 'Failed to fetch logs'
        }), { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
