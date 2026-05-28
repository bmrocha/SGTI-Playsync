
CREATE TABLE IF NOT EXISTS media_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size BIGINT NOT NULL,
    path VARCHAR(512) NOT NULL,
    url VARCHAR(512) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_media_library_uploaded_at ON media_library(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_media_library_environment ON media_library(environment);
