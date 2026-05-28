import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@playsync/database';
import { useAuthStore } from '@/lib/auth-store'; // Wait, this is client side, I need server side check
import { logServerAction, getIpAddress } from '@/lib/server-audit';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
    try {
        // Auth check (Admin only)
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        }

        const decoded = (await verifyToken(token)) as any;
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const ip = getIpAddress(request);
        
        // Reset all account locks in the system
        // This is a powerful action, only for master admins
        const users = await UserRepository.findAll();
        let count = 0;
        
        for (const user of users.users) {
            if (user.lockout_until || (user.failed_login_attempts && user.failed_login_attempts > 0)) {
                await UserRepository.resetFailedLogin(user.id);
                count++;
            }
        }

        await logServerAction({
            req: request,
            userId: decoded.id,
            userName: decoded.email,
            userRole: decoded.role,
            action: 'settings_changed',
            resource: 'auth',
            details: `Reset global de bloqueios de conta executado por administrador (Total: ${count} contas liberadas) (IP: ${ip})`
        });

        return NextResponse.json({ 
            success: true, 
            message: `${count} contas foram desbloqueadas com sucesso.` 
        });

    } catch (error) {
        logger.error({ err: error }, 'Reset locks error:');
        return NextResponse.json(
            { error: 'Erro interno no servidor' },
            { status: 500 }
        );
    }
}
