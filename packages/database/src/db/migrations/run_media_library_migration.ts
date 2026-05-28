
import 'dotenv/config';
import { query } from '../index';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
    try {
        const sqlPath = path.join(__dirname, 'create_media_library.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Running migration: create_media_library.sql');
        await query(sql);
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

run();
