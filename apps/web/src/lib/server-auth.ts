import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { UserRepository } from '@playsync/database';
import { logger } from '@/lib/logger';

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);

    if (!payload || !payload.id) {
      return null;
    }

    // Verify if user still exists and get latest role
    const user = await UserRepository.findById(payload.id as string);

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.company_id,
      forcePasswordReset: user.force_password_reset,
      permissions: user.permissions || [],
    };
  } catch (error) {
    logger.error({ err: error }, 'Error getting current user:');
    return null;
  }
}
