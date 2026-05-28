import { query } from '../db';

export interface Session {
  id: string;
  user_id: string;
  token: string;
  device?: string | null;
  os?: string | null;
  ip?: string | null;
  last_seen: Date;
  created_at: Date;
  status?: 'online' | 'offline';
}

export class SessionRepository {
  static async create(data: { user_id: string; token: string; device?: string; os?: string; ip?: string }): Promise<Session> {
    const { user_id, token, device, os, ip } = data;
    const res = await query(
      'INSERT INTO sessions (user_id, token, device, os, ip) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, token, device, os, ip]
    );
    return res.rows[0];
  }

  static async findByToken(token: string): Promise<Session | null> {
    const res = await query('SELECT * FROM sessions WHERE token = $1', [token]);
    return res.rows[0] || null;
  }

  static async updateLastSeen(token: string, ip?: string): Promise<void> {
    if (ip) {
      await query('UPDATE sessions SET last_seen = NOW(), ip = $2 WHERE token = $1', [token, ip]);
    } else {
      await query('UPDATE sessions SET last_seen = NOW() WHERE token = $1', [token]);
    }
  }

  static async deleteByToken(token: string): Promise<void> {
    await query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  static async deleteById(id: string): Promise<void> {
    await query('DELETE FROM sessions WHERE id = $1', [id]);
  }

  static async deleteMany(options: { where: { token: string } }): Promise<void> {
    await this.deleteByToken(options.where.token);
  }

  static async findAllWithUser(): Promise<(Session & { user_name: string; user_email: string; user_role: string; status: 'online' | 'offline' })[]> {
    const res = await query(`
      SELECT s.*, u.name as user_name, u.email as user_email, u.role as user_role,
      CASE WHEN s.last_seen > NOW() - INTERVAL '5 minutes' THEN 'online' ELSE 'offline' END as status
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.last_seen DESC
    `);
    // @ts-ignore
    return res.rows;
  }

  static async cleanupExpired(minutes: number = 30): Promise<number> {
    // Delete sessions older than X minutes (inactive)
    const res = await query(
      `DELETE FROM sessions WHERE last_seen < NOW() - $1::interval RETURNING id`,
      [`${minutes} minutes`]
    );
    return res.rowCount || 0;
  }

  static async updateRefreshToken(sessionId: string, refreshToken: string | null): Promise<void> {
    await query('UPDATE sessions SET refresh_token = $2 WHERE id = $1', [sessionId, refreshToken]);
  }
}