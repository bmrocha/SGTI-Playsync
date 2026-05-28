
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function verifyMediaItems() {
    try {
        const result = await pool.query(`
            SELECT id, name, type, layout, layout_template_id, region_config
            FROM media_items
            ORDER BY created_at DESC
            LIMIT 5;
        `);

        console.log('Last 5 Media Items:');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (error) {
        console.error('Error verifying media items:', error);
    } finally {
        await pool.end();
    }
}

verifyMediaItems();
