# SGTI PlaySync

Sistema de gerenciamento de mídia digital para TVs corporativas (**Digital Signage**). Desenvolvido para permitir que empresas criem, agendem e distribuam playlists de conteúdo (imagens e vídeos) para players instalados em televisores, totens e painéis — tudo via web, sem necessidade de software nativo nas TVs.

---

## Sumário

1. [O que é o PlaySync](#o-que-é-o-playsync)
2. [Funcionalidades Principais](#funcionalidades-principais)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Arquitetura](#arquitetura)
5. [Estrutura de Diretórios](#estrutura-de-diretórios)
6. [Variáveis de Ambiente](#variáveis-de-ambiente)
7. [Desenvolvimento Local](#desenvolvimento-local)
8. [Deploy com Docker](#deploy-com-docker)
9. [Primeiro Acesso e Seed](#primeiro-acesso-e-seed)
10. [Sincronização em Tempo Real](#sincronização-em-tempo-real)
11. [Agendamento de Conteúdo](#agendamento-de-conteúdo)
12. [Autoplay em TVs](#autoplay-em-tvs)
13. [Segurança](#segurança)
14. [Banco de Dados e Migrations](#banco-de-dados-e-migrations)
15. [Rotas da API](#rotas-da-api)

---

## O que é o PlaySync

O **PlaySync** é uma plataforma de **Digital Signage** (Comunicação Visual Corporativa) que permite:

- **Upload e organização** de mídias (imagens e vídeos) em uma biblioteca centralizada.
- **Criação de playlists** com ordenação drag-and-drop e duração por item.
- **Agendamento inteligente** de conteúdo por dia da semana, horário, data de início/fim e feriados.
- **Distribuição via links** para players (TVs, totens, navegadores) que rodam em modo fullscreen sem interação humana.
- **Gerenciamento multi-empresa** com isolamento de dados e controle de acesso baseado em papéis (RBAC).
- **Análise de playback** com logs de exibição, gráficos de atividade e auditoria completa.

O player roda em qualquer dispositivo com um navegador moderno (Chrome, Edge, TVs Samsung/LG, Android TV, Raspberry Pi, etc.).

---

## Funcionalidades Principais

| Módulo                  | Descrição                                                                                                             |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Dashboard**           | Visão geral com KPIs, gráficos de distribuição de mídia, atividade do sistema, armazenamento e widgets de clima/hora. |
| **Biblioteca de Mídia** | Upload via drag-and-drop, preview, organização por tipo (imagem/vídeo/YouTube) e controle de espaço em disco.         |
| **Editor de Playlists** | Interface drag-and-drop para montar playlists, definir duração por item e agendar exibição.                           |
| **Agendamento**         | Regras por dia da semana, horário (suporta overnight como 22:00–02:00), range de datas e flag `enabled`.              |
| **Players / TVs**       | Cadastro de dispositivos, geração de tokens, monitoramento de status (online/offline) e último acesso.                |
| **Links de Playlist**   | Geração de URLs públicas protegidas por token para cada player receber conteúdo específico.                           |
| **Analytics**           | Gráficos de exibição, heatmaps de atividade, estatísticas de players e conteúdo mais exibido.                         |
| **Audit Logs**          | Registro completo de ações administrativas (quem fez, quando e o que mudou).                                          |
| **Multi-Empresa**       | Criação de empresas/departamentos com isolamento de usuários, mídias e playlists.                                     |
| **Autenticação**        | Login com JWT, 2FA (TOTP via QR Code), bloqueio por IP confiável, tentativas falhas e reset de senha.                 |
| **Licenciamento**       | Verificação de licença via chave pública Ed25519 com validade e limite de players.                                    |
| **Manutenção**          | Página de manutenção programada que intercepta todas as requisições quando ativada.                                   |

---

## Stack Tecnológico

### Frontend

- **Next.js 16** (App Router, Server Components, Streaming)
- **React 19** (Hooks, Suspense, Transitions)
- **TypeScript 5** (tipagem estrita)
- **Tailwind CSS v4** (utility-first, CSS variables, container queries)
- **Framer Motion** (animações e transições)
- **Recharts** (gráficos e dashboards)
- **@dnd-kit** (drag-and-drop do editor de playlists)
- **Zustand** (gerenciamento de estado global)
- **Lucide React** (ícones)

### Backend

- **Next.js API Routes** (RESTful, rodando no mesmo processo do frontend)
- **jose** (JWT: access token e refresh token)
- **bcryptjs** (hash de senhas)
- **otplib** (2FA / TOTP)
- **pino** (logging estruturado)
- **zod** (validação de schemas)

### Banco de Dados

- **PostgreSQL 15** (via `pg` driver nativo)
- **Schema próprio** gerenciado por migrations manuais em SQL
- **Repositórios** em TypeScript com queries parametrizadas (sem ORM)

### Infraestrutura

- **Docker + Docker Compose** (deploy em produção)
- **Node.js 22** (Alpine Linux)
- **TurboRepo** (monorepo, cache de builds)
- **Husky + lint-staged + commitlint** (hooks de git)
- **ESLint v9 + Prettier** (qualidade de código)

---

## Arquitetura

O projeto segue um **monorepo** com duas workspaces:

```
SGTI-Playsync/
├── apps/web/               → Aplicação Next.js (frontend + API)
│   ├── src/app/            → Rotas e páginas (App Router)
│   ├── src/components/     → Componentes React organizados por domínio
│   ├── src/lib/            → Utilitários, stores Zustand, helpers
│   ├── src/hooks/          → Hooks customizados
│   ├── src/app/api/        → API Routes (Next.js)
│   └── public/uploads/     → Arquivos de mídia enviados
│
├── packages/database/      → Pacote compartilhado de acesso ao banco
│   ├── src/db/             → Pool PostgreSQL, schema, migrations, seed
│   ├── src/repositories/   → Repositories por entidade
│   └── src/index.ts        → Exportações públicas do pacote
│
├── docker-compose.yml      → Orquestração de app + PostgreSQL
├── .env.example            → Template de variáveis de ambiente
└── turbo.json              → Pipeline de build do TurboRepo
```

### Fluxo de Dados

1. **Administrador** acessa o dashboard web, faz upload de mídias e monta playlists com agendamento.
2. **Playlist** é salva no PostgreSQL com itens em `JSONB` (array de `media_items`).
3. **Link de playlist** (`/api/playlist-links`) é gerado para um player específico.
4. **Player** (TV / navegador) acessa o link público e recebe os dados da playlist.
5. **FullscreenPlayer** renderiza os itens sequencialmente, respeitando agendamento e duração.
6. **Polling** de 30s no player detecta mudanças na playlist e atualiza conteúdo sem restart.
7. **Playback logs** são enviados de volta para analytics e auditoria.

---

## Estrutura de Diretórios

### `apps/web/src/app/` — Páginas (App Router)

| Rota                   | Arquivo                        | Descrição                                          |
| ---------------------- | ------------------------------ | -------------------------------------------------- |
| `/`                    | `page.tsx`                     | Landing page / redirect para login                 |
| `/login`               | `login/page.tsx`               | Tela de login com 2FA, slideshow e tema dark/light |
| `/player`              | `player/page.tsx`              | Player público via query string `?id=`             |
| `/player/[id]`         | `player/[id]/page.tsx`         | Player público via path param (link amigável)      |
| `/dashboard`           | `dashboard/page.tsx`           | Dashboard principal com KPIs e gráficos            |
| `/dashboard/editor`    | `dashboard/editor/page.tsx`    | Editor de playlists (drag-and-drop)                |
| `/dashboard/library`   | `dashboard/library/page.tsx`   | Biblioteca de mídia com upload                     |
| `/dashboard/playlists` | `dashboard/playlists/page.tsx` | Listagem e gerenciamento de playlists              |
| `/dashboard/players`   | `dashboard/players/page.tsx`   | Cadastro e monitoramento de players/TVs            |
| `/dashboard/analytics` | `dashboard/analytics/page.tsx` | Relatórios e estatísticas                          |
| `/dashboard/companies` | `dashboard/companies/page.tsx` | Gerenciamento de empresas                          |
| `/dashboard/users`     | `dashboard/users/page.tsx`     | Gerenciamento de usuários                          |
| `/dashboard/audit`     | `dashboard/audit/page.tsx`     | Logs de auditoria                                  |
| `/dashboard/settings`  | `dashboard/settings/page.tsx`  | Configurações do sistema                           |
| `/dashboard/profile`   | `dashboard/profile/page.tsx`   | Perfil do usuário logado                           |
| `/manutencao`          | `manutencao/page.tsx`          | Página de manutenção programada                    |

### `apps/web/src/app/api/` — API Routes

| Rota                        | Descrição                                         |
| --------------------------- | ------------------------------------------------- |
| `/api/auth/login`           | Autenticação (email/senha) + 2FA                  |
| `/api/auth/refresh`         | Refresh de access token                           |
| `/api/auth/logout`          | Revogação de sessão                               |
| `/api/auth/change-password` | Alteração de senha com verificação atual          |
| `/api/auth/reset-locks`     | Reset de bloqueio por tentativas falhas           |
| `/api/auth/2fa/*`           | Setup, enable, disable, verify de TOTP            |
| `/api/health`               | Healthcheck para Docker e monitoramento           |
| `/api/media`                | CRUD de mídias (upload, list, delete)             |
| `/api/playlists`            | CRUD de playlists                                 |
| `/api/playlist-links`       | Geração de links públicos para players            |
| `/api/playlist-links/[id]`  | Dados da playlist para o player (com `updatedAt`) |
| `/api/players`              | CRUD de players/TVs                               |
| `/api/companies`            | CRUD de empresas                                  |
| `/api/users`                | CRUD de usuários                                  |
| `/api/analytics`            | Dados para gráficos e relatórios                  |
| `/api/audit-logs`           | Consulta de logs de auditoria                     |
| `/api/system-settings`      | Configurações globais do sistema                  |
| `/api/license`              | Validação de licença                              |
| `/api/file/[...path]`       | Servidor de arquivos estáticos (uploads)          |

### `packages/database/src/repositories/`

| Repository                      | Entidade                   |
| ------------------------------- | -------------------------- |
| `analytics.repository.ts`       | Estatísticas e agregações  |
| `audit-log.repository.ts`       | Logs de auditoria          |
| `company.repository.ts`         | Empresas                   |
| `media-item.repository.ts`      | Itens de mídia             |
| `playback-log.repository.ts`    | Logs de exibição do player |
| `player.repository.ts`          | Players/TVs                |
| `playlist-link.repository.ts`   | Links públicos de playlist |
| `playlist.repository.ts`        | Playlists e seus itens     |
| `session.repository.ts`         | Sessões JWT ativas         |
| `system-settings.repository.ts` | Configurações do sistema   |
| `user.repository.ts`            | Usuários                   |

---

## Variáveis de Ambiente

Todas as credenciais e segredos **devem** ser definidas no arquivo `.env` na raiz do projeto. **Nunca** hardcode senhas no `docker-compose.yml` ou no código-fonte.

> ⚠️ **Importante de Segurança**  
> O `docker-compose.yml` foi configurado para **não possuir defaults** de senha. Se o `.env` não estiver presente ou estiver incompleto, os containers falharão na inicialização — isso é intencional para evitar o uso de credenciais fracas por padrão.

Copie `.env.example` para `.env` e preencha todos os valores:

```bash
cp .env.example .env
```

### Variáveis Obrigatórias

| Variável                 | Descrição                                             | Exemplo                                                             |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------- |
| `DATABASE_URL`           | Connection string completa do PostgreSQL              | `postgresql://user:pass@localhost:5432/sgti_playsync?schema=public` |
| `POSTGRES_USER`          | Usuário do banco (usado pelo container PostgreSQL)    | `playsync`                                                          |
| `POSTGRES_PASSWORD`      | Senha do banco (usado pelo container PostgreSQL)      | `SenhaSegura123!`                                                   |
| `POSTGRES_DB`            | Nome do database                                      | `sgti_playsync`                                                     |
| `JWT_SECRET`             | Chave secreta para assinar tokens JWT (mín. 32 chars) | `muito-seguro-256-bits...`                                          |
| `ADMIN_INITIAL_PASSWORD` | Senha inicial do admin na primeira execução do seed   | `TroqueNaPrimeiraLogin!`                                            |
| `CRON_SECRET`            | Token para proteger rotas de cron/background          | `cron-seguro-256-bits...`                                           |
| `LICENSE_ISSUER`         | Emissor da licença                                    | `SGTI`                                                              |
| `LICENSE_PUBLIC_KEY`     | Chave pública Ed25519 em base64 para validar licença  | `LS0tLS1CRUdJTiBQVUJ...`                                            |
| `NEXT_PUBLIC_API_URL`    | URL base da API (usada pelo frontend)                 | `http://localhost:3000`                                             |

### Variáveis Opcionais

| Variável                  | Descrição                                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `NODE_ENV`                | Ambiente (`development` ou `production`). **Não defina em `.env` em produção** — o Next.js detecta automaticamente. |
| `NEXT_TELEMETRY_DISABLED` | Desativa telemetria da Vercel (`1` para desativar)                                                                  |
| `ALLOW_ADMIN_CREATION`    | Permite criar admin via API (`true`/`false`)                                                                        |
| `BYPASS_2FA_EMAILS`       | Emails que ignoram 2FA (separados por vírgula)                                                                      |
| `DATABASE_SSL`            | Ativa SSL no PostgreSQL (`true`/`false`)                                                                            |
| `DATABASE_SSL_CA_PATH`    | Caminho do certificado CA para SSL                                                                                  |
| `NEXT_PUBLIC_SENTRY_DSN`  | DSN do Sentry para error tracking                                                                                   |

---

## Desenvolvimento Local

### Pré-requisitos

- **Node.js** >= 22
- **npm** >= 10
- **PostgreSQL** >= 15 (ou use Docker para o banco)

### 1. Clone e instale dependências

```bash
git clone <repo-url>
cd SGTI-Playsync
npm install
```

### 2. Configure o ambiente

```bash
cp .env.example .env
# Edite .env com suas credenciais
```

### 3. Inicie o PostgreSQL (via Docker)

```bash
docker run -d \
  --name playsync_db_local \
  -e POSTGRES_USER=playsync \
  -e POSTGRES_PASSWORD=senha_local \
  -e POSTGRES_DB=sgti_playsync \
  -p 5432:5432 \
  -v postgres_data_local:/var/lib/postgresql/data \
  postgres:15-alpine
```

> Ajuste `DATABASE_URL` no `.env` para apontar para `localhost:5432`.

### 4. Execute migrations e seed

```bash
npm run db:migrate
npm run db:seed
```

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Deploy com Docker

O deploy recomendado para produção utiliza **Docker Compose** com build multi-stage do Next.js.

### 1. Prepare o servidor

- Instale [Docker](https://docs.docker.com/engine/install/) e [Docker Compose](https://docs.docker.com/compose/install/).
- Clone o repositório:

```bash
git clone <repo-url>
cd SGTI-Playsync
```

### 2. Configure o `.env`

```bash
cp .env.example .env
nano .env
```

> **ATENÇÃO**: Use senhas fortes e únicas. Nunca reutilize a senha do banco como `ADMIN_INITIAL_PASSWORD`.

### 3. Build e suba os containers

```bash
docker compose up -d --build
```

Isso irá:

1. Buildar a imagem Next.js em modo **standalone**.
2. Subir o container PostgreSQL com healthcheck.
3. Subir o container da aplicação com healthcheck.
4. Montar volumes para persistir uploads e dados do banco.

### 4. Verifique os logs

```bash
docker compose logs -f app
```

### 5. Acesse a aplicação

- **App**: `http://<seu-ip>:3000`
- **Banco**: exposto apenas em `127.0.0.1:5433` (localhost do servidor) para evitar acesso externo.

### 6. Atualização de versão

```bash
git pull
docker compose down
docker compose up -d --build
```

---

## Primeiro Acesso e Seed

Na primeira execução do container (ou ao rodar `npm run db:seed`), o sistema cria automaticamente o usuário administrador:

- **Email**: `admin@sgti.tec.br`
- **Senha**: valor de `ADMIN_INITIAL_PASSWORD` no `.env`

> ⚠️ O sistema força a alteração da senha no primeiro login.

Se perder o acesso ao admin, use:

```bash
npm run db:reset-admin
```

Isso redefinirá a senha do admin para o valor atual de `ADMIN_INITIAL_PASSWORD`.

---

## Sincronização em Tempo Real

O player nas TVs não precisa ser reiniciado manualmente para receber atualizações de playlist.

### Como funciona:

1. O campo `updated_at` da tabela `playlists` é tocado automaticamente sempre que os itens são alterados.
2. O player faz **polling** a cada **30 segundos** no endpoint `/api/playlist-links/[id]`.
3. A resposta inclui o `updatedAt` da playlist original.
4. O player compara o `updatedAt` recebido com o estado atual.
5. Se diferente, o player recarrega os itens e continua a exibição a partir do índice preservado (se o item atual ainda existir).

### Componente chave:

- `FullscreenPlayer` recebe uma `key` composta (`playlistId + updatedAt`) que força o React a remontar o componente apenas quando a playlist realmente mudou.

---

## Agendamento de Conteúdo

O editor de playlists permite definir regras de exibição por item de mídia:

| Regra                  | Descrição                                                            |
| ---------------------- | -------------------------------------------------------------------- |
| **Dias da semana**     | Seg, Ter, Qua, Qui, Sex, Sáb, Dom (checkboxes)                       |
| **Horário**            | Início e fim (ex: 08:00–18:00). Suporta **overnight** (22:00–02:00). |
| **Data de início/fim** | Range de datas em que a regra é válida.                              |
| **Enabled**            | Ativa/desativa a regra sem removê-la.                                |

### Soft Removal

Quando um item sai do agendamento (expira o horário ou a data), o player **não corta o vídeo no meio**. O item atual continua tocando até o fim de sua duração natural. Somente após a conclusão, o player avança para o próximo item válido. Isso evita cortes abruptos em vídeos longos.

---

## Autoplay em TVs

Dispositivos como TVs, totens e kiosks não têm interação humana, o que bloqueia o autoplay com áudio nos navegadores modernos.

### Solução implementada:

- **`lib/autoplay-unlock.ts`**: Emite eventos sintéticos (`click`, `touchstart`) no `document` para convencer o navegador de que houve interação do usuário.
- **HTML5 Video**: O player tenta desmutar (`muted = false`) após 600ms de delay.
- **YouTube IFrame API**: Faz unlock precoce em 400ms + fallback em 2.8s.
- **Fullscreen automático**: O player entra em fullscreen via API do navegador logo no mount.

> **Requisito**: O dispositivo deve permitir execução de JavaScript e acesso à API de Fullscreen. TVs Samsung/LG com navegador WebKit moderno e Android TV com Chrome são totalmente compatíveis.

---

## Segurança

O PlaySync implementa múltiplas camadas de segurança:

| Camada            | Implementação                                                                    |
| ----------------- | -------------------------------------------------------------------------------- |
| **Autenticação**  | JWT (access + refresh tokens) com `jose`. Tokens de acesso de curta duração.     |
| **Senhas**        | Hash com `bcryptjs` (salt rounds 10). Forçar troca no primeiro login.            |
| **2FA / TOTP**    | QR Code via `otplib` (Google Authenticator compatível).                          |
| **Rate Limiting** | Controle de tentativas de login com lockout progressivo.                         |
| **Trusted IPs**   | Restrição de login por range de IPs (CIDR) — pode ser ativada nas configurações. |
| **CORS**          | Headers de CORS na rota `/player/*` para permitir embed em frames seguros.       |
| **CSP**           | Content Security Policy configurada no `next.config.ts`.                         |
| **HSTS**          | Strict-Transport-Security ativo em produção.                                     |
| **RBAC**          | Roles (`admin`, `manager`, `editor`, `viewer`) com permissões granulares.        |
| **Audit Logs**    | Todo CRUD sensível gera log imutável (quem, quando, IP, alteração).              |
| **Licenciamento** | Validação criptográfica Ed25519 com expiração e limite de players.               |

> **Nota sobre senhas**: Nenhuma senha padrão está hardcoded no `docker-compose.yml`. Todas as credenciais vêm do `.env`.

---

## Banco de Dados e Migrations

O schema é gerenciado por **migrations manuais em SQL** (`packages/database/src/db/migrations/`). Não usamos ORM (Prisma/TypeORM) — as queries são escritas em SQL puro via `pg`.

### Comandos úteis

```bash
# Aplicar migrations
npm run db:migrate

# Rodar seed (cria admin inicial)
npm run db:seed

# Resetar senha do admin
npm run db:reset-admin

# Verificar integridade do schema
npm run db:verify

# Limpar dados de teste / logs antigos
npm run db:cleanup
```

### Schema principal

- `companies` — Empresas/departamentos
- `users` — Usuários com role, 2FA, lockout, company_id
- `sessions` — Sessões ativas (refresh tokens)
- `media_items` — Mídias uploadadas (caminho, tipo, tamanho, duração, thumb)
- `playlists` — Playlists com metadados e array JSONB de `items`
- `playlist_links` — Links públicos gerados para players (token, access_count)
- `players` — Dispositivos físicos (TVs) com token, status, last_seen
- `playback_logs` — Registro de cada exibição (player, mídia, timestamp, duração)
- `audit_logs` — Logs de ações administrativas
- `analytics` — Cache de estatísticas diárias
- `system_settings` — Configurações globais (manutenção, branding, restrições de IP)

---

## Rotas da API

Todas as rotas da API estão sob `/api/` e seguem RESTful conventions.

### Autenticação

| Método | Rota                        | Descrição                                              |
| ------ | --------------------------- | ------------------------------------------------------ |
| POST   | `/api/auth/login`           | Login (retorna access + refresh token ou solicita 2FA) |
| POST   | `/api/auth/refresh`         | Renova access token via refresh token                  |
| POST   | `/api/auth/logout`          | Revoga sessão atual                                    |
| POST   | `/api/auth/change-password` | Altera senha do usuário logado                         |
| POST   | `/api/auth/reset-locks`     | Remove bloqueio por tentativas falhas                  |
| POST   | `/api/auth/2fa/setup`       | Inicia setup de 2FA (gera secret + QR Code)            |
| POST   | `/api/auth/2fa/enable`      | Ativa 2FA com código de verificação                    |
| POST   | `/api/auth/2fa/disable`     | Desativa 2FA                                           |
| POST   | `/api/auth/2fa/verify`      | Verifica código TOTP durante login                     |

### Recursos principais

| Método              | Rota                       | Descrição                       |
| ------------------- | -------------------------- | ------------------------------- |
| GET/POST/PUT/DELETE | `/api/media`               | CRUD de mídias                  |
| GET/POST/PUT/DELETE | `/api/playlists`           | CRUD de playlists               |
| GET/POST            | `/api/playlist-links`      | Gerar e listar links públicos   |
| GET                 | `/api/playlist-links/[id]` | Dados da playlist para o player |
| GET/POST/PUT/DELETE | `/api/players`             | CRUD de players/TVs             |
| GET/POST/PUT/DELETE | `/api/companies`           | CRUD de empresas                |
| GET/POST/PUT/DELETE | `/api/users`               | CRUD de usuários                |
| GET                 | `/api/analytics`           | Dados agregados para dashboards |
| GET                 | `/api/audit-logs`          | Consulta de logs de auditoria   |
| GET/PUT             | `/api/system-settings`     | Configurações globais           |
| POST                | `/api/license`             | Validação de licença ativa      |
| GET                 | `/api/health`              | Healthcheck (usado pelo Docker) |
| GET                 | `/api/file/[...path]`      | Servir arquivos de upload       |

---

## Licença

Este software é proprietário da **SGTI** e está licenciado para uso interno dos clientes. A validação de licença é feita via chave pública Ed25519 (`LICENSE_PUBLIC_KEY`) e requer a chave privada correspondente para gerar novas licenças.

Para suporte técnico, entre em contato com a equipe SGTI.

---

## Créditos

Desenvolvido por **SGTI Tecnologia** — [sgti.tec.br](https://sgti.tec.br)
