import { NextResponse } from 'next/server';
import { pool } from '@playsync/database';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await pool.query('SELECT 1');
        return NextResponse.json({ status: 'healthy' }, { status: 200 });
    } catch {
        return NextResponse.json({ status: 'unhealthy' }, { status: 503 });
    }
}
