-- Add theme and primary_color columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'light';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20);