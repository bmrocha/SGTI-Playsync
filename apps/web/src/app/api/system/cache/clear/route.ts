import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { hasPermission, Permission, UserRole } from '@/lib/permissions';
import { clearCache } from '@/lib/system-settings';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const role = Object.values(UserRole).includes(user.role as UserRole) ? (user.role as UserRole) : null;
        if (!role || !hasPermission(role, Permission.MANAGE_SETTINGS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        clearCache();
        revalidatePath('/', 'layout');

        logServerAction({
            userId: user.id,
            userName: user.name || user.email,
            userRole: user.role,
            action: 'CLEAR',
            resource: 'system_cache',
            details: 'Cache do sistema limpo manualmente'
        });

        logger.info('System cache manually cleared by admin');

        return NextResponse.json({
            success: true,
            message: 'Cache do sistema limpo com sucesso.'
        });
    } catch (error) {
        logger.error({ err: error }, 'Cache clear error:');
        return NextResponse.json({ error: 'Erro ao limpar cache do sistema' }, { status: 500 });
    }
}
