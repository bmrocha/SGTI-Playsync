import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth';
import { TwoFactorService } from '@/lib/2fa-service';
import { z } from 'zod';
import { logServerAction } from '@/lib/server-audit';
import { logger } from '@/lib/logger';

const enable2FASchema = z.object({
  // Secret is no longer required from client as it's stored in DB (temp_secret)
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
});

export async function POST(request: NextRequest) {
  try {
    // IP Restriction temporariamente desativado conforme solicitado
    // const ip = getIpFromHeaders(request.headers);
    // const settings = await getSystemSettings();
    // const trustedIps = settings.trusted_ips || settings.restrictIP || '';
    //
    // if (!isIpTrusted(ip, trustedIps)) {
    //     return NextResponse.json({ error: 'Acesso negado: IP não autorizado.' }, { status: 403 });
    // }

    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'full') {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const body = await request.json();
    const result = enable2FASchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { code } = result.data;

    // Verify against stored temp secret
    const isValid = await TwoFactorService.verifyAndEnable(payload.id as string, code);

    if (!isValid) {
      return NextResponse.json({ error: 'Código inválido ou expirado' }, { status: 400 });
    }

    // Audit Log
    await logServerAction({
      req: request,
      userId: payload.id as string,
      userName: (payload.email as string) || 'Unknown',
      userRole: payload.role as string,
      action: '2fa_enabled',
      resource: 'auth',
      details: 'Autenticação de dois fatores ativada pelo usuário',
    });

    // Issue new token without forceTwoFactorSetup flag
    const { iat: _iat, exp: _exp, ...newPayload } = payload;
    newPayload.forceTwoFactorSetup = false;

    const newToken = await signToken(newPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Autenticação de dois fatores ativada',
      requirePasswordReset: newPayload.forcePasswordReset,
    });

    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isSecure = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

    response.cookies.set('auth_token', newToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    logger.error({ err: error }, '2FA Enable Error:');
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
