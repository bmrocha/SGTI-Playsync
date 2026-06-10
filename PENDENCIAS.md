# Pendências

## Melhorias de Infraestrutura

- [x] **Rate limiter**: Substituir `Map` in-memory por PostgreSQL (via `RateLimitRepository`)
- [x] **Refresh token**: Implementado com access token de 1h + refresh token rotativo de 7 dias (armazenado em `sessions.refresh_token`)
- [x] **`isIpTrusted()`**: Mudado de permit-by-default para deny-by-default

## Melhorias de Código

- [x] **Audit routes**: Adicionar `logServerAction` em:
  - `api/analytics/report/route.ts`
  - `api/agent/heartbeat/route.ts`
  - `api/audit/route.ts` (POST/DELETE — já escreve direto no banco, não necessita dupla logagem)

- [x] **`notifySuccess/notifyError`**: Revisadas 29 mensagens — segundo parâmetro preenchido com texto descritivo

- [x] **`companies/page.tsx`**: Os componentes extraídos estão em `src/components/companies/`
- [x] **`playlists/page.tsx`**: Os componentes extraídos estão em `src/components/playlists/`

- [ ] **Cleanup automático**: Agendar cron para limpeza periódica de `rate_limits` expirados

## Observações

- Build passa sem erros após todas as alterações
- Todas as páginas de dashboard foram refatoradas para usar componentes extraídos
- Refresh token é rotativo (cada uso gera novo token + novo access token)
- `checkRateLimit` agora é assíncrono (`Promise<boolean>`) — conecta ao PostgreSQL
- `checkRateLimitSync` mantido como fallback para compatibilidade (sempre retorna true)
- Migração `005_add_rate_limits_and_refresh.sql` precisa ser executada no banco
