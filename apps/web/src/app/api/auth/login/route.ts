import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UserRepository, SessionRepository } from '@playsync/database';
import { signAccessToken, signToken } from '@/lib/auth';
import { getIpFromHeaders } from '@/lib/ip-utils';
import { getSystemSettings } from '@/lib/system-settings';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { RefreshTokenRepository } from '@playsync/database';
import { TwoFactorService } from '@/lib/2fa-service';
import { getDeviceInfo } from '@/lib/device-detection';
import { logServerAction } from '@/lib/server-audit';

const loginSchema = z.object({
  email: z.string().email('Formato de email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    const ip = getIpFromHeaders(request.headers);

    // Rate Limiting (10 attempts per minute)
    if (!(await checkRateLimit(request, { limit: 10, windowMs: 60 * 1000 }))) {
      logger.warn({ ip }, 'Rate limit exceeded for IP');
      return NextResponse.json(
        { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
        { status: 429 },
      );
    }

    // IP Restriction temporariamente desativado conforme solicitado
    // const trustedIps = settings.trusted_ips || settings.restrictIP || '';
    //
    // if (!isIpTrusted(ip, trustedIps)) {
    //     logger.warn({ ip }, 'Blocked login attempt from untrusted IP');
    //     return NextResponse.json(
    //         { error: 'Acesso negado: IP não autorizado.' },
    //         { status: 403 }
    //     );
    // }

    const settings = await getSystemSettings();

    const body = await request.json();

    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = result.data;

    // Find user by email
    const user = await UserRepository.findByEmail(email.toLowerCase());

    if (!user || !user.password) {
      logger.warn('Login attempt for non-existent user');
      await logServerAction({
        req: request,
        userId: 'unknown',
        userName: email,
        userRole: 'visitor',
        action: 'failed_login_not_found',
        resource: 'auth',
        details: `Tentativa de login para email não encontrado: ${email} (IP: ${ip})`,
      });
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    // Check Account Lockout
    if (user.lockout_until && new Date() < new Date(user.lockout_until)) {
      const minutesLeft = Math.ceil((new Date(user.lockout_until).getTime() - Date.now()) / 60000);
      await logServerAction({
        req: request,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'login_locked_out',
        resource: 'auth',
        details: `Tentativa de login em conta bloqueada (IP: ${ip})`,
      });
      return NextResponse.json(
        { error: `Conta bloqueada temporariamente. Tente novamente em ${minutesLeft} minutos.` },
        { status: 423 }, // Locked
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Increment failed attempts
      const attempts = await UserRepository.incrementFailedLogin(user.id);

      // Lockout logic (3 attempts)
      if (attempts >= 3) {
        await UserRepository.lockAccount(user.id, 15); // Lock for 15 minutes
        await logServerAction({
          req: request,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'account_locked',
          resource: 'auth',
          details: `Conta bloqueada após ${attempts} tentativas falhas (IP: ${ip})`,
        });
        return NextResponse.json(
          { error: 'Muitas tentativas incorretas. Conta bloqueada por 15 minutos.' },
          { status: 423 },
        );
      }

      // Log failed login attempt
      await logServerAction({
        req: request,
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        action: 'failed_login',
        resource: 'auth',
        details: `Falha no login: Senha incorreta (Tentativa ${attempts}/3) (IP: ${ip})`,
      });

      return NextResponse.json(
        { error: `Email ou senha incorretos. Tentativa ${attempts}/3.` },
        { status: 401 },
      );
    }

    // Reset failed attempts on success
    if ((user.failed_login_attempts || 0) > 0) {
      await UserRepository.resetFailedLogin(user.id);
    }

    const bypass2faEnv = process.env.BYPASS_2FA_EMAILS || '';
    const bypass2faEmails = bypass2faEnv
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const shouldBypassTwoFactor = bypass2faEmails.includes((user.email || '').toLowerCase());

    if (shouldBypassTwoFactor && user.two_factor_enabled) {
      await TwoFactorService.disableTwoFactor(user.id);
    }

    // Check 2FA
    const effectiveTwoFactorEnabled = user.two_factor_enabled && !shouldBypassTwoFactor;
    if (effectiveTwoFactorEnabled) {
      const tempToken = await signToken({
        id: user.id,
        email: user.email,
        role: user.role,
        type: '2fa_pending',
      });

      return NextResponse.json({
        require2fa: true,
        tempToken: tempToken,
        message: 'Autenticação de dois fatores necessária',
      });
    }

    logger.debug(
      { userId: user.id, force2fa: user.force_2fa_setup, forceReset: user.force_password_reset },
      'User authenticated',
    );

    // Determine if we should force 2FA setup
    // Logic: Force if (User Flag is set OR System Setting is Enforced) AND 2FA is NOT enabled
    // Default isTwoFactorEnforced to true if undefined, as per requirements
    const isEnforced = settings.isTwoFactorEnforced !== false;
    const shouldForceTwoFactorSetup = shouldBypassTwoFactor
      ? false
      : (user.force_2fa_setup || isEnforced) && !user.two_factor_enabled;

    // --- SESSION TRACKING START ---
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const { device, os } = getDeviceInfo(userAgent);

    // Generate token
    const token = await signAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'full',
      forcePasswordReset: user.force_password_reset,
      forceTwoFactorSetup: shouldForceTwoFactorSetup,
    });

    const refreshTokenDb = RefreshTokenRepository.generateToken();

    const session = await SessionRepository.create({
      user_id: user.id,
      token: token,
      device,
      os,
      ip,
    });

    await SessionRepository.updateRefreshToken(session.id, refreshTokenDb);
    // --- SESSION TRACKING END ---

    // Update last login
    await UserRepository.updateLastLogin(user.id);

    // Return user data (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.company_id,
      avatar: user.avatar,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      forcePasswordReset: user.force_password_reset,
      two_factor_enabled: effectiveTwoFactorEnabled,
      force_2fa_setup: shouldForceTwoFactorSetup,
      theme: user.theme,
      primaryColor: user.primary_color,
    };

    // Log successful login server-side to capture IP
    await logServerAction({
      req: request,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'login',
      resource: 'auth',
      details: `Login realizado em ${device} (${os}) - IP: ${ip}`,
    });

    // Create response
    const response = NextResponse.json({
      user: userResponse,
      message: 'Login realizado com sucesso',
    });

    // Set cookie on response
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
    });

    response.cookies.set('refresh_token', refreshTokenDb, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
