ALTER TABLE playback_logs ALTER COLUMN player_id DROP NOT NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'playback_logs_player_id_fkey') THEN
        ALTER TABLE playback_logs DROP CONSTRAINT playback_logs_player_id_fkey;
    END IF;
END $$;
