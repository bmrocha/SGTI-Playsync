import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { TwoFactorService } from '@/lib/2fa-service';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

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

    // Auth Check
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.type !== 'full') {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    // Generate temp secret and store in DB with expiration
    const { secret, qrCode } = await TwoFactorService.generateTempSecret(
      payload.id as string,
      payload.email as string,
    );

    logServerAction({
      userId: payload.id as string,
      userName: payload.id as string,
      userRole: (payload as any).role || 'user',
      action: 'SETUP',
      resource: '2fa',
      details: '2FA setup iniciado',
    });

    return NextResponse.json({ secret, qrCode });
  } catch (error) {
    logger.error({ err: error }, '2FA Setup Error:');
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
