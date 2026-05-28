import pool from '../db/index';
import { z } from 'zod';

export const PlaybackLogSchema = z.object({
  player_id: z.string(),
  media_item_id: z.string().optional().nullable(),
  playlist_id: z.string().optional().nullable(),
  company_id: z.string().optional().nullable(),
  duration_played: z.number().int().nonnegative().default(0),
  error_message: z.string().optional().nullable(),
  played_at: z.string().datetime().optional()
});

export type PlaybackLogInput = z.infer<typeof PlaybackLogSchema>;

export class PlaybackLogRepository {
  static async create(data: PlaybackLogInput) {
    const {
      player_id,
      media_item_id,
      playlist_id,
      company_id,
      duration_played,
      error_message,
      played_at
    } = data;

    const query = `
      INSERT INTO playback_logs (
        player_id,
        media_item_id,
        playlist_id,
        company_id,
        duration_played,
        error_message,
        played_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, CURRENT_TIMESTAMP))
      RETURNING *
    `;

    const values = [
      player_id,
      media_item_id,
      playlist_id,
      company_id,
      duration_played,
      error_message,
      played_at
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getStatsByCompany(companyId: string, startDate?: Date, endDate?: Date) {
    let query = `
      SELECT 
        COUNT(*) as total_plays,
        SUM(duration_played) as total_duration,
        COUNT(DISTINCT player_id) as active_players
      FROM playback_logs
      WHERE company_id = $1
    `;
    
    const params: any[] = [companyId];
    
    if (startDate) {
      query += ` AND played_at >= $${params.length + 1}`;
      params.push(startDate);
    }
    
    if (endDate) {
      query += ` AND played_at <= $${params.length + 1}`;
      params.push(endDate);
    }

    const result = await pool.query(query, params);
    return result.rows[0];
  }
}
