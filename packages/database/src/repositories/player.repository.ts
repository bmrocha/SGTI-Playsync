import { query } from '../db';

const PLAYER_ALLOWED_COLUMNS = new Set([
  'name', 'location', 'status', 'metrics', 'credentials', 'current_playlist_id',
]);

export interface Player {
  id: string;
  name: string;
  token: string;
  company_id?: string | null;
  location?: string | null;
  status: string;
  last_seen: Date;
  metrics?: string | null;
  credentials?: string | null;
  current_playlist_id?: string | null;
  created_at: Date;
  updated_at: Date;
}

export class PlayerRepository {
  static async create(data: { id: string; name: string; token: string; company_id?: string; location?: string }): Promise<Player> {
    const { id, name, token, company_id, location } = data;
    const res = await query(
      'INSERT INTO players (id, name, token, company_id, location) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, token, company_id, location]
    );
    return res.rows[0];
  }

  static async findAll(companyId?: string): Promise<Player[]> {
    if (companyId) {
        const res = await query('SELECT * FROM players WHERE company_id = $1 ORDER BY name ASC', [companyId]);
        return res.rows;
    }
    const res = await query('SELECT * FROM players ORDER BY name ASC');
    return res.rows;
  }

  static async findAllPaginated(companyId?: string, page: number = 1, limit: number = 10, search?: string, status?: string): Promise<{ players: Player[], total: number }> {
    const offset = (page - 1) * limit;
    const params: any[] = [];
    const conditions: string[] = [];

    if (companyId) {
        conditions.push(`company_id = $${params.length + 1}`);
        params.push(companyId);
    }

    if (search) {
        conditions.push(`(name ILIKE $${params.length + 1} OR location ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
    }

    if (status) {
        if (status === 'online') {
            conditions.push(`(status = 'online' AND last_seen > NOW() - INTERVAL '30 seconds')`);
        } else if (status === 'offline') {
            conditions.push(`(status = 'offline' OR last_seen <= NOW() - INTERVAL '30 seconds' OR last_seen IS NULL)`);
        }
    }

    let whereClause = '';
    if (conditions.length > 0) {
        whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    // Count
    const countQuery = `SELECT COUNT(*) FROM players ${whereClause}`;
    const countRes = await query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Fetch
    const queryText = `SELECT * FROM players ${whereClause} ORDER BY name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];
    const res = await query(queryText, queryParams);

    return { players: res.rows, total };
  }

  static async findById(id: string): Promise<Player | null> {
    const res = await query('SELECT * FROM players WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async findByToken(token: string): Promise<Player | null> {
    const res = await query('SELECT * FROM players WHERE token = $1', [token]);
    return res.rows[0] || null;
  }

  static async updateStatus(id: string, status: string, metrics?: string): Promise<void> {
    const res = await query(
      'UPDATE players SET status = $1, last_seen = NOW(), metrics = COALESCE($2, metrics) WHERE id = $3 RETURNING *',
      [status, metrics, id]
    );
  }

  static async update(id: string, data: Partial<Player>): Promise<Player> {
    const fields = Object.keys(data).filter(key => key !== 'id' && PLAYER_ALLOWED_COLUMNS.has(key));
    if (fields.length === 0) return this.findById(id) as Promise<Player>;

    const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map(key => (data as any)[key])];

    const res = await query(
      `UPDATE players SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    return res.rows[0];
  }
}