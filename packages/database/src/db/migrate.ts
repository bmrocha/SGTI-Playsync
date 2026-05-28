import { runMigrations } from './migrate-runner';
import pool from './index';

export async function migrate() {
  await runMigrations();
}

if (process.argv[1] === import.meta.url) {
  migrate().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
