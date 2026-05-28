import 'dotenv/config';
import { getClient } from './index';

async function verify() {
  console.log('🔍 Verificando estado do banco de dados...');
  const client = await getClient();
  
  try {
    const res = await client.query('SELECT count(*) FROM users');
    console.log(`✅ Contagem de usuários: ${res.rows[0].count}`);
    
    const playersRes = await client.query('SELECT count(*) FROM players');
    console.log(`✅ Contagem de players: ${playersRes.rows[0].count}`);

    // Check if created_by column exists in companies
    const colRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'created_by'
    `);
    if (colRes.rows.length > 0) {
      console.log('✅ Coluna created_by existe na tabela companies!');
    } else {
      console.error('❌ Coluna created_by NÃO existe na tabela companies!');
    }

  } catch (err) {
    console.error('❌ Verificação falhou:', err);
    process.exit(1);
  } finally {
    client.release();
    const pool = (await import('./index')).default;
    await pool.end();
  }
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
