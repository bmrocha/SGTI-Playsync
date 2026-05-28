import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

// Also try .env.local if it exists (overrides .env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function verifySchema() {
  try {
    console.log('Verifying database schema...');
    
    // Check media_items columns
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'media_items';
    `);

    console.log('Columns in media_items table:');
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });

    const requiredColumns = ['layout_template_id', 'region_config'];
    const missingColumns = requiredColumns.filter(col => !res.rows.some(r => r.column_name === col));

    if (missingColumns.length > 0) {
      console.error('Missing columns:', missingColumns);
    } else {
      console.log('All required columns present.');
    }

  } catch (error) {
    console.error('Error verifying schema:', error);
  } finally {
    await pool.end();
  }
}

verifySchema();
