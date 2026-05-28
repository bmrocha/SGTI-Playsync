import { NextRequest, NextResponse } from 'next/server';
import { SessionRepository } from '@playsync/database';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;

        if (token) {
        const session = await SessionRepository.findByToken(token);

        if (session) {
            await SessionRepository.updateRefreshToken(session.id, null);
            await SessionRepository.deleteByToken(token);

            logServerAction({
                userId: session.user_id,
                userName: session.user_id,
                userRole: 'user',
                action: 'LOGOUT',
                resource: 'auth',
                details: 'Usuário realizou logout'
            });
        } else {
            await SessionRepository.deleteByToken(token);
        }
        }

        const response = NextResponse.json({
            success: true,
            message: 'Logout realizado com sucesso',
        });

        // Set deletion on response with correct options
        response.cookies.set('auth_token', '', {
            path: '/',
            expires: new Date(0),
            httpOnly: true
        });

        response.cookies.set('refresh_token', '', {
            path: '/',
            expires: new Date(0),
            httpOnly: true
        });

        return response;
    } catch (error) {
        logger.error({ err: error }, 'Logout error:');
        return NextResponse.json(
            { error: 'Erro ao realizar logout' },
            { status: 500 }
        );
    }
}
