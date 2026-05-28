import { query } from '../index';

async function checkColumns() {
  try {
    const result = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('two_factor_secret', 'two_factor_enabled');
    `);
    
    console.log('Found columns:', result.rows.map(r => r.column_name));
    
    const hasSecret = result.rows.some(r => r.column_name === 'two_factor_secret');
    const hasEnabled = result.rows.some(r => r.column_name === 'two_factor_enabled');
    
    if (hasSecret && hasEnabled) {
      console.log('SUCCESS: Both 2FA columns exist.');
    } else {
      console.log('FAILURE: Missing 2FA columns.');
      // If missing, try to add them
      console.log('Attempting to add missing columns...');
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
        ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE;
      `);
      console.log('Columns added.');
    }
  } catch (error) {
    console.error('Error checking columns:', error);
  } finally {
    process.exit(0);
  }
}

checkColumns();
