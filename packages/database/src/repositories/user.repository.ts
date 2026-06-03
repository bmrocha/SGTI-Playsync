import { query } from '../db';

const USER_ALLOWED_COLUMNS = new Set([
  'email',
  'password',
  'name',
  'role',
  'company_id',
  'avatar',
  'theme',
  'primary_color',
  'force_password_reset',
  'two_factor_enabled',
  'two_factor_secret',
  'two_factor_temp_secret',
  'two_factor_setup_expires',
  'force_2fa_setup',
  'permissions',
]);

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: string;
  company_id?: string | null;
  avatar?: string | null;
  created_at: Date;
  updated_at: Date;
  last_login?: Date | null;
  force_password_reset: boolean;
  two_factor_secret?: string | null;
  two_factor_enabled?: boolean;
  force_2fa_setup?: boolean;
  two_factor_temp_secret?: string | null;
  two_factor_setup_expires?: Date | null;
  failed_login_attempts?: number;
  lockout_until?: Date | null;
  theme?: string;
  primary_color?: string;
  permissions?: string[];
}

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows[0] || null;
  }

  static async incrementFailedLogin(id: string): Promise<number> {
    const res = await query(
      'UPDATE users SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1 WHERE id = $1 RETURNING failed_login_attempts',
      [id],
    );
    return res.rows[0]?.failed_login_attempts || 0;
  }

  static async resetFailedLogin(id: string): Promise<void> {
    await query('UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = $1', [
      id,
    ]);
  }

  static async lockAccount(id: string, minutes: number): Promise<void> {
    const lockoutUntil = new Date(Date.now() + minutes * 60 * 1000);
    await query('UPDATE users SET lockout_until = $1 WHERE id = $2', [lockoutUntil, id]);
  }

  static async findById(id: string): Promise<User | null> {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async create(data: {
    email: string;
    password?: string;
    name: string;
    role: string;
    company_id?: string;
    force_password_reset?: boolean;
    force_2fa_setup?: boolean;
  }): Promise<User> {
    const {
      email,
      password,
      name,
      role,
      company_id,
      force_password_reset = false,
      force_2fa_setup = false,
    } = data;
    const res = await query(
      'INSERT INTO users (email, password, name, role, company_id, force_password_reset, force_2fa_setup) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [
        email,
        password || '',
        name,
        role,
        company_id || null,
        force_password_reset,
        force_2fa_setup,
      ],
    );
    return res.rows[0];
  }

  static async update(id: string, data: Partial<User>): Promise<User> {
    const fields = Object.keys(data).filter((key) => key !== 'id' && USER_ALLOWED_COLUMNS.has(key));
    if (fields.length === 0) return this.findById(id) as Promise<User>;

    const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [id, ...fields.map((key) => (data as any)[key])];

    const res = await query(
      `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values,
    );
    return res.rows[0];
  }

  static async updateLastLogin(id: string): Promise<void> {
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
  }

  static async findAll(
    companyId?: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: string,
  ): Promise<{ users: User[]; total: number }> {
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];

    if (companyId) {
      whereClause = 'WHERE company_id = $1';
      params.push(companyId);
    }

    if (role) {
      if (whereClause) {
        whereClause += ` AND role = $${params.length + 1}`;
      } else {
        whereClause = `WHERE role = $${params.length + 1}`;
      }
      params.push(role);
    }

    if (search) {
      const searchClause = `(name ILIKE $${params.length + 1} OR email ILIKE $${params.length + 1})`;
      if (whereClause) {
        whereClause += ` AND ${searchClause}`;
      } else {
        whereClause = `WHERE ${searchClause}`;
      }
      params.push(`%${search}%`);
    }

    // Count total
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countRes = await query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Fetch data
    const queryText = `SELECT * FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const queryParams = [...params, limit, offset];

    const res = await query(queryText, queryParams);
    return { users: res.rows, total };
  }

  static async count(): Promise<number> {
    const res = await query('SELECT COUNT(*) FROM users');
    return parseInt(res.rows[0].count, 10);
  }

  static async delete(id: string): Promise<void> {
    await query('DELETE FROM users WHERE id = $1', [id]);
  }

  static async updatePermissions(id: string, permissions: string[]): Promise<string[]> {
    const res = await query(
      'UPDATE users SET permissions = $1 WHERE id = $2 RETURNING permissions',
      [JSON.stringify(permissions), id],
    );
    return res.rows[0]?.permissions || [];
  }

  static async getPermissions(id: string): Promise<string[]> {
    const res = await query('SELECT permissions FROM users WHERE id = $1', [id]);
    return res.rows[0]?.permissions || [];
  }
}
