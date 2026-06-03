import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { PlaylistRepository, SectorRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { z } from 'zod';
import { Permission, hasPermission, UserRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

const createPlaylistSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  companyIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const _lc = await requireLicense();
  if (_lc) return _lc;
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;

    let companyId = currentUser.role === 'admin' ? undefined : currentUser.companyId || undefined;

    if (currentUser.role === 'admin' && searchParams.has('companyId')) {
      companyId = searchParams.get('companyId') || undefined;
    }

    // Sector-based filtering for non-admin users
    let allowedPlaylistIds: string[] | undefined = undefined;
    if (currentUser.role !== 'admin') {
      const userSectorIds = await SectorRepository.getUserSectorIds(currentUser.id);
      if (userSectorIds.length > 0) {
        allowedPlaylistIds = await SectorRepository.getPlaylistIdsBySectorIds(userSectorIds);
      }
    }

    const { playlists, total } = await PlaylistRepository.findAll(
      companyId,
      page,
      limit,
      search,
      allowedPlaylistIds,
    );

    return NextResponse.json({
      playlists,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error({ err: error }, 'Error fetching playlists:');
    return NextResponse.json({ error: 'Erro ao buscar playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
        Permission.CREATE_PLAYLIST,
        currentUser.permissions,
      )
    ) {
      return NextResponse.json({ error: 'Sem permissão para criar playlist' }, { status: 403 });
    }

    const body = await request.json();
    const result = createPlaylistSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    // Security: If not admin, force the user's company
    let companyIds = result.data.companyIds || [];
    if (currentUser.role !== 'admin' && currentUser.companyId) {
      companyIds = [currentUser.companyId];
    } else if (companyIds.length === 0 && currentUser.companyId) {
      // Default to user's company if none provided
      companyIds = [currentUser.companyId];
    }

    const playlist = await PlaylistRepository.create({
      ...result.data,
      companyIds,
    });

    logServerAction({
      userId: currentUser.id,
      userName: currentUser.name || currentUser.email,
      userRole: currentUser.role,
      action: 'CREATE',
      resource: 'playlist',
      details: `Playlist ${result.data.name} criada`,
      resourceId: playlist.id,
      resourceName: result.data.name,
    });

    return NextResponse.json({ playlist }, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, 'Error creating playlist:');
    return NextResponse.json({ error: 'Erro ao criar playlist' }, { status: 500 });
  }
}
