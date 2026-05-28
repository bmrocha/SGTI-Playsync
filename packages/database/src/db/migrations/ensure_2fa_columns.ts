
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables if running directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  dotenv.config();
}

async function run() {
  // Dynamic import to ensure env vars are loaded first
  const { getClient } = await import('../index');
  
  const client = await getClient();
  try {
    console.log('Ensuring 2FA columns exist in users table...');
    
    // Add two_factor_secret
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;
    `);
    
    // Add two_factor_enabled
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
    `);

    // Add force_2fa_setup
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS force_2fa_setup BOOLEAN DEFAULT FALSE;
    `);
    
    // Add backup_codes (optional but good practice)
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS backup_codes TEXT[];
    `);

    console.log('Successfully ensured all 2FA columns exist.');
  } catch (error) {
    console.error('Error ensuring columns:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
