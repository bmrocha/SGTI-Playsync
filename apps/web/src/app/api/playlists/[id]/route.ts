import { requireLicense } from '@/lib/license-service';
import { NextRequest, NextResponse } from 'next/server';
import { PlaylistRepository } from '@playsync/database';
import { getCurrentUser } from '@/lib/server-auth';
import { hasPermission, Permission } from '@/lib/permissions';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

const updatePlaylistSchema = z.object({
    name: z.string().min(1, 'Nome é obrigatório').optional(),
    description: z.string().optional(),
    companyIds: z.array(z.string()).optional(),
    items: z.array(z.any()).optional()
});

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        if (!hasPermission(currentUser.role as any, Permission.EDIT_PLAYLIST)) {
            return NextResponse.json({ error: 'Sem permissão para editar playlists' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const result = updatePlaylistSchema.safeParse(body);
        
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const updatedPlaylist = await PlaylistRepository.update(id, result.data);
        
        if (!updatedPlaylist) {
            return NextResponse.json(
                { error: 'Playlist não encontrada' },
                { status: 404 }
            );
        }

        logServerAction({
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            userRole: currentUser.role,
            action: 'UPDATE',
            resource: 'playlist',
            details: `Playlist ${updatedPlaylist.name} atualizada`,
            resourceId: id,
            resourceName: updatedPlaylist.name
        });

        return NextResponse.json({ playlist: updatedPlaylist });
    } catch (error) {
        logger.error({ err: error }, 'Error updating playlist:');
        return NextResponse.json(
            { error: 'Erro ao atualizar playlist' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        if (!hasPermission(currentUser.role as any, Permission.DELETE_PLAYLIST)) {
            return NextResponse.json({ error: 'Sem permissão para excluir playlists' }, { status: 403 });
        }

        const { id } = await params;
        await PlaylistRepository.delete(id);

        logServerAction({
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            userRole: currentUser.role,
            action: 'DELETE',
            resource: 'playlist',
            details: `Playlist ${id} removida`,
            resourceId: id
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error({ err: error }, 'Error deleting playlist:');
        return NextResponse.json(
            { error: 'Erro ao excluir playlist' },
            { status: 500 }
        );
    }
}
