import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, getClient } from './index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_TABLE = '_migrations';

async function ensureMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      hash VARCHAR(64) NOT NULL
    )
  `);
}

async function isMigrationApplied(name: string): Promise<boolean> {
  const res = await query(
    `SELECT 1 FROM ${MIGRATIONS_TABLE} WHERE name = $1`,
    [name]
  );
  return res.rowCount !== null && res.rowCount > 0;
}

async function recordMigration(name: string, hash: string) {
  await query(
    `INSERT INTO ${MIGRATIONS_TABLE} (name, hash) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`,
    [name, hash]
  );
}

function getSqlMigrationsDir(): string {
  const candidates = [
    path.join(__dirname, 'migrations'),
    path.join(process.cwd(), 'packages', 'database', 'src', 'db', 'migrations'),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return candidates[0];
}

export async function runMigrations() {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await ensureMigrationsTable();

    // 1. Run main schema.sql as migration "000_schema" if not applied
    const schemaApplied = await isMigrationApplied('000_schema');
    if (!schemaApplied) {
      const schemaPaths = [
        path.join(__dirname, 'schema.sql'),
        path.join(process.cwd(), 'packages', 'database', 'src', 'db', 'schema.sql'),
        path.join(process.cwd(), 'db-scripts', 'schema.sql'),
      ];
      let schemaPath = '';
      for (const p of schemaPaths) {
        if (fs.existsSync(p)) { schemaPath = p; break; }
      }
      if (schemaPath) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await client.query(sql);
        const hash = require('crypto').createHash('sha256').update(sql).digest('hex');
        await recordMigration('000_schema', hash);
      }
    }

    // 2. Run individual SQL migrations from migrations/ dir
    const migrationsDir = getSqlMigrationsDir();
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => f.endsWith('.sql'))
        .sort();

      for (const file of files) {
        if (await isMigrationApplied(file)) continue;
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        const hash = require('crypto').createHash('sha256').update(sql).digest('hex');
        await recordMigration(file, hash);
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
