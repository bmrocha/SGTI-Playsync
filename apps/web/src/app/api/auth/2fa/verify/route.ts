import { NextRequest, NextResponse } from 'next/server';
import { UserRepository, SessionRepository } from '@playsync/database';
import { verifyToken, signToken } from '@/lib/auth';
import { TwoFactorService } from '@/lib/2fa-service';
import { getDeviceInfo } from '@/lib/device-detection';
import { logServerAction, getIpAddress } from '@/lib/server-audit';
import { z } from 'zod';
import { getSystemSettings } from '@/lib/system-settings';
import { isIpTrusted } from '@/lib/ip-utils';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

const verify2FASchema = z.object({
    tempToken: z.string().min(1, 'Token é obrigatório'),
    code: z.string().length(6, 'O código deve ter 6 dígitos')
});

export async function POST(request: NextRequest) {
  try {
    const ip = getIpAddress(request);

    if (!(await checkRateLimit(request, { limit: 10, windowMs: 60 * 1000 }))) {
        logger.warn({ ip }, 'Rate limit exceeded for 2fa/verify');
        return NextResponse.json(
            { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
            { status: 429 }
        );
    }

    // Check IP Restriction
    const settings = await getSystemSettings();
    const trustedIps = settings.trusted_ips || settings.restrictIP || '';
    
    if (!isIpTrusted(ip, trustedIps)) {
        return NextResponse.json({ error: 'Acesso negado: IP não autorizado.' }, { status: 403 });
    }

    const body = await request.json();
    
    const result = verify2FASchema.safeParse(body);
    if (!result.success) {
        return NextResponse.json(
            { error: result.error.issues[0].message },
            { status: 400 }
        );
    }
    
    const { tempToken, code } = result.data;

    // Verify temp token
    const payload = await verifyToken(tempToken);
    if (!payload || payload.type !== '2fa_pending') {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    const userId = payload.id as string;
    const user = await UserRepository.findById(userId);

    if (!user || !user.two_factor_secret) {
      return NextResponse.json({ error: 'Usuário não encontrado ou 2FA não configurado' }, { status: 404 });
    }

    // Verify TOTP
    const isValid = await TwoFactorService.verifyToken(code, user.two_factor_secret);
    if (!isValid) {
      return NextResponse.json({ error: 'Código inválido' }, { status: 401 });
    }

    // Generate Full Token
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const { device, os } = getDeviceInfo(userAgent);

    const shouldForceTwoFactorSetup = user.force_2fa_setup && (settings.isTwoFactorEnforced !== false);

    const token = await signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'full',
      forcePasswordReset: user.force_password_reset,
      forceTwoFactorSetup: shouldForceTwoFactorSetup
    });

    await SessionRepository.create({
      user_id: user.id,
      token: token,
      device,
      os,
      ip
    });

    await UserRepository.updateLastLogin(user.id);
    await logServerAction({
        req: request,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'login_2fa',
        resource: 'auth',
        details: `Login 2FA realizado em ${device} (${os}) - IP: ${ip}`
    });

    const response = NextResponse.json({
      user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.company_id,
          avatar: user.avatar,
          createdAt: user.created_at,
          lastLogin: user.last_login,
          forcePasswordReset: user.force_password_reset,
          two_factor_enabled: user.two_factor_enabled,
          force_2fa_setup: shouldForceTwoFactorSetup,
          theme: user.theme,
          primaryColor: user.primary_color
      },
      message: 'Login realizado com sucesso'
    });

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/'
    });

    return response;

  } catch (error) {
    logger.error({ err: error }, '2FA Verify Error:');
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
