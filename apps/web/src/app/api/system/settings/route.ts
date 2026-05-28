import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { getSystemSettings, saveSystemSettings } from '@/lib/system-settings';
import { getCurrentUser } from '@/lib/server-auth';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

// GET /api/system/settings
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
        }

        const settings = await getSystemSettings();
        return NextResponse.json(settings);
    } catch (error) {
        logger.error({ err: error }, 'Settings GET error:');
        return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
    }
}

// POST /api/system/settings
export async function POST(req: NextRequest) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
        }

        const updates = await req.json();
        const updatedSettings = await saveSystemSettings(updates);

        logServerAction({
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            userRole: currentUser.role,
            action: 'UPDATE',
            resource: 'system_settings',
            details: 'Configurações do sistema atualizadas'
        });

        return NextResponse.json(updatedSettings);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }
}
