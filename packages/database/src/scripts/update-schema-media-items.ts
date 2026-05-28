
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined,
});

async function updateSchema() {
    try {
        console.log('Adding layout_template_id and region_config to media_items...');
        
        await pool.query(`
            ALTER TABLE media_items 
            ADD COLUMN IF NOT EXISTS layout_template_id TEXT,
            ADD COLUMN IF NOT EXISTS region_config JSONB;
        `);
        
        console.log('Schema updated successfully.');
    } catch (error) {
        console.error('Error updating schema:', error);
    } finally {
        await pool.end();
    }
}

updateSchema();
