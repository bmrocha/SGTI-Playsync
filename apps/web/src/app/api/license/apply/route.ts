import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { applyLicense } from '@/lib/license-service';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin role required to apply license.' }, { status: 401 });
        }

        const body = await request.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 400 });
        }

        const result = await applyLicense(token, currentUser.id);

        if (result.success) {
            logServerAction({
                userId: currentUser.id,
                userName: currentUser.name || currentUser.email,
                userRole: currentUser.role,
                action: 'APPLY',
                resource: 'license',
                details: 'Licença aplicada com sucesso'
            });

            return NextResponse.json({ success: true, message: 'License applied successfully' });
        } else {
            return NextResponse.json({ error: 'License application failed', reason: result.reason }, { status: 400 });
        }
    } catch (error) {
        logger.error({ err: error }, 'Error applying license:');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
