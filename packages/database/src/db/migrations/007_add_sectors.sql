-- Phase 2: Sectors (N:M relationship for playlists and users)

-- 1. Sectors table
CREATE TABLE IF NOT EXISTS sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sectors_company_id ON sectors(company_id);
CREATE INDEX IF NOT EXISTS idx_sectors_name ON sectors(name);

-- 2. Junction: playlists <-> sectors
CREATE TABLE IF NOT EXISTS playlist_sectors (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, sector_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_sectors_playlist ON playlist_sectors(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_sectors_sector ON playlist_sectors(sector_id);

-- 3. Junction: users <-> sectors
CREATE TABLE IF NOT EXISTS user_sectors (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, sector_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sectors_user ON user_sectors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sectors_sector ON user_sectors(sector_id);
