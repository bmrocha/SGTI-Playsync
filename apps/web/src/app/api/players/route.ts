import { requireLicense } from '@/lib/license-service';
import { NextResponse } from 'next/server';
import { savePlayer, getPlayers } from '@/lib/server-db';
import { getCurrentUser } from '@/lib/server-auth';
import { Permission, hasPermission, UserRole } from '@/lib/permissions';
import { PlayerRepository } from '@playsync/database';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';
import { z } from 'zod';

// GET: List players with pagination
export async function GET(request: Request) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        // Check if user has permission to view players
        // Note: Viewers might need this too, check permissions
        if (!hasPermission(currentUser.role as UserRole, Permission.VIEW_PLAYER)) {
             // Fallback: if VIEW_PLAYER is not assigned to VIEWER but they need to see players?
             // Usually VIEWER only sees Playlists. Let's stick to strict permission.
             return NextResponse.json({ error: 'Sem permissão para visualizar players' }, { status: 403 });
        }

        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const search = url.searchParams.get('search') || undefined;
        const status = url.searchParams.get('status') || undefined;

        // Company filter logic: Admin sees all (unless filtered), others see their company's
        let companyId = currentUser.role === UserRole.ADMIN ? undefined : (currentUser.companyId || undefined);
        
        // If admin wants to filter by specific company
        if (currentUser.role === UserRole.ADMIN && url.searchParams.has('companyId')) {
             companyId = url.searchParams.get('companyId') || undefined;
        }

        const { players: rawPlayers, total } = await PlayerRepository.findAllPaginated(companyId, page, limit, search, status);

        const isAdmin = currentUser.role === UserRole.ADMIN;

        const players = rawPlayers.map(p => ({
            id: p.id,
            name: p.name,
            ...(isAdmin ? { token: p.token } : {}),
            status: p.status,
            lastSeen: p.last_seen ? new Date(p.last_seen).toISOString() : null,
            companyId: p.company_id,
            location: p.location,
            ...(isAdmin ? { credentials: p.credentials ? (typeof p.credentials === 'string' ? JSON.parse(p.credentials) : p.credentials) : {} } : {}),
            metrics: p.metrics ? (typeof p.metrics === 'string' ? JSON.parse(p.metrics) : p.metrics) : {},
            currentPlaylistId: p.current_playlist_id,
            attachedFiles: [],
            version: { agent: '1.0.0', player: '1.0.0' }
        }));

        return NextResponse.json({
            players,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logger.error({ err: error }, 'Get Players error:');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Create a new player (pending adoption)
export async function POST(request: Request) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        if (!hasPermission(currentUser.role as UserRole, Permission.CREATE_PLAYER)) {
            return NextResponse.json({ error: 'Sem permissão para criar player' }, { status: 403 });
        }

        const body = await request.json();
        const { name, companyId, location, credentials } = body;

        if (!name || !companyId || !location) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 });
        }

        // Generate ID and Token
        const id = `dev_${Math.random().toString(36).substring(2, 6)}`;
        const token = Buffer.from(`${id}:${crypto.randomUUID()}`).toString('base64');

        const newPlayer = {
            id,
            name,
            token,
            status: 'offline' as const,
            lastSeen: new Date().toISOString(),
            companyId,
            location,
            credentials: credentials || {},
            metrics: {},
            currentPlaylistId: undefined
        };

        await savePlayer(newPlayer);

        logServerAction({
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            userRole: currentUser.role,
            action: 'CREATE',
            resource: 'player',
            details: `Player ${name} criado`,
            resourceId: id,
            resourceName: name
        });

        return NextResponse.json(newPlayer, { status: 201 });
    } catch (error) {
        logger.error({ err: error }, 'Create Player error:');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT: Update specific payer fields (from Dashboard)
export async function PUT(request: Request) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        if (!hasPermission(currentUser.role as UserRole, Permission.EDIT_PLAYER)) {
            return NextResponse.json({ error: 'Sem permissão para editar player' }, { status: 403 });
        }

        const body = await request.json();

        const updateSchema = z.object({
            id: z.string().min(1, 'ID é obrigatório'),
            updates: z.object({
                name: z.string().min(1).optional(),
                companyId: z.string().optional(),
                location: z.string().optional(),
                credentials: z.object({
                    ip: z.string().optional(),
                    username: z.string().optional(),
                    password: z.string().optional(),
                    sshKey: z.string().optional(),
                }).optional(),
            })
        });

        const validation = updateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
        }

        const { id, updates } = validation.data;

        const players = await getPlayers();
        const existingPlayer = players[id];

        if (!existingPlayer) {
            return NextResponse.json({ error: 'Player not found' }, { status: 404 });
        }

        const existingCreds = existingPlayer.credentials || { ip: '', username: '' };
        const updatedPlayer = {
            ...existingPlayer,
            name: updates.name ?? existingPlayer.name,
            companyId: updates.companyId ?? existingPlayer.companyId,
            location: updates.location ?? existingPlayer.location,
            credentials: updates.credentials !== undefined
                ? { ...existingCreds, ...updates.credentials }
                : existingPlayer.credentials,
        };

        await savePlayer(updatedPlayer);

        logServerAction({
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            userRole: currentUser.role,
            action: 'UPDATE',
            resource: 'player',
            details: `Player ${updatedPlayer.name} atualizado`,
            resourceId: id,
            resourceName: updatedPlayer.name
        });

        return NextResponse.json(updatedPlayer);
    } catch (error) {
        logger.error({ err: error }, 'Update Player error:');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE: Remove a player
export async function DELETE(request: Request) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        }

        if (!hasPermission(currentUser.role as UserRole, Permission.DELETE_PLAYER)) {
            return NextResponse.json({ error: 'Sem permissão para remover player' }, { status: 403 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const { removePlayer } = await import('@/lib/server-db');
        await removePlayer(id);

        logServerAction({
            userId: currentUser.id,
            userName: currentUser.name || currentUser.email,
            userRole: currentUser.role,
            action: 'DELETE',
            resource: 'player',
            details: `Player ${id} removido`,
            resourceId: id
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error({ err: error }, 'Delete Player error:');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
