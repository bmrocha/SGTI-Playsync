import { getClient } from '../index';
import dotenv from 'dotenv';

if (require.main === module) {
  dotenv.config();
}

async function run() {
  const client = await getClient();
  try {
    console.log('Adding 2FA columns to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
    `);
    console.log('Successfully added 2FA columns.');
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    client.release();
    // Force exit as the pool might keep the process alive
    process.exit(0);
  }
}

run();
