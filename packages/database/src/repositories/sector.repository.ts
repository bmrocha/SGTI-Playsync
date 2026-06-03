import { query } from '../db';

export interface Sector {
  id: string;
  name: string;
  company_id?: string | null;
  description?: string | null;
  created_at: Date;
  updated_at: Date;
}

export class SectorRepository {
  static async findAll(companyId?: string): Promise<Sector[]> {
    if (companyId) {
      const res = await query('SELECT * FROM sectors WHERE company_id = $1 ORDER BY name', [
        companyId,
      ]);
      return res.rows;
    }
    const res = await query('SELECT * FROM sectors ORDER BY name');
    return res.rows;
  }

  static async findById(id: string): Promise<Sector | null> {
    const res = await query('SELECT * FROM sectors WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async create(data: {
    name: string;
    company_id?: string | null;
    description?: string | null;
  }): Promise<Sector> {
    const res = await query(
      'INSERT INTO sectors (name, company_id, description) VALUES ($1, $2, $3) RETURNING *',
      [data.name, data.company_id || null, data.description || null],
    );
    return res.rows[0];
  }

  static async update(
    id: string,
    data: { name?: string; description?: string | null },
  ): Promise<Sector | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await query(
      `UPDATE sectors SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return res.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const res = await query('DELETE FROM sectors WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  }

  // Junction: playlist <-> sectors
  static async getPlaylistSectors(playlistId: string): Promise<Sector[]> {
    const res = await query(
      `SELECT s.* FROM sectors s
       INNER JOIN playlist_sectors ps ON s.id = ps.sector_id
       WHERE ps.playlist_id = $1
       ORDER BY s.name`,
      [playlistId],
    );
    return res.rows;
  }

  static async setPlaylistSectors(playlistId: string, sectorIds: string[]): Promise<void> {
    await query('BEGIN');
    try {
      await query('DELETE FROM playlist_sectors WHERE playlist_id = $1', [playlistId]);
      for (const sectorId of sectorIds) {
        await query(
          'INSERT INTO playlist_sectors (playlist_id, sector_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [playlistId, sectorId],
        );
      }
      await query('COMMIT');
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }
  }

  // Junction: user <-> sectors
  static async getUserSectors(userId: string): Promise<Sector[]> {
    const res = await query(
      `SELECT s.* FROM sectors s
       INNER JOIN user_sectors us ON s.id = us.sector_id
       WHERE us.user_id = $1
       ORDER BY s.name`,
      [userId],
    );
    return res.rows;
  }

  static async getUserSectorIds(userId: string): Promise<string[]> {
    const res = await query(
      'SELECT sector_id FROM user_sectors WHERE user_id = $1 ORDER BY sector_id',
      [userId],
    );
    return res.rows.map((r) => r.sector_id);
  }

  static async setUserSectors(userId: string, sectorIds: string[]): Promise<void> {
    await query('BEGIN');
    try {
      await query('DELETE FROM user_sectors WHERE user_id = $1', [userId]);
      for (const sectorId of sectorIds) {
        await query(
          'INSERT INTO user_sectors (user_id, sector_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [userId, sectorId],
        );
      }
      await query('COMMIT');
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }
  }

  // Get sector IDs for a playlist (lightweight)
  static async getPlaylistSectorIds(playlistId: string): Promise<string[]> {
    const res = await query(
      'SELECT sector_id FROM playlist_sectors WHERE playlist_id = $1 ORDER BY sector_id',
      [playlistId],
    );
    return res.rows.map((r) => r.sector_id);
  }

  // Get playlists that match any of the given sector IDs
  static async getPlaylistIdsBySectorIds(sectorIds: string[]): Promise<string[]> {
    if (sectorIds.length === 0) return [];
    const placeholders = sectorIds.map((_, i) => `$${i + 1}`).join(', ');
    const res = await query(
      `SELECT DISTINCT playlist_id FROM playlist_sectors WHERE sector_id IN (${placeholders})`,
      sectorIds,
    );
    return res.rows.map((r) => r.playlist_id);
  }
}
