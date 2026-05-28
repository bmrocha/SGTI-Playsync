import { NextResponse } from 'next/server';
import { query } from '@playsync/database';
import * as crypto from 'crypto';
import { getLicenseStatus } from '@/lib/license-service';
import { getCurrentUser } from '@/lib/server-auth';
import { logger } from '@/lib/logger';

export async function GET() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const res = await query('SELECT value FROM system_settings WHERE key = $1', ['license_state']);
        if (res.rows.length > 0) {
            const state = JSON.parse(res.rows[0].value);
            if (!state.licensed) {
                state.installationId = process.env.INSTALLATION_ID || crypto.randomUUID();
                await query('UPDATE system_settings SET value = $1 WHERE key = $2', [JSON.stringify(state), 'license_state']);
            }
        }

        const status = await getLicenseStatus();
        return NextResponse.json(status);
    } catch (error) {
        logger.error({ err: error }, 'Error fetching license status:');
        return NextResponse.json({ error: 'Failed to fetch license status' }, { status: 500 });
    }
}
