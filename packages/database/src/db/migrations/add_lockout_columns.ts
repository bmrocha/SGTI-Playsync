
import 'dotenv/config';
import { getClient } from '../index';
import { fileURLToPath } from 'url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run();
}

async function run() {
  const client = await getClient();
  try {
    console.log('Adding lockout columns to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMP WITH TIME ZONE;
    `);
    console.log('Successfully added lockout columns.');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}
