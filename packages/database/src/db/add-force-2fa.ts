
import { query } from './index';

async function main() {
  try {
    console.log('Adding force_2fa_setup column...');
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS force_2fa_setup BOOLEAN DEFAULT FALSE;
    `);
    console.log('Column force_2fa_setup added successfully.');
  } catch (error) {
    console.error('Error adding column:', error);
    process.exit(1);
  }
}

main();
