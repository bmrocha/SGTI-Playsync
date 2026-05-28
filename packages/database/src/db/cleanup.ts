import { getClient } from './index';
import dotenv from 'dotenv';

if (require.main === module) {
  dotenv.config();
}

export async function cleanup() {
  console.log('🧹 Starting database cleanup...');
  const client = await getClient();
  
  try {
    const oldTables = [
      '"User"',
      '"Session"',
      '"Player"',
      '"AuditLog"',
      '"_prisma_migrations"'
    ];

    console.log('Checking for old Prisma tables...');
    
    for (const table of oldTables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table ${table}`);
      } catch (e) {
        console.log(`⚠️  Could not drop table ${table}: ${(e as Error).message}`);
      }
    }

    console.log('🎉 Cleanup completed successfully.');
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    throw err;
  } finally {
    client.release();
    if (require.main === module) {
      const pool = require('./index').default;
      await pool.end();
    }
  }
}

if (require.main === module) {
  cleanup().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
