import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  dotenv.config();
}

export async function seed() {
  console.log('🌱 Starting database seeding...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const client = await pool.connect();

  try {
    const adminEmail = 'admin@sgti.tec.br';

    // Check if admin already exists
    const res = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);
    
    if (res.rowCount === 0) {
      console.log('👤 Admin user not found. Creating new admin...');
      
      // Use standard initial password from PRD
      const initialPassword = 'Psw@playsync1706';
      const hashedPassword = await bcrypt.hash(initialPassword, 10);

      await client.query(
        'INSERT INTO users (email, password, name, role, force_password_reset) VALUES ($1, $2, $3, $4, $5)',
        [adminEmail, hashedPassword, 'Administrador PlaySync', 'admin', true]
      );

      console.log('\n==================================================');
      console.log('🎉 SYSTEM INITIALIZED SUCCESSFULLY (PlaySync Edition)');
      console.log('==================================================');
      console.log('🔑 Admin Credentials:');
      console.log(`📧 Email:    ${adminEmail}`);
      console.log(`🔒 Password: ${initialPassword}`);
      console.log('==================================================');
      console.log('⚠️  PLEASE CHANGE THIS PASSWORD ON FIRST LOGIN.');
      console.log('==================================================\n');
    } else {
      console.log('✅ Admin user already exists. Skipping creation.');
    }
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === __filename) {
  seed().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
