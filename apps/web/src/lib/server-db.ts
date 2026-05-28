import { PlayerRepository } from '@playsync/database';
import { logger } from '@/lib/logger';

export interface ServerPlayer {
    id: string;
    name: string;
    token: string;
    status: 'online' | 'offline';
    lastSeen: string; // ISO String
    metrics?: any;
    ip?: string;
    agentVersion?: string;
    playerVersion?: string;

    // User managed fields
    companyId?: string;
    location?: string;
    currentPlaylistId?: string;
    credentials?: {
        ip: string;
        username: string;
        password?: string;
        sshKey?: string;
    };
}

export const getPlayers = async (companyId?: string): Promise<Record<string, ServerPlayer>> => {
    try {
        // Use repository to get all players
        const players = await PlayerRepository.findAll(companyId);

        // Map List to Record (Dictionary) for compatibility
        const playersRecord: Record<string, ServerPlayer> = {};

        players.forEach(p => {
            playersRecord[p.id] = {
                id: p.id,
                name: p.name,
                token: p.token,
                status: p.status as 'online' | 'offline',
                lastSeen: new Date(p.last_seen).toISOString(),
                companyId: p.company_id || undefined,
                location: p.location || undefined,
                currentPlaylistId: p.current_playlist_id || undefined,
                metrics: p.metrics ? JSON.parse(p.metrics) : undefined,
                credentials: p.credentials ? JSON.parse(p.credentials) : undefined,
            };
        });

        return playersRecord;
    } catch (error) {
        logger.error({ err: error }, "DB Get Error");
        return {};
    }
};

export const savePlayer = async (player: ServerPlayer) => {
    try {
        const { query } = await import('@playsync/database');
        
        // Upsert logic
        const existing = await PlayerRepository.findById(player.id);
        
        if (existing) {
            await query(
                `UPDATE players SET 
                    name = $1, token = $2, company_id = $3, location = $4, 
                    current_playlist_id = $5, status = $6, last_seen = $7, 
                    metrics = $8, credentials = $9, updated_at = NOW() 
                WHERE id = $10`,
                [
                    player.name,
                    player.token,
                    player.companyId,
                    player.location,
                    player.currentPlaylistId,
                    player.status,
                    new Date(player.lastSeen),
                    JSON.stringify(player.metrics || {}),
                    JSON.stringify(player.credentials || {}),
                    player.id
                ]
            );
        } else {
            await query(
                `INSERT INTO players (
                    id, name, token, company_id, location, 
                    current_playlist_id, status, last_seen, 
                    metrics, credentials
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    player.id,
                    player.name,
                    player.token,
                    player.companyId,
                    player.location,
                    player.currentPlaylistId,
                    player.status,
                    new Date(player.lastSeen),
                    JSON.stringify(player.metrics || {}),
                    JSON.stringify(player.credentials || {})
                ]
            );
        }
    } catch (error) {
        logger.error({ err: error }, "DB Save Error");
    }
};

export const removePlayer = async (id: string) => {
    try {
        const { query } = await import('@playsync/database');
        await query('DELETE FROM players WHERE id = $1', [id]);
    } catch (error) {
        // Ignore if not found
    }
};
