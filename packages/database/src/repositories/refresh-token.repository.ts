import { query } from '../db';
import { randomBytes } from 'crypto';

export class RefreshTokenRepository {
  static generateToken(): string {
    return randomBytes(48).toString('hex');
  }

  static async findByToken(token: string): Promise<{ user_id: string; id: string } | null> {
    const res = await query(
      `SELECT id, user_id FROM sessions WHERE refresh_token = $1 AND last_seen > NOW() - INTERVAL '7 days'`,
      [token]
    );
    return res.rows[0] || null;
  }

  static async updateByOldToken(oldToken: string): Promise<string | null> {
    const row = await this.findByToken(oldToken);
    if (!row) return null;
    const newToken = this.generateToken();
    await query(
      'UPDATE sessions SET refresh_token = $2 WHERE id = $1',
      [row.id, newToken]
    );
    return newToken;
  }

  static async revokeByUserId(userId: string): Promise<void> {
    await query('UPDATE sessions SET refresh_token = NULL WHERE user_id = $1', [userId]);
  }
}
