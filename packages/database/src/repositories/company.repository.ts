import { query, getClient } from '../db/index';

const COMPANY_ALLOWED_COLUMNS = new Set([
  'name', 'description', 'color', 'created_by',
]);

export interface Company {
    id: string;
    name: string;
    description: string;
    color: string;
    created_by?: string;
    creator_name?: string;
    created_at: Date;
    updated_at: Date;
}

export class CompanyRepository {
    static async findAll(companyId?: string, page: number = 1, limit: number = 10, search?: string): Promise<{ companies: Company[], total: number }> {
        const offset = (page - 1) * limit;
        let whereClause = '';
        const params: any[] = [];

        if (companyId) {
            whereClause = 'WHERE id = $1';
            params.push(companyId);
        }

        if (search) {
            const searchClause = `(name ILIKE $${params.length + 1} OR description ILIKE $${params.length + 1})`;
            whereClause += whereClause ? ` AND ${searchClause}` : `WHERE ${searchClause}`;
            params.push(`%${search}%`);
        }

        // Count
        const countRes = await query(`SELECT COUNT(*) FROM companies ${whereClause}`, params);
        const total = parseInt(countRes.rows[0].count, 10);

        // Fetch
        const queryText = `
            SELECT c.*, u.name as creator_name 
            FROM companies c 
            LEFT JOIN users u ON c.created_by = u.id
            ${whereClause.replace('WHERE id =', 'WHERE c.id =')} 
            ORDER BY c.name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        const queryParams = [...params, limit, offset];

        const res = await query(queryText, queryParams);
        return { companies: res.rows, total };
    }

    static async findById(id: string): Promise<Company | null> {
        const res = await query('SELECT * FROM companies WHERE id = $1', [id]);
        return res.rows[0] || null;
    }

    static async findByName(name: string): Promise<Company | null> {
        const res = await query('SELECT * FROM companies WHERE name = $1', [name]);
        return res.rows[0] || null;
    }

    static async create(data: { name: string; description?: string; color?: string; createdBy?: string }): Promise<Company> {
        const { name, description = '', color = '#000000', createdBy = null } = data;
        const res = await query(
            'INSERT INTO companies (name, description, color, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, color, createdBy]
        );
        return res.rows[0];
    }

    static async createWithEditors(data: { name: string; description?: string; color?: string; createdBy?: string }, editorIds: string[]): Promise<Company> {
        const client = await getClient();
        try {
            await client.query('BEGIN');
            const { name, description = '', color = '#000000', createdBy = null } = data;
            
            // Create company
            const res = await client.query(
                'INSERT INTO companies (name, description, color, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, description, color, createdBy]
            );
            const company = res.rows[0];

            // Assign editors
            if (editorIds.length > 0) {
                await client.query(
                    'UPDATE users SET company_id = $1 WHERE id = ANY($2::uuid[])',
                    [company.id, editorIds]
                );
            }

            await client.query('COMMIT');
            return company;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async update(id: string, data: Partial<Company>): Promise<Company | null> {
        const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at' && key !== 'updated_at' && COMPANY_ALLOWED_COLUMNS.has(key));
        if (fields.length === 0) return this.findById(id);

        const setClause = fields.map((key, index) => `${key} = $${index + 2}`).join(', ');
        const values = [id, ...fields.map(key => (data as any)[key])];

        const res = await query(
            `UPDATE companies SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            values
        );
        return res.rows[0] || null;
    }

    static async delete(id: string): Promise<void> {
        await query('DELETE FROM companies WHERE id = $1', [id]);
    }
}
