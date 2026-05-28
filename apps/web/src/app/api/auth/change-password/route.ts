
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, signToken } from '@/lib/auth';
import { UserRepository } from '@playsync/database';
import bcrypt from 'bcryptjs';
import { logServerAction } from '@/lib/server-audit';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { getSystemSettings } from '@/lib/system-settings';
import { isIpTrusted, getIpFromHeaders } from '@/lib/ip-utils';
import { logger } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string()
        .min(12, 'A nova senha deve ter pelo menos 12 caracteres')
        .regex(/[A-Z]/, 'Deve conter pelo menos uma letra maiúscula')
        .regex(/[a-z]/, 'Deve conter pelo menos uma letra minúscula')
        .regex(/[0-9]/, 'Deve conter pelo menos um número')
        .regex(/[^A-Za-z0-9]/, 'Deve conter pelo menos um caractere especial'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

export async function POST(request: NextRequest) {
    try {
        const ip = getIpFromHeaders(request.headers);

        if (!(await checkRateLimit(request, { limit: 5, windowMs: 60 * 1000 }))) {
            logger.warn({ ip }, 'Rate limit exceeded for change-password');
            return NextResponse.json(
                { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
                { status: 429 }
            );
        }

        const settings = await getSystemSettings();
        const trustedIps = settings.trusted_ips || settings.restrictIP || '';
        
        if (!isIpTrusted(ip, trustedIps)) {
            return NextResponse.json({ error: 'Acesso negado: IP não autorizado.' }, { status: 403 });
        }

        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
        }

        const body = await request.json();
        const validation = changePasswordSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { currentPassword, newPassword } = validation.data;
        const userId = payload.id as string;

        // Get user from DB
        const user = await UserRepository.findById(userId);
        if (!user || !user.password) {
            return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and clear force_password_reset flag
        await UserRepository.update(userId, {
            password: hashedPassword,
            force_password_reset: false
        });

        // Log action
        await logServerAction({
            req: request,
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'password_change',
            resource: 'user',
            details: 'Senha alterada pelo usuário'
        });

        // Invalidate current session/token to force re-login
        const response = NextResponse.json({ message: 'Senha alterada com sucesso. Faça login novamente.' });
        
        response.cookies.delete('auth_token');

        return response;


    } catch (error) {
        logger.error({ err: error }, 'Change password error:');
        return NextResponse.json(
            { error: 'Erro ao alterar senha' },
            { status: 500 }
        );
    }
}
