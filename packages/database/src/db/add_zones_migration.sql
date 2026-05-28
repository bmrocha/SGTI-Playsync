
-- Add zones column if it doesn't exist (for migration of existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'media_items'
        AND column_name = 'zones'
    ) THEN
        ALTER TABLE media_items ADD COLUMN zones JSONB;
    END IF;
END $$;
