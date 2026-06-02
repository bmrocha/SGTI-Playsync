import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { TwoFactorService } from '@/lib/2fa-service';
import { logServerAction } from '@/lib/server-audit';
import { getSystemSettings } from '@/lib/system-settings';
import { isIpTrusted, getIpFromHeaders } from '@/lib/ip-utils';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // IP Restriction temporariamente desativado conforme solicitado
    // const ip = getIpFromHeaders(request.headers);
    // const trustedIps = settings.trusted_ips || settings.restrictIP || '';
    // 
    // if (!isIpTrusted(ip, trustedIps)) {
    //     return NextResponse.json({ error: 'Acesso negado: IP não autorizado.' }, { status: 403 });
    // }

    const settings = await getSystemSettings();

    if (settings.isTwoFactorEnforced) {
        return NextResponse.json({ error: '2FA é obrigatório neste sistema e não pode ser desativado.' }, { status: 403 });
    }

    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const payload = await verifyToken(token);
    if (!payload) {
         return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }
    
    // Disable 2FA
    await TwoFactorService.disableTwoFactor(payload.id as string);

    // Audit Log
    await logServerAction({
        req: request,
        userId: payload.id as string,
        userName: (payload.email as string) || 'Unknown',
        userRole: payload.role as string,
        action: '2fa_disabled',
        resource: 'auth',
        details: 'Autenticação de dois fatores desativada pelo usuário'
    });
    
    return NextResponse.json({ success: true, message: 'Autenticação de dois fatores desativada' });

  } catch (error) {
    logger.error({ err: error }, '2FA Disable Error:');
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
