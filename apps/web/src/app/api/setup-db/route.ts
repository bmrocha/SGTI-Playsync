import { requireLicense } from '@/lib/license-service';

import { NextResponse } from 'next/server';
import { query } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { UserRole } from '@/lib/permissions';

export async function GET() {
    const _lc = await requireLicense(); if (_lc) return _lc;
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (currentUser.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS force_2fa_setup BOOLEAN DEFAULT FALSE;
    `);
    return NextResponse.json({ success: true, message: 'Column added' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
