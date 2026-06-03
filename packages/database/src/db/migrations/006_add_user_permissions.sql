-- Fase 1.1: Adicionar coluna de permissões granulares por usuário
-- Permite overrides das permissões padrão do role via JSONB array

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;

-- Índice para consultas rápidas (opcional, útil para auditoria)
CREATE INDEX IF NOT EXISTS idx_users_permissions ON users USING GIN (permissions);

-- Comentário para documentação do schema
COMMENT ON COLUMN users.permissions IS 'Array JSON de permissões customizadas que sobrescrevem o role padrão. Ex: ["users:read", "users:write", "playlists:delete"]. Vazio = usa ROLE_PERMISSIONS.';
