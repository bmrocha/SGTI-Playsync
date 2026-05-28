# Changelog

## [Unreleased]

### Segurança (Fase 1)
- **`auth-store.ts`**: Removido campo `password` da interface `User` do lado cliente
- **`PUT /api/players`**: Adicionada validação Zod + whitelist de campos (impede mass assignment de token/credentials)
- **`GET /api/players`**: Campos `token` e `credentials` filtrados (visíveis apenas para admin)
- **`POST /api/auth/change-password`**: Rate limiting adicionado (5/min)
- **`POST /api/auth/2fa/verify`**: Rate limiting adicionado (10/min)
- **`GET /api/rss`**: Proteção SSRF adicionada (bloqueia IPs privados, localhost, 169.254.x.x, .local/.internal)
- **`GET /api/license/public-key`**: Autenticação obrigatória adicionada
- **`player-store.ts`**: Adicionado `partialize` — credentials excluídas do localStorage
- **`api-client.ts`** (novo): Wrapper `apiFetch` com header `X-Requested-With`; aplicado em `auth-store.ts`
- **`logger.ts`**: Campos sensíveis adicionados ao redact do Pino
- **`system-settings.ts`**: Hardcoded `2026` substituído por `new Date().getFullYear()`
- **`profile/page.tsx`**: Validação de tipo MIME adicionada ao upload de avatar

### Estabilidade (Fase 2)
- **`error-boundary.tsx`** (novo): Componente `ErrorBoundary` baseado em classe
- **`page-maintenance-overlay.tsx`** (novo): Extraído de `client-layout.tsx` (~130→85 linhas)
- **`client-layout.tsx`**: Dashboard content envolvido em `ErrorBoundary`
- **`settings/page.tsx`**: Reduzido de 1445 → ~366 linhas (74%). Quatro abas extraídas:
  - `settings-midia-tab.tsx`, `settings-seguranca-tab.tsx`, `settings-infra-tab.tsx`, `settings-sistema-tab.tsx`

### Notificações Unificadas (Fase 2.3)
- **`notification-store.ts`**: Store Zustand encapsulando `react-hot-toast` com histórico
- 12 arquivos migrados de `toast.success/error` para `notifySuccess/notifyError`
- 29 mensagens revisadas: segundo parâmetro (`message`) preenchido com texto descritivo

### Modernização de Código
- **`editor/page.tsx`**: `XMLHttpRequest` substituído por `fetch` com simulated progress
- **`profile/page.tsx`**: `<img>` substituído por `next/image` com `unoptimized`

### Auditoria de CRUDs
- `logServerAction` adicionado em todas as rotas de mutação críticas:
  - Players (CREATE, UPDATE, DELETE)
  - Companies (CREATE, UPDATE, DELETE)
  - Playlists (CREATE, UPDATE, DELETE)
  - Playlist Links (CREATE)
  - System Settings (UPDATE)
  - System Cache (CLEAR)
  - System Sessions (DELETE)
  - License Apply (APPLY)
  - License Public Key (UPDATE)
  - Media Upload (UPLOAD)
  - Media Library (DELETE)
  - Auth Logout (LOGOUT)
  - Auth 2FA Setup (SETUP)

### Segurança & Infraestrutura (Fase 3)
- **`isIpTrusted()`**: Alterado de permit-by-default para deny-by-default (IP não listado → bloqueado)
- **`rate-limit.ts`**: Substituído `Map` in-memory por PostgreSQL (`RateLimitRepository.checkAndIncrement`)
- **`rate-limit.repository.ts`** (novo): Repositório com upsert atômico por IP+endpoint
- **`auth.ts`**: Adicionado `signAccessToken` (1h) e `signRefreshToken` (7d); `signToken` mantido como alias
- **`api/auth/refresh/route.ts`** (novo): Endpoint para renovação de access token via refresh token rotativo
- **`api/auth/login/route.ts`**: Emite cookie `refresh_token` adicional (HttpOnly, 7 dias)
- **`api/auth/logout/route.ts`**: Revoga refresh token e limpa cookie
- **`refresh-token.repository.ts`** (novo): Geração, busca e rotação de refresh tokens (armazenados em `sessions.refresh_token`)
- **`session.repository.ts`**: Adicionado `updateRefreshToken`
- **`005_add_rate_limits_and_refresh.sql`** (novo): Migração — tabela `rate_limits` + coluna `refresh_token` em sessions
- **`api/analytics/report/route.ts`**: Audit logging via `logServerAction` (REPORT)
- **`api/agent/heartbeat/route.ts`**: Audit logging via `logServerAction` (HEARTBEAT)

### Extração de Componentes
- **`audit/page.tsx`**: 612 → ~290 linhas. Componentes: `audit-stats`, `audit-filters`, `audit-table`
- **`companies/page.tsx`**: 658 → ~150 linhas. Componentes: `company-card`, `form-modal-content`, `color-picker`, `editor-selection`, `filters-section`, `page-header`, `empty-state-search`, `empty-state-no-data`
- **`playlists/page.tsx`**: 677 → ~311 linhas. Componentes: `playlist-card` (com `PlaylistPreview`), `create-playlist-modal`, `view-companies-modal`, `filters-bar`, `page-header`, `empty-state`
