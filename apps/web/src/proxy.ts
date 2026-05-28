import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getIpFromHeaders } from '@/lib/ip-utils';
import { UserRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';

export async function proxy(request: NextRequest) {
  const clientIp = getIpFromHeaders(request.headers);

  logger.debug({ method: request.method, path: request.nextUrl.pathname }, 'Middleware request');
  const { pathname } = request.nextUrl;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-sgti-client-ip', clientIp);

  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const payload = await verifyToken(token);

    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }

    if (payload.type === '2fa_pending') {
      return NextResponse.redirect(new URL('/login?error=2fa_required', request.url));
    }

    if (payload.forceTwoFactorSetup) {
      const isProfilePage = pathname.includes('/dashboard/profile');
      const hasSetupParam = request.nextUrl.searchParams.get('setup2fa') === 'true';

      if (!isProfilePage || !hasSetupParam) {
        return NextResponse.redirect(new URL('/dashboard/profile?setup2fa=true', request.url));
      }

      if (!isProfilePage) {
        return NextResponse.redirect(new URL('/dashboard/profile?setup2fa=true', request.url));
      }
    }

    if (payload.forcePasswordReset && !payload.forceTwoFactorSetup) {
      const isProfilePage = pathname.includes('/dashboard/profile');
      const hasChangeParam = request.nextUrl.searchParams.get('changePassword') === 'true';

      if (!isProfilePage || !hasChangeParam) {
        return NextResponse.redirect(new URL('/dashboard/profile?changePassword=true', request.url));
      }
    }

    const userRole = payload.role as UserRole;

    if (
      (pathname.startsWith('/dashboard/users') ||
        pathname.startsWith('/dashboard/settings') ||
        pathname.startsWith('/dashboard/audit')) &&
      userRole !== UserRole.ADMIN
    ) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}


