import { query } from '../db';

export class RateLimitRepository {
  static async checkAndIncrement(ip: string, endpoint: string, maxCount: number, windowMs: number): Promise<{ allowed: boolean; currentCount: number }> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowMs);

    const res = await query(
      `INSERT INTO rate_limits (ip, endpoint, count, expires_at)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (ip, endpoint) DO UPDATE
         SET count = CASE
           WHEN rate_limits.expires_at < NOW() THEN 1
           ELSE rate_limits.count + 1
         END,
         expires_at = CASE
           WHEN rate_limits.expires_at < NOW() THEN $3
           ELSE rate_limits.expires_at
         END
       RETURNING count, expires_at`,
      [ip, endpoint, expiresAt]
    );

    const currentCount = res.rows[0].count;
    const recordExpiresAt = new Date(res.rows[0].expires_at);

    return {
      allowed: currentCount <= maxCount,
      currentCount
    };
  }

  static async cleanupExpired(): Promise<number> {
    const res = await query('DELETE FROM rate_limits WHERE expires_at < NOW() RETURNING id');
    return res.rowCount || 0;
  }
}
