import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { SessionRepository } from '@playsync/database';
import { getIpAddress } from '@/lib/server-audit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    const ip = getIpAddress(request);
    
    // Update session last_seen and IP
    await SessionRepository.updateLastSeen(token, ip);
    
    // Cleanup expired sessions (inactive for > 30 mins)
    // We do this in heartbeat to ensure regular cleanup without a cron job
    await SessionRepository.cleanupExpired(30);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Heartbeat Error:');
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
