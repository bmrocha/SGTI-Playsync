CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip VARCHAR(45) NOT NULL,
    endpoint VARCHAR(255) NOT NULL DEFAULT '/',
    count INTEGER NOT NULL DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_ip_endpoint UNIQUE (ip, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON rate_limits (ip);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires_at ON rate_limits (expires_at);

ALTER TABLE sessions ADD COLUMN IF NOT EXISTS refresh_token TEXT;
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions (refresh_token);
