import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { SectorRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { z } from 'zod';
import { hasPermission, UserRole, Permission } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

const updateSectorsSchema = z.object({
  sectorIds: z.array(z.string().uuid()),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id: userId } = await params;
    const sectors = await SectorRepository.getUserSectors(userId);
    return NextResponse.json({ sectors });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching user sectors:');
    return NextResponse.json({ error: 'Erro ao buscar setores' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (
      !hasPermission(currentUser.role as UserRole, Permission.MANAGE_USERS, currentUser.permissions)
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateSectorsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { id: userId } = await params;
    await SectorRepository.setUserSectors(userId, result.data.sectorIds);

    logServerAction({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      userRole: currentUser.role,
      action: 'UPDATE',
      resource: 'user',
      details: `Setores do usuário atualizados (${result.data.sectorIds.length} setores)`,
      resourceId: userId,
    });

    const sectors = await SectorRepository.getUserSectors(userId);
    return NextResponse.json({ sectors });
  } catch (error) {
    logger.error({ err: error }, 'Error updating user sectors:');
    return NextResponse.json({ error: 'Erro ao atualizar setores' }, { status: 500 });
  }
}
