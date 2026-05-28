import { requireLicense } from '@/lib/license-service';
import { NextResponse } from 'next/server';
import { savePlayer, getPlayers, removePlayer } from '@/lib/server-db';
import { logger } from '@/lib/logger';
import { logServerAction } from '@/lib/server-audit';

// POST: Receive heartbeat from TVAgent
export async function POST(request: Request) {
    const _lc = await requireLicense(); if (_lc) return _lc;
    try {
        const body = await request.json();
        const authHeader = request.headers.get('Authorization');
        let token = authHeader?.replace('Bearer ', '');

        // Fallback: Check body for token (Agent V1 compatibility)
        if (!token && body.token) {
            token = body.token;
        }

        if (!body.deviceId || !token) {
            return NextResponse.json({ error: 'Missing deviceId or token' }, { status: 400 });
        }

        // In a real app, validate token against DB. 
        // For MVP, if player exists, validate token. If not, we might allow auto-register or reject.
        // Let's assume we trust the token for now if we want to allow "Simulated" easy setup, 
        // or strictly enforce that the player must be created in Frontend first.

        const players = await getPlayers();
        let existingPlayer = players[body.deviceId];

        // LOGIC: Check if this token belongs to ANOTHER player (the "Pending" one created in Dashboard)
        // This solves the issue where Dashboard creates 'dev_123' but Agent connects as 'raspberrypi'
        // LOGIC: Check if this token belongs to ANOTHER player (the "Pending" one created in Dashboard)
        if (!existingPlayer) {
            const pendingPlayerId = Object.keys(players).find(id => players[id].token === token);

            if (pendingPlayerId) {
                const pendingPlayer = players[pendingPlayerId];
                logger.info({ pendingId: pendingPlayer.id, deviceId: body.deviceId }, '[Heartbeat] Adoption: Merging pending player into real device');

                // Inherit config from the pending player
                existingPlayer = {
                    ...pendingPlayer,
                    id: body.deviceId, // Switch to real hardware ID
                    status: 'online'
                };

                // Delete the temporary pending player to avoid duplicates
                await removePlayer(pendingPlayerId);
            } else {
                // STRICT PROVISIONING: Reject unknown devices that match no pending token
                logger.warn({ deviceId: body.deviceId }, '[Heartbeat] Unknown device rejected');
                return NextResponse.json({ error: 'Device not provisioned' }, { status: 404 });
            }
        }

        // Blocked check removed (Hard Delete strategy used instead)

        if (existingPlayer && existingPlayer.token !== token) {
            logger.warn({ deviceId: body.deviceId, expectedToken: existingPlayer.token }, '[Heartbeat] Invalid token');
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Update or Create Player State (Server Side)
        const updatedPlayer = {
            ...(existingPlayer || {}), // Preserve existing (or adopted) data
            id: body.deviceId,
            name: existingPlayer?.name || `New Device (${body.deviceId.substring(0, 4)})`,
            token: token,
            status: 'online' as const,
            lastSeen: new Date().toISOString(),
            metrics: {
                cpu: body.metrics?.cpu || 0,
                mem: body.metrics?.memory || 0,
                disk: body.metrics?.disk || 0,
                uptime: body.metrics?.uptime || 0,
                latency: body.metrics?.latency
            },
            ip: body.ip?.local || existingPlayer?.ip,
            agentVersion: body.agentVersion,
            playerVersion: body.playerVersion,
            // Ensure critical fields are preserved from the adopted profile or existing profile
            companyId: existingPlayer?.companyId || body.companyId, // companyId usually not in body, so relies on existing
            location: existingPlayer?.location,                   // location not in body
            credentials: existingPlayer?.credentials               // Explicitly preserve credentials object
        };

        // If 'location' is empty/undefined and we are NOT adopting (fresh), we might default it?
        // But for now, let's keep it clean. 
        // NOTE: The issue might be that `existingPlayer` from `getPlayers` has `location` as valid string,
        // but the spread `...(existingPlayer || {})` at the top of updatedPlayer might be shadowed?
        // No, spread comes first.
        // Wait, `updatedPlayer` properties override the spread.
        // I define `location: existingPlayer?.location` at the bottom. This should work.

        // Debug Adoption
        if (updatedPlayer.name !== `New Device (${body.deviceId.substring(0, 4)})`) {
            // It has a custom name (Adopted or Edited)
            // Ensure we aren't losing data.
        }

        if (existingPlayer) {
            updatedPlayer.name = existingPlayer.name;
        }

        logger.info({ deviceId: body.deviceId, status: updatedPlayer.status }, '[Heartbeat] Received');
        await savePlayer(updatedPlayer);

        logServerAction({
            userId: updatedPlayer.id,
            userName: updatedPlayer.name,
            userRole: 'player',
            action: 'HEARTBEAT',
            resource: 'player',
            details: `Heartbeat de ${updatedPlayer.name} (status: ${updatedPlayer.status})`,
            resourceId: updatedPlayer.id,
            resourceName: updatedPlayer.name
        });

        return NextResponse.json({ status: 'ok', command: null }); // Respond with potential commands
    } catch (error) {
        logger.error({ err: error }, 'Heartbeat error:');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// GET: Frontend polls this to get latest statuses
import { getCurrentUser } from '@/lib/server-auth';
import { UserRole } from '@/lib/permissions';

export async function GET() {
    const _lc = await requireLicense(); if (_lc) return _lc;
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = currentUser.role === UserRole.ADMIN ? undefined : (currentUser.companyId || undefined);
    const players = await getPlayers(companyId);
    return NextResponse.json(players);
}
