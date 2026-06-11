import { query } from '../db/index';

export interface PlaylistLinkViewer {
  id: string;
  playlist_link_id: string;
  viewer_id: string;
  last_heartbeat: Date;
  user_agent: string | null;
  ip_address: string | null;
  created_at: Date;
}

export class PlaylistLinkViewerRepository {
  // Register or update a viewer's heartbeat
  static async upsertHeartbeat(
    playlistLinkId: string,
    viewerId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<void> {
    await query(
      `INSERT INTO playlist_link_viewers (playlist_link_id, viewer_id, user_agent, ip_address, last_heartbeat)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (playlist_link_id, viewer_id)
       DO UPDATE SET last_heartbeat = NOW(), user_agent = COALESCE($3, playlist_link_viewers.user_agent), ip_address = COALESCE($4, playlist_link_viewers.ip_address)`,
      [playlistLinkId, viewerId, userAgent || null, ipAddress || null],
    );
  }

  // Get count of active viewers (heartbeat within last 2 minutes)
  static async getActiveViewerCount(playlistLinkId: string): Promise<number> {
    const res = await query(
      `SELECT COUNT(DISTINCT viewer_id) as count
       FROM playlist_link_viewers
       WHERE playlist_link_id = $1
       AND last_heartbeat > NOW() - INTERVAL '2 minutes'`,
      [playlistLinkId],
    );
    return parseInt(res.rows[0].count, 10);
  }

  // Get all active viewers details
  static async getActiveViewers(playlistLinkId: string): Promise<PlaylistLinkViewer[]> {
    const res = await query(
      `SELECT *
       FROM playlist_link_viewers
       WHERE playlist_link_id = $1
       AND last_heartbeat > NOW() - INTERVAL '2 minutes'
       ORDER BY last_heartbeat DESC`,
      [playlistLinkId],
    );
    return res.rows;
  }

  // Remove inactive viewers (cleanup old records)
  static async cleanupInactive(viewerIds: string[]): Promise<void> {
    if (viewerIds.length === 0) return;
    await query(
      `DELETE FROM playlist_link_viewers
       WHERE viewer_id = ANY($1)
       AND last_heartbeat < NOW() - INTERVAL '5 minutes'`,
      [viewerIds],
    );
  }

  // Remove viewer completely (when they close the player)
  static async removeViewer(playlistLinkId: string, viewerId: string): Promise<void> {
    await query(
      'DELETE FROM playlist_link_viewers WHERE playlist_link_id = $1 AND viewer_id = $2',
      [playlistLinkId, viewerId],
    );
  }
}
