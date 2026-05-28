import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);

// Initialize dotenv if being run directly
dotenv.config();

export async function resetAdmin() {
  console.log('🔄 Redefinindo credenciais do administrador...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const client = await pool.connect();

  try {
    const adminEmail = 'admin@sgti.tec.br';
    const newPassword = 'PPsw@@playsync1706';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Verificar se o admin existe
    const res = await client.query('SELECT * FROM users WHERE email = $1', [adminEmail]);

    if ((res.rowCount ?? 0) > 0) {
      // Atualizar admin existente (incluindo reset de logout e falhas)
      await client.query(
        'UPDATE users SET password = $1, name = $2, role = $3, failed_login_attempts = 0, lockout_until = NULL WHERE email = $4',
        [hashedPassword, 'Administrador PlaySync', 'admin', adminEmail]
      );
      console.log('✅ Senha do administrador atualizada com sucesso.');
    } else {
      // Criar novo admin se não existir
      await client.query(
        'INSERT INTO users (email, password, name, role, force_password_reset) VALUES ($1, $2, $3, $4, $5)',
        [adminEmail, hashedPassword, 'Administrador PlaySync', 'admin', false]
      );
      console.log('✅ Usuário administrador criado com sucesso.');
    }

    console.log('\n==================================================');
    console.log('🔑 CREDENCIAIS DE ADMINISTRADOR ATUALIZADAS (PlaySync)');
    console.log(`📧 Email:    ${adminEmail}`);
    console.log(`🔒 Senha:    ${newPassword}`);
    console.log('==================================================\n');

  } catch (err) {
    console.error('❌ Falha ao redefinir admin:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

// Check if run directly
const isMain = process.argv[1] && (
  process.argv[1].endsWith('reset-admin.ts') || 
  process.argv[1].endsWith('reset-admin.js')
);

if (isMain) {
  resetAdmin().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
