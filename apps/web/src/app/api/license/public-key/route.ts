import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { getLicensePublicKeyPem, getLicenseState, loadLicensePublicKeyFromDb, saveLicensePublicKey } from '@/lib/license-service';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        if (!getLicensePublicKeyPem()) {
            await loadLicensePublicKeyFromDb();
        }
        const pem = getLicensePublicKeyPem();
        const state = await getLicenseState();
        return NextResponse.json({
            publicKeyPem: pem,
            issuer: process.env.LICENSE_ISSUER || 'SGTI',
            installationId: state.installationId,
        });
    } catch (error) {
        logger.error({ err: error }, 'Error fetching public key:');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 401 });
        }

        const body = await request.json();
        const { publicKey } = body;

        if (!publicKey || typeof publicKey !== 'string') {
            return NextResponse.json({ error: 'Public key is required' }, { status: 400 });
        }

        const result = await saveLicensePublicKey(publicKey);
        if (result.success) {
            logServerAction({
                userId: currentUser.id,
                userName: currentUser.name || currentUser.email,
                userRole: currentUser.role,
                action: 'UPDATE',
                resource: 'license_public_key',
                details: 'Chave pública da licença atualizada'
            });

            return NextResponse.json({ success: true, message: 'Public key saved' });
        }
        return NextResponse.json({ error: result.reason || 'Failed to save' }, { status: 400 });
    } catch (error) {
        logger.error({ err: error }, 'Error saving public key:');
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
