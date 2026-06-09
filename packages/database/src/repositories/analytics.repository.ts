import { query } from '../db';

export interface PlaybackLog {
  id: string;
  player_id?: string | null;
  media_item_id?: string;
  playlist_id?: string;
  company_id?: string;
  played_at: Date;
  duration_played: number;
  error_message?: string;
}

export interface CreatePlaybackLogDTO {
  player_id?: string | null;
  media_item_id?: string;
  playlist_id?: string;
  company_id?: string;
  played_at: string | Date;
  duration_played: number;
  error_message?: string;
}

export class AnalyticsRepository {
  static async create(data: CreatePlaybackLogDTO): Promise<PlaybackLog> {
    const res = await query(
      `INSERT INTO playback_logs (
                player_id, media_item_id, playlist_id, company_id, 
                played_at, duration_played, error_message
            ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        data.player_id || null,
        data.media_item_id || null,
        data.playlist_id || null,
        data.company_id || null,
        data.played_at,
        data.duration_played,
        data.error_message || null,
      ],
    );
    return res.rows[0];
  }

  static async createMany(logs: CreatePlaybackLogDTO[]): Promise<void> {
    if (logs.length === 0) return;

    // Multi-row INSERT — muito mais rapido que INSERT individual em transacao
    const cols = [
      'player_id',
      'media_item_id',
      'playlist_id',
      'company_id',
      'played_at',
      'duration_played',
      'error_message',
    ];
    const values: unknown[] = [];
    const placeholders: string[] = [];

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const offset = i * cols.length;
      placeholders.push(
        `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`,
      );
      values.push(
        log.player_id || null,
        log.media_item_id || null,
        log.playlist_id || null,
        log.company_id || null,
        log.played_at,
        log.duration_played,
        log.error_message || null,
      );
    }

    await query(
      `INSERT INTO playback_logs (${cols.join(', ')}) VALUES ${placeholders.join(', ')}`,
      values,
    );
  }

  static async getLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    companyId?: string;
    playerId?: string;
  }): Promise<unknown[]> {
    let queryStr = `
            SELECT 
                pl.id,
                pl.player_id,
                pl.media_item_id,
                pl.playlist_id,
                pl.company_id,
                pl.played_at,
                pl.duration_played,
                mi.name as media_name,
                c.name as company_name,
                p.name as playlist_name
            FROM playback_logs pl
            LEFT JOIN media_items mi ON pl.media_item_id = mi.id
            LEFT JOIN companies c ON pl.company_id = c.id
            LEFT JOIN playlists p ON pl.playlist_id = p.id
            WHERE 1=1
        `;

    const params: unknown[] = [];
    let paramCount = 1;

    if (filters.startDate) {
      queryStr += ` AND pl.played_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      queryStr += ` AND pl.played_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    if (filters.companyId) {
      queryStr += ` AND pl.company_id = $${paramCount}`;
      params.push(filters.companyId);
      paramCount++;
    }

    if (filters.playerId) {
      queryStr += ` AND pl.player_id = $${paramCount}`;
      params.push(filters.playerId);
      paramCount++;
    }

    queryStr += ` ORDER BY pl.played_at DESC LIMIT 5000`; // Limit to prevent overload

    const res = await query(queryStr, params);
    return res.rows;
  }
}
