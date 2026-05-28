import pg from 'pg';
const { Pool } = pg;
import type { QueryResult } from 'pg';
import fs from 'fs';

function getSslConfig(): boolean | { rejectUnauthorized: boolean; ca?: string } | undefined {
  const sslEnabled = process.env.DATABASE_SSL === 'true';
  if (!sslEnabled) return undefined;

  const caPath = process.env.DATABASE_SSL_CA_PATH;
  if (caPath && fs.existsSync(caPath)) {
    return {
      rejectUnauthorized: true,
      ca: fs.readFileSync(caPath).toString(),
    };
  }

  // Exigir validacao do certificado por padrao quando SSL esta ativo
  return { rejectUnauthorized: true };
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: getSslConfig(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
  query_timeout: 10000,
});

export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  return pool.query(text, params);
};

export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;