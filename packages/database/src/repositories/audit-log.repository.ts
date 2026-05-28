import { query } from '../db';

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  resource: string;
  resource_id?: string | null;
  resource_name?: string | null;
  details: string;
  metadata?: string | null;
  timestamp: Date;
  ip_address?: string | null;
}

export class AuditLogRepository {
  static async create(data: {
    user_id: string;
    user_name: string;
    user_role: string;
    action: string;
    resource: string;
    resource_id?: string;
    resource_name?: string;
    details: string;
    metadata?: string;
    ip_address?: string;
  }): Promise<AuditLog> {
    const { user_id, user_name, user_role, action, resource, resource_id, resource_name, details, metadata, ip_address } = data;
    
    const res = await query(
      `INSERT INTO audit_logs 
       (user_id, user_name, user_role, action, resource, resource_id, resource_name, details, metadata, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [user_id, user_name, user_role, action, resource, resource_id, resource_name, details, metadata, ip_address]
    );
    return res.rows[0];
  }

  static async findRecent(limit = 100): Promise<AuditLog[]> {
    const res = await query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1', [limit]);
    return res.rows;
  }

  static async findMany(options: {
    userId?: string;
    action?: string;
    resource?: string;
    resources?: string[];
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const { userId, action, resource, resources, startDate, endDate, limit = 100, offset = 0 } = options;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(userId);
    }

    if (action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(action);
    }

    if (resource) {
      conditions.push(`resource = $${paramIndex++}`);
      params.push(resource);
    } else if (resources && resources.length > 0) {
      // Create OR condition for resources
      const resourcePlaceholders = resources.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`resource IN (${resourcePlaceholders})`);
      params.push(...resources);
    }

    if (startDate) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      params.push(startDate);
    }

    if (endDate) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      params.push(endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Count total
    const countQuery = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;
    const countRes = await query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Fetch logs
    const logsQuery = `
      SELECT * FROM audit_logs 
      ${whereClause} 
      ORDER BY timestamp DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const logsRes = await query(logsQuery, [...params, limit, offset]);

    return { logs: logsRes.rows, total };
  }

  static async deleteOlderThan(date: Date): Promise<number> {
    const res = await query('DELETE FROM audit_logs WHERE timestamp < $1 RETURNING id', [date]);
    return res.rowCount || 0;
  }
}