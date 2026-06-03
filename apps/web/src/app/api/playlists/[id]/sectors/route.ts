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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const playlistId = params.id;
    const sectors = await SectorRepository.getPlaylistSectors(playlistId);
    return NextResponse.json({ sectors });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching playlist sectors:');
    return NextResponse.json({ error: 'Erro ao buscar setores' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (
      !hasPermission(
        currentUser.role as UserRole,
        Permission.EDIT_PLAYLIST,
        currentUser.permissions,
      )
    ) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 });
    }

    const body = await request.json();
    const result = updateSectorsSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const playlistId = params.id;
    await SectorRepository.setPlaylistSectors(playlistId, result.data.sectorIds);

    logServerAction({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      userRole: currentUser.role,
      action: 'UPDATE',
      resource: 'playlist',
      details: `Setores da playlist atualizados (${result.data.sectorIds.length} setores)`,
      resourceId: playlistId,
    });

    const sectors = await SectorRepository.getPlaylistSectors(playlistId);
    return NextResponse.json({ sectors });
  } catch (error) {
    logger.error({ err: error }, 'Error updating playlist sectors:');
    return NextResponse.json({ error: 'Erro ao atualizar setores' }, { status: 500 });
  }
}
