
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  dotenv.config();
}

async function run() {
  const { getClient } = await import('../index');
  const client = await getClient();
  try {
    console.log('Adding temp 2FA columns to users table...');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_temp_secret TEXT,
      ADD COLUMN IF NOT EXISTS two_factor_setup_expires TIMESTAMP WITH TIME ZONE;
    `);

    console.log('Successfully added temp 2FA columns.');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
