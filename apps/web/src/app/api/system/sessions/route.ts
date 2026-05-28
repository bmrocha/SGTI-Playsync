import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SessionRepository } from '@playsync/database';
import { UserRole } from '@/lib/permissions';
import { getSystemSettings } from '@/lib/system-settings';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    // Get system settings for session limit
    const settings = await getSystemSettings();
    const sessionTimeoutMinutes = parseInt(settings.sessionLimit) || 60;

    // Trigger cleanup of expired sessions based on settings
    // Add extra buffer (e.g., 2x limit) before hard delete, or delete immediately if expired?
    // User requested "limpeza automática de sessões offline após timeout definido"
    await SessionRepository.cleanupExpired(sessionTimeoutMinutes);

    const sessions = await SessionRepository.findAllWithUser();

    // Map sessions to include status and current flag
    const now = new Date();
    const sessionsWithStatus = sessions.map(session => {
      const lastSeen = new Date(session.last_seen);
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / 1000 / 60;
      
      // Status is online if seen within last 2 minutes (heartbeat interval is usually 1-2 min)
      const isOnline = diffMinutes < 2;

      return {
        ...session,
        current: session.token === token,
        status: isOnline ? 'online' : 'offline',
        diffMinutes: Math.round(diffMinutes)
      };
    });

    return NextResponse.json({ sessions: sessionsWithStatus });
  } catch (error) {
    logger.error({ err: error }, 'Session List Error:');
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'ID da sessão obrigatório' }, { status: 400 });
    }

    await SessionRepository.deleteById(sessionId);

    logServerAction({
        userId: payload.id as string,
        userName: payload.id as string,
        userRole: payload.role,
        action: 'DELETE',
        resource: 'session',
        details: `Sessão ${sessionId} removida`,
        resourceId: sessionId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover sessão' }, { status: 500 });
  }
}
