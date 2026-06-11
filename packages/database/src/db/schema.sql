CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50),
    created_by UUID,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    company_id UUID REFERENCES companies (id) ON DELETE SET NULL,
    avatar TEXT,
    theme VARCHAR(20) DEFAULT 'light',
    primary_color VARCHAR(20),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    WITH
        TIME ZONE,
        force_password_reset BOOLEAN DEFAULT FALSE,
        two_factor_secret TEXT,
        two_factor_enabled BOOLEAN DEFAULT FALSE,
        force_2fa_setup BOOLEAN DEFAULT FALSE,
        two_factor_temp_secret TEXT,
        two_factor_setup_expires TIMESTAMP
    WITH
        TIME ZONE,
        failed_login_attempts INTEGER DEFAULT 0,
        lockout_until TIMESTAMP
    WITH
        TIME ZONE,
        permissions JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN (permissions);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    device VARCHAR(255),
    os VARCHAR(255),
    ip VARCHAR(45),
    token TEXT NOT NULL UNIQUE,
    last_seen TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token);

CREATE TABLE IF NOT EXISTS players (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    token TEXT NOT NULL,
    company_id VARCHAR(255),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'offline',
    last_seen TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metrics TEXT,
        credentials TEXT,
        current_playlist_id VARCHAR(255),
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playback_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    player_id VARCHAR(255),
    media_item_id UUID, -- Optional reference if we want to link strictly, but often kept loose for logs
    playlist_id UUID,
    company_id UUID,
    played_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        duration_played INTEGER NOT NULL DEFAULT 0, -- in seconds
        error_message TEXT,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playback_logs_player_id ON playback_logs (player_id);

CREATE INDEX IF NOT EXISTS idx_playback_logs_company_id ON playback_logs (company_id);

CREATE INDEX IF NOT EXISTS idx_playback_logs_played_at ON playback_logs (played_at);

CREATE INDEX IF NOT EXISTS idx_playback_logs_company_played ON playback_logs (company_id, played_at);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),
    details TEXT NOT NULL,
    metadata TEXT,
    timestamp TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS company_playlists (
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES playlists (id) ON DELETE CASCADE,
    PRIMARY KEY (company_id, playlist_id)
);

CREATE TABLE IF NOT EXISTS media_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    playlist_id UUID REFERENCES playlists (id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    name VARCHAR(255) NOT NULL,
    duration INTEGER DEFAULT 0,
    rotation INTEGER DEFAULT 0,
    layout VARCHAR(50),
    zones JSONB,
    schedule_start_date TIMESTAMP
    WITH
        TIME ZONE,
        schedule_end_date TIMESTAMP
    WITH
        TIME ZONE,
        schedule_start_time TIME,
        schedule_end_time TIME,
        schedule_days JSONB,
        schedule_all_day BOOLEAN DEFAULT TRUE,
        schedule_enabled BOOLEAN DEFAULT TRUE,
        "order" INTEGER DEFAULT 0,
        layout_template_id VARCHAR(100),
        region_config JSONB,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_links (
    id VARCHAR(50) PRIMARY KEY,
    company_id UUID REFERENCES companies (id) ON DELETE CASCADE,
    playlist_id UUID REFERENCES playlists (id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table to track active viewers of shared playlist links in real-time
CREATE TABLE IF NOT EXISTS playlist_link_viewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_link_id VARCHAR(50) REFERENCES playlist_links(id) ON DELETE CASCADE,
    viewer_id VARCHAR(100) NOT NULL, -- Unique identifier for each viewer/device
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playlist_link_viewers_link_id ON playlist_link_viewers(playlist_link_id);
CREATE INDEX IF NOT EXISTS idx_playlist_link_viewers_viewer_id ON playlist_link_viewers(viewer_id);
CREATE INDEX IF NOT EXISTS idx_playlist_link_viewers_last_heartbeat ON playlist_link_viewers(last_heartbeat);

-- Ensure theme column exists in playlist_links
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'playlist_links'
        AND column_name = 'theme'
    ) THEN
        ALTER TABLE playlist_links ADD COLUMN theme VARCHAR(20) DEFAULT 'light';
    ELSE
        -- Also force update existing 'dark' themes to 'light'
        UPDATE playlist_links SET theme = 'light' WHERE theme = 'dark';
    END IF;
END $$;

-- Ensure primary_color column exists in playlist_links
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'playlist_links'
        AND column_name = 'primary_color'
    ) THEN
        ALTER TABLE playlist_links ADD COLUMN primary_color VARCHAR(20) DEFAULT NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS media_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    path VARCHAR(512) NOT NULL,
    url VARCHAR(512) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        uploaded_by UUID REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_at ON media_library (uploaded_at);

CREATE INDEX IF NOT EXISTS idx_media_library_environment ON media_library (environment);

CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library (uploaded_by);

CREATE INDEX IF NOT EXISTS idx_media_items_playlist_id ON media_items (playlist_id);

CREATE INDEX IF NOT EXISTS idx_media_items_playlist_order ON media_items (playlist_id, "order");

CREATE INDEX IF NOT EXISTS idx_company_playlists_company_id ON company_playlists (company_id);

CREATE INDEX IF NOT EXISTS idx_company_playlists_playlist_id ON company_playlists (playlist_id);

-- Add zones column if it doesn't exist (for existing tables)
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

-- Ensure created_by column exists in companies (for existing tables)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'companies'
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE companies ADD COLUMN created_by UUID;
    END IF;
END $$;

-- Composite index for media_library
CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_by ON media_library (uploaded_by);

-- Phase 2: Sectors
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

CREATE TABLE IF NOT EXISTS playlist_sectors (
    playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
    PRIMARY KEY (playlist_id, sector_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_sectors_playlist ON playlist_sectors(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_sectors_sector ON playlist_sectors(sector_id);

CREATE TABLE IF NOT EXISTS user_sectors (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, sector_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sectors_user ON user_sectors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sectors_sector ON user_sectors(sector_id);