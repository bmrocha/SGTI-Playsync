import { NextRequest, NextResponse } from 'next/server';
import { signAccessToken } from '@/lib/auth';
import { RefreshTokenRepository } from '@playsync/database';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        const refreshToken = request.cookies.get('refresh_token')?.value;

        if (!refreshToken) {
            return NextResponse.json({ error: 'Refresh token não encontrado' }, { status: 401 });
        }

        const session = await RefreshTokenRepository.findByToken(refreshToken);

        if (!session) {
            logger.warn('Refresh token inválido ou expirado');
            const response = NextResponse.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
            response.cookies.set('refresh_token', '', { path: '/', expires: new Date(0), httpOnly: true });
            response.cookies.set('auth_token', '', { path: '/', expires: new Date(0), httpOnly: true });
            return response;
        }

        const newRefreshToken = await RefreshTokenRepository.updateByOldToken(refreshToken);
        if (!newRefreshToken) {
            return NextResponse.json({ error: 'Erro ao renovar sessão' }, { status: 500 });
        }

        const accessToken = await signAccessToken({
            id: session.user_id,
            type: 'full'
        });

        const response = NextResponse.json({ success: true });

        const forwardedProto = request.headers.get('x-forwarded-proto');
        const isSecure = forwardedProto === 'https' || request.nextUrl.protocol === 'https:';

        response.cookies.set('auth_token', accessToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax',
            path: '/'
        });

        response.cookies.set('refresh_token', newRefreshToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax',
            path: '/'
        });

        return response;
    } catch (error) {
        logger.error({ err: error }, 'Refresh token error:');
        return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
    }
}
