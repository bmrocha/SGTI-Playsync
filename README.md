# SGTI-PlaySync

Sistema de gerenciamento de mídia digital para TVs corporativas (Digital Signage).

## Implantação

👉 **Guia completo passo a passo (HTML):** [`deploy-guide.html`](deploy-guide.html)

Abra o `deploy-guide.html` no navegador para instruções detalhadas de implantação manual ou via Docker.

## Stack

- **Frontend/Backend:** Next.js 16 (React 19, Turbopack)
- **Database:** PostgreSQL 15
- **Autenticação:** JWT (HS256) + Refresh Token rotativo + 2FA (TOTP)
- **Estado:** Zustand
- **Validação:** Zod
- **UI:** Tailwind CSS 4, Framer Motion, Recharts

## Estrutura

```
SGTI-Playsync/
├── apps/web/          # Aplicação Next.js 16
│   ├── src/app/api/   # API routes (REST)
│   ├── src/app/dashboard/  # Dashboard pages
│   ├── src/components/     # Componentes React
│   └── src/lib/            # Utilitários (auth, logger, rate-limit...)
├── packages/database/ # Camada de dados (repositories, migrations)
└── packages/shared/   # Tipos TypeScript compartilhados
```

## Comandos Rápidos

```bash
npm install            # Instalar dependências
npm run dev            # Desenvolvimento (http://localhost:3000)
npm run build          # Build produção
npm start              # Iniciar produção
npm run db:migrate     # Rodar migrations
npm run db:seed        # Popular dados iniciais
npm run typecheck      # Verificar tipos
```

## Variáveis de Ambiente Essenciais

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL |
| `JWT_SECRET` | Chave HMAC-SHA256 (min 64 hex chars) |
| `NEXT_PUBLIC_API_URL` | URL pública do servidor |
| `LICENSE_PUBLIC_KEY` | Chave RSA para validação de licença |

Veja a [documentação completa de implantação](deploy-guide.html) para todas as variáveis.
