import 'dotenv/config';
import pool from '../../db';

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log('Altering playback_logs table...');
        
        // Allow NULL in player_id
        await client.query(`ALTER TABLE playback_logs ALTER COLUMN player_id DROP NOT NULL`);
        
        // Drop FK constraint if exists
        await client.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'playback_logs_player_id_fkey') THEN 
                    ALTER TABLE playback_logs DROP CONSTRAINT playback_logs_player_id_fkey; 
                END IF; 
            END $$;
        `);

        await client.query('COMMIT');
        console.log('Migration successful: playback_logs player_id constraint relaxed.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Migration failed', e);
        process.exit(1);
    } finally {
        client.release();
    }
}

migrate();
