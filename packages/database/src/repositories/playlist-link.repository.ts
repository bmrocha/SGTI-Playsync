import { query } from '../db/index';

export interface PlaylistLink {
  id: string;
  company_id: string;
  playlist_id: string;
  theme: string;
  primary_color: string | null;
  access_count: number;
  created_at: Date;
  updated_at: Date;
}

export class PlaylistLinkRepository {
  static async findById(id: string): Promise<PlaylistLink | null> {
    const res = await query('SELECT * FROM playlist_links WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findByPlaylistId(playlistId: string): Promise<PlaylistLink | null> {
    const res = await query(
      'SELECT * FROM playlist_links WHERE playlist_id = $1 ORDER BY created_at ASC LIMIT 1',
      [playlistId],
    );
    return res.rows[0] || null;
  }

  static async findByCompanyAndPlaylist(
    companyId: string,
    playlistId: string,
  ): Promise<PlaylistLink | null> {
    const res = await query(
      'SELECT * FROM playlist_links WHERE company_id = $1 AND playlist_id = $2',
      [companyId, playlistId],
    );
    return res.rows[0] || null;
  }

  static async create(
    id: string,
    companyId: string,
    playlistId: string,
    theme: string = 'light',
    primaryColor?: string,
  ): Promise<PlaylistLink> {
    const res = await query(
      'INSERT INTO playlist_links (id, company_id, playlist_id, theme, primary_color) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, companyId, playlistId, theme, primaryColor || null],
    );
    return res.rows[0];
  }

  static async updateAccessCount(id: string): Promise<void> {
    await query('UPDATE playlist_links SET access_count = access_count + 1 WHERE id = $1', [id]);
  }

  static async updateTheme(id: string, theme: string): Promise<void> {
    await query('UPDATE playlist_links SET theme = $1, updated_at = NOW() WHERE id = $2', [
      theme,
      id,
    ]);
  }

  static async updatePrimaryColor(id: string, primaryColor: string): Promise<void> {
    await query('UPDATE playlist_links SET primary_color = $1, updated_at = NOW() WHERE id = $2', [
      primaryColor,
      id,
    ]);
  }

  static async updateThemeAndColor(
    id: string,
    theme: string,
    primaryColor: string | null,
  ): Promise<void> {
    await query(
      'UPDATE playlist_links SET theme = $1, primary_color = $2, updated_at = NOW() WHERE id = $3',
      [theme, primaryColor, id],
    );
  }

  static async delete(id: string): Promise<void> {
    await query('DELETE FROM playlist_links WHERE id = $1', [id]);
  }

  static async countByPlaylistId(playlistId: string): Promise<number> {
    const res = await query('SELECT COUNT(*) FROM playlist_links WHERE playlist_id = $1', [
      playlistId,
    ]);
    return parseInt(res.rows[0].count, 10);
  }
}
