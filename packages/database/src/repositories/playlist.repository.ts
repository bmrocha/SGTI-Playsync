import { query } from '../db/index';

// Define the interface that matches the database schema + relations
export interface Playlist {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  updated_at: Date;
  companies: { id: string; name: string; color: string }[];
  items: any[]; // media_items
}

const PLAYLIST_ALLOWED_COLUMNS = new Set(['name', 'description']);

export class PlaylistRepository {
  static async findAll(
    companyId?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    allowedPlaylistIds?: string[],
  ): Promise<{ playlists: Playlist[]; total: number }> {
    const offset = (page - 1) * limit;
    const params: any[] = [];
    let whereClause = '';
    const conditions: string[] = [];

    if (companyId) {
      conditions.push(`
                EXISTS (
                    SELECT 1 FROM company_playlists cp 
                    WHERE cp.playlist_id = p.id AND cp.company_id = $${params.length + 1}
                )
            `);
      params.push(companyId);
    }

    if (search) {
      conditions.push(`p.name ILIKE $${params.length + 1}`);
      params.push(`%${search}%`);
    }

    if (allowedPlaylistIds && allowedPlaylistIds.length > 0) {
      const placeholders = allowedPlaylistIds.map((_, i) => `$${params.length + i + 1}`).join(', ');
      conditions.push(`p.id IN (${placeholders})`);
      params.push(...allowedPlaylistIds);
    } else if (allowedPlaylistIds && allowedPlaylistIds.length === 0) {
      // User has sectors but no playlists match - return empty
      return { playlists: [], total: 0 };
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Count
    const countQuery = `SELECT COUNT(*) FROM playlists p ${whereClause}`;
    const countRes = await query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Fetch
    const queryText = `
            SELECT 
                p.*,
                COALESCE(
                    (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'color', c.color)) 
                     FROM company_playlists cp 
                     JOIN companies c ON c.id = cp.company_id 
                     WHERE cp.playlist_id = p.id), 
                    '[]'
                ) as companies,
                (
                    SELECT json_agg(mi ORDER BY mi."order")
                    FROM media_items mi
                    WHERE mi.playlist_id = p.id
                ) as items
            FROM playlists p
            ${whereClause}
            ORDER BY p.name ASC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

    const queryParams = [...params, limit, offset];
    const res = await query(queryText, queryParams);

    const playlists = res.rows.map((row) => ({
      ...row,
      items: row.items || [],
      companies: row.companies || [],
    }));

    return { playlists, total };
  }

  static async findById(id: string): Promise<Playlist | null> {
    const res = await query(
      `
            SELECT 
                p.*,
                COALESCE(
                    (SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'color', c.color)) 
                     FROM company_playlists cp 
                     JOIN companies c ON c.id = cp.company_id 
                     WHERE cp.playlist_id = p.id), 
                    '[]'
                ) as companies,
                (
                    SELECT json_agg(mi ORDER BY mi."order")
                    FROM media_items mi
                    WHERE mi.playlist_id = p.id
                ) as items
            FROM playlists p
            WHERE p.id = $1
        `,
      [id],
    );

    if (res.rows.length === 0) return null;

    const row = res.rows[0];
    return {
      ...row,
      items: row.items || [],
      companies: row.companies || [],
    };
  }

  static async findByName(name: string): Promise<Playlist | null> {
    const res = await query(
      `
            SELECT * FROM playlists WHERE name = $1
        `,
      [name],
    );
    return res.rows[0] || null;
  }

  static async create(data: {
    name: string;
    description?: string;
    companyIds?: string[];
  }): Promise<Playlist> {
    const { name, description = '', companyIds = [] } = data;

    try {
      await query('BEGIN');

      // 1. Create Playlist
      const res = await query(
        'INSERT INTO playlists (name, description) VALUES ($1, $2) RETURNING *',
        [name, description],
      );
      const playlist = res.rows[0];

      // 2. Link Companies
      if (companyIds.length > 0) {
        for (const companyId of companyIds) {
          await query('INSERT INTO company_playlists (company_id, playlist_id) VALUES ($1, $2)', [
            companyId,
            playlist.id,
          ]);
        }
      }

      await query('COMMIT');

      return this.findById(playlist.id) as Promise<Playlist>;
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async update(
    id: string,
    data: Partial<Playlist> & { companyIds?: string[]; items?: any[] },
  ): Promise<Playlist | null> {
    try {
      await query('BEGIN');

      // 1. Update Playlist fields
      const fields = Object.keys(data).filter(
        (key) =>
          key !== 'id' &&
          key !== 'created_at' &&
          key !== 'updated_at' &&
          key !== 'companyIds' &&
          key !== 'items' &&
          key !== 'companyNames' &&
          PLAYLIST_ALLOWED_COLUMNS.has(key),
      );

      if (fields.length > 0) {
        const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...fields.map((key) => (data as any)[key])];
        await query(`UPDATE playlists SET ${setClause}, updated_at = NOW() WHERE id = $1`, values);
      } else if (data.items) {
        await query('UPDATE playlists SET updated_at = NOW() WHERE id = $1', [id]);
      }

      // 2. Update Company Links
      if (data.companyIds) {
        // Remove existing
        await query('DELETE FROM company_playlists WHERE playlist_id = $1', [id]);
        // Add new
        for (const companyId of data.companyIds) {
          await query('INSERT INTO company_playlists (company_id, playlist_id) VALUES ($1, $2)', [
            companyId,
            id,
          ]);
        }
      }

      // 3. Update Media Items
      if (data.items) {
        // For simplicity, we'll replace all items
        // Real-world optimization: Diff check
        await query('DELETE FROM media_items WHERE playlist_id = $1', [id]);

        // Filter out items whose URL doesn't exist in media_library (only for image/video types)
        const validItems = await PlaylistRepository.filterValidItems(data.items);

        for (let i = 0; i < validItems.length; i++) {
          const item = validItems[i];
          await query(
            `INSERT INTO media_items (
                            id, playlist_id, type, url, name, duration, rotation, layout,
                            schedule_start_date, schedule_end_date, schedule_start_time, schedule_end_time,
                            schedule_days, schedule_all_day, schedule_enabled, "order", zones,
                            layout_template_id, region_config
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
            [
              item.id,
              id,
              item.type,
              item.url,
              item.name,
              item.duration || 10,
              item.rotation || 0,
              item.layout || 'single',
              item.schedule?.startDate || null,
              item.schedule?.endDate || null,
              item.schedule?.startTime || null,
              item.schedule?.endTime || null,
              JSON.stringify(item.schedule?.daysOfWeek || []),
              item.schedule?.allDay ?? true,
              item.schedule?.enabled ?? true,
              i, // Order
              item.zones ? JSON.stringify(item.zones) : null,
              item.layoutTemplateId || null,
              item.regionConfig ? JSON.stringify(item.regionConfig) : null,
            ],
          );
        }
      }

      await query('COMMIT');
      return this.findById(id);
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  static async filterValidItems(items: any[]): Promise<any[]> {
    if (!items || items.length === 0) return [];
    const valid: any[] = [];
    for (const item of items) {
      if (
        item.type === 'youtube' ||
        item.type === 'web' ||
        item.type === 'widget' ||
        item.type === 'layout'
      ) {
        valid.push(item);
        continue;
      }
      if (item.url && item.url.startsWith('blob:')) continue;
      const res = await query('SELECT 1 FROM media_library WHERE url = $1', [item.url]);
      if (res.rows.length > 0) {
        valid.push(item);
      }
    }
    return valid;
  }

  static async delete(id: string): Promise<void> {
    await query('DELETE FROM playlists WHERE id = $1', [id]);
  }
}
