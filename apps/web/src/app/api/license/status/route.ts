import { NextResponse } from 'next/server';
import { getLicenseStatus } from '@/lib/license-service';
import { getCurrentUser } from '@/lib/server-auth';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // The installation ID is now generated fresh each time via getLicenseStatus()
    // No need to manually update it here
    const status = await getLicenseStatus();
    return NextResponse.json(status);
  } catch (error) {
    logger.error({ err: error }, 'Error fetching license status:');
    return NextResponse.json({ error: 'Failed to fetch license status' }, { status: 500 });
  }
}
