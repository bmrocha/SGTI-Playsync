# Sistema de Trilha de Auditoria (Audit Trail)

## Visão Geral

O sistema SGTI PlaySync possui um sistema completo de trilha de auditoria que registra todas as ações realizadas pelos usuários, garantindo rastreabilidade, compliance e segurança.

## Características

### ✅ Funcionalidades Implementadas

1. **Registro Completo de Ações**
   - Login/Logout
   - Criação, edição e exclusão de usuários
   - Alteração de funções (roles)
   - Gestão de empresas
   - Gestão de playlists
   - Upload e gestão de mídias
   - Alterações de configurações
   - Exportações realizadas

2. **Dados Registrados por Log**
   - ID único do log
   - ID e nome do usuário
   - Função do usuário (role)
   - Tipo de ação
   - Recurso afetado
   - ID e nome do recurso
   - Detalhes da ação
   - Metadata (JSON)
   - Timestamp
   - Endereço IP

3. **Retenção de Dados**
   - **Período padrão**: 180 dias
   - **Mínimo configurável**: 30 dias
   - **Máximo configurável**: 365 dias
   - Limite configurável via variável de ambiente

4. **Exportação de Logs**
   - Exportação simples (logs filtrados na tela)
   - **Exportação em massa** com seleção de intervalo de datas
   - Formato CSV compatível com Excel
   - Limite de 180 dias por exportação
   - Máximo 100.000 registros por exportação

5. **Limpeza Automática**
   - Endpoint dedicado para limpeza automática
   - Suporte a agendamento via cron job
   - Autenticação via secret key
   - Logs estruturados de auditoria da própria limpeza

## Arquitetura

### Componentes

```
┌─────────────────────────────────────────────────┐
│           Frontend (React/Next.js)              │
│  ┌──────────────────────────────────────────┐   │
│  │  Audit Page (/dashboard/audit)           │   │
│  │  - Filtros avançados                     │   │
│  │  - Tabela paginada                       │   │
│  │  - Exportação CSV simples                │   │
│  │  - Exportação em massa com modal         │   │
│  └──────────────────────────────────────────┘   │
│                     ↓                            │
│  ┌──────────────────────────────────────────┐   │
│  │  Activity Log Store (Zustand)            │   │
│  │  - Cache local                           │   │
│  │  - Sync automático com backend           │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│           Backend (API Routes)                  │
│  ┌──────────────────────────────────────────┐   │
│  │  POST /api/audit                         │   │
│  │  - Criar novo log de auditoria           │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  GET /api/audit                          │   │
│  │  - Buscar logs com filtros               │   │
│  │  - Paginação                             │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  DELETE /api/audit/cleanup               │   │
│  │  - Limpeza manual (admin)                │   │
│  │  - Período configurável                  │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  POST /api/audit/cleanup/auto            │   │
│  │  - Limpeza automática (cron)             │   │
│  │  - Auth via CRON_SECRET_KEY              │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  POST /api/audit/export                  │   │
│  │  - Exportação em massa                   │   │
│  │  - Intervalo de datas                    │   │
│  │  - Download CSV                          │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│         Database (PostgreSQL)                   │
│  ┌──────────────────────────────────────────┐   │
│  │  Table: audit_logs                       │   │
│  │  - Índices otimizados                    │   │
│  │  - UUID primary key                      │   │
│  │  - Timestamp com timezone                │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Estrutura do Banco de Dados

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),
    details TEXT NOT NULL,
    metadata TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Índices para performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs (timestamp);
```

## Configuração

### Variáveis de Ambiente

Adicione ao seu `.env`:

```env
# Segredo para endpoints de cron (gerar: openssl rand -hex 32)
CRON_SECRET=seu_segredo_aqui

# Política de retenção de logs (padrão: 180 dias)
AUDIT_LOG_RETENTION_DAYS=180
```

### Geração do CRON_SECRET

```bash
openssl rand -hex 32
```

## Limpeza Automática (Cron Job)

### Opção 1: Script Node.js

```bash
# Executar manualmente
node apps/web/scripts/cleanup-audit-logs.js

# Agendar no cron (Linux/Mac) - Diariamente às 2 AM
0 2 * * * cd /path/to/project && node apps/web/scripts/cleanup-audit-logs.js
```

### Opção 2: Windows Task Scheduler

1. Abra o **Task Scheduler**
2. Crie uma nova tarefa básica
3. Configure para executar diariamente às 02:00
4. Ação: Iniciar programa
   - Programa: `node.exe`
   - Argumentos: `apps/web/scripts/cleanup-audit-logs.js`
   - Iniciar em: `C:\path\to\SGTI-Playsync`

### Opção 3: Vercel Cron (Produção)

Adicione ao `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/audit/cleanup/auto",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Uso da Interface

### Acesso à Página de Auditoria

1. Faça login como **admin**
2. Navegue para **Dashboard > Auditoria**

### Funcionalidades da UI

#### 1. Estatísticas

- Total de logs
- Ações hoje
- Usuários ativos hoje

#### 2. Filtros Avançados

- Busca por texto
- Filtro por ação
- Filtro por recurso
- Filtro por período:
  - Últimas 24 horas
  - Últimos 7 dias
  - Últimos 30 dias
  - Últimos 90 dias
  - Todos
  - Período personalizado

#### 3. Tabela de Logs

- Paginação (6 logs por página)
- Colunas:
  - Data/Hora
  - Usuário
  - Ação (com badges coloridos)
  - Recurso
  - Detalhes
  - IP
  - Metadata (expansível)

#### 4. Exportação Simples

- Exporta os logs **filtrados atualmente na tela**
- Formato CSV
- Compatível com Excel (BOM UTF-8)

#### 5. Exportação em Massa

1. Clique em **"Exportação em Massa"**
2. Selecione a data inicial
3. Selecione a data final (máx. 180 dias)
4. Clique em **"Exportar"**
5. O download do CSV iniciará automaticamente

## API Endpoints

### Criar Log de Auditoria

```http
POST /api/audit
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "user-123",
  "userName": "João Silva",
  "userRole": "admin",
  "action": "user_created",
  "resource": "user",
  "resourceId": "user-456",
  "resourceName": "Maria Santos",
  "details": "Criou usuário Maria Santos com função editor",
  "metadata": { "role": "editor" }
}
```

### Buscar Logs

```http
GET /api/audit?userId=user-123&action=login&startDate=2024-01-01&endDate=2024-06-01&page=1&limit=50
Authorization: Bearer <token>
```

**Parâmetros Query:**

- `userId` (opcional): Filtrar por usuário
- `action` (opcional): Filtrar por ação
- `resource` (opcional): Filtrar por recurso
- `resources` (opcional): Filtrar por múltiplos recursos (separado por vírgula)
- `startDate` (opcional): Data inicial (ISO 8601)
- `endDate` (opcional): Data final (ISO 8601)
- `page` (opcional, padrão: 1): Número da página
- `limit` (opcional, padrão: 50, máx: 1000): Itens por página

### Limpeza Manual

```http
DELETE /api/audit/cleanup?retentionDays=180
Authorization: Bearer <token>
```

**Parâmetros:**

- `retentionDays` (opcional, padrão: 180): Dias de retenção (30-365)

### Limpeza Automática (Cron)

```http
POST /api/audit/cleanup/auto
Authorization: Bearer <CRON_SECRET>
```

### Exportação em Massa

```http
POST /api/audit/export
Content-Type: application/json
Authorization: Bearer <token>

{
  "startDate": "2024-01-01",
  "endDate": "2024-06-01"
}
```

**Restrições:**

- Intervalo máximo: 180 dias
- Máximo de registros: 100.000
- Formato: CSV com BOM UTF-8

## Tipos de Ações

### Autenticação

- `login`: Login realizado
- `logout`: Logout realizado
- `failed_login`: Tentativa de login falhou

### Gestão de Usuários

- `user_created`: Usuário criado
- `user_updated`: Usuário atualizado
- `user_deleted`: Usuário excluído
- `role_changed`: Função alterada

### Gestão de Empresas

- `company_created`: Empresa criada
- `company_updated`: Empresa atualizada
- `company_deleted`: Empresa excluída

### Gestão de Playlists

- `playlist_created`: Playlist criada
- `playlist_updated`: Playlist atualizada
- `playlist_deleted`: Playlist excluída

### Gestão de Mídias

- `media_uploaded`: Mídia enviada
- `media_updated`: Mídia atualizada
- `media_deleted`: Mídia excluída

### Configurações

- `settings_changed`: Configuração alterada
- `export_performed`: Exportação realizada

## Recursos Monitorados

- `auth`: Autenticação
- `user`: Usuários
- `company`: Empresas
- `playlist`: Playlists
- `media`: Mídias
- `settings`: Configurações
- `system`: Sistema
- `player`: Players
- `sector`: Setores

## Segurança

### Controles de Acesso

1. **Criar Log**: Qualquer usuário autenticado
2. **Buscar Logs**: Apenas administradores
3. **Limpeza Manual**: Apenas administradores
4. **Limpeza Automática**: Admin OU CRON_SECRET
5. **Exportação**: Apenas administradores

### Proteção de Dados

- Logs são imutáveis (não há endpoint de UPDATE)
- Apenas DELETE para limpeza por antiguidade
- Metadata armazenada como JSON string
- IP address capturado automaticamente
- Headers de proxy preservados (x-forwarded-for)

### Auditoria da Auditoria

Todas as operações de limpeza são registradas no log estruturado:

```json
{
  "deletedCount": 1523,
  "retentionDays": 180,
  "cutoffDate": "2024-01-01T00:00:00.000Z",
  "triggeredBy": "cron-job",
  "timestamp": "2024-06-30T02:00:00.000Z"
}
```

## Boas Práticas

### 1. Retenção

- **Mínimo recomendado**: 90 dias
- **Para compliance**: 180-365 dias
- **Padrão do sistema**: 180 dias

### 2. Exportação

- Exporte regularmente para backup
- Use exportação em massa para relatórios
- Mantenha cópias offline para compliance

### 3. Limpeza

- Configure cron job para limpeza automática
- Execute limpeza manual antes de migrations
- Monitore o tamanho da tabela

### 4. Monitoramento

- Verifique estatísticas diariamente
- Configure alertas para ações suspeitas
- Revise logs de failed_login regularmente

## Troubleshooting

### Logs não aparecem

1. Verifique se o usuário é admin
2. Verifique os filtros aplicados
3. Verifique o banco de dados:
   ```sql
   SELECT COUNT(*) FROM audit_logs;
   ```

### Exportação falha

1. Verifique o intervalo de datas (máx 180 dias)
2. Verifique se existem logs no período
3. Verifique os logs do servidor

### Limpeza automática não funciona

1. Verifique se CRON_SECRET está configurado
2. Verifique o agendamento do cron
3. Execute manualmente para testar:
   ```bash
   node apps/web/scripts/cleanup-audit-logs.js
   ```

### Performance lenta

1. Verifique se os índices existem:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs';
   ```
2. Analise a tabela:
   ```sql
   ANALYZE audit_logs;
   ```
3. Considere particionamento por mês se > 1M de registros

## Compliance

### LGPD (Lei Geral de Proteção de Dados)

- ✅ Rastreabilidade de acesso a dados pessoais
- ✅ Registro de quem acessou, quando e o que fez
- ✅ Capacidade de exportar relatórios
- ✅ Retenção configurável conforme política

### ISO 27001

- ✅ Logging de eventos de segurança
- ✅ Proteção contra exclusão não autorizada
- ✅ Retenção definida por política
- ✅ Monitoramento de atividades

### SOX (Sarbanes-Oxley)

- ✅ Trilha de auditoria completa
- ✅ Imutabilidade dos logs
- ✅ Retenção mínima de 180 dias
- ✅ Exportação para relatórios

## Manutenção

### Backup da Tabela

```bash
# Backup completo
pg_dump -t audit_logs sgti_playsync > audit_logs_backup.sql

# Backup de período específico
psql -c "COPY (SELECT * FROM audit_logs WHERE timestamp >= '2024-01-01' AND timestamp < '2024-07-01') TO '/tmp/audit_logs_2024h1.csv' WITH CSV HEADER"
```

### Restauração

```bash
psql sgti_playsync < audit_logs_backup.sql
```

### Estatísticas da Tabela

```sql
-- Total de logs
SELECT COUNT(*) FROM audit_logs;

-- Logs por dia
SELECT DATE(timestamp) as date, COUNT(*)
FROM audit_logs
GROUP BY DATE(timestamp)
ORDER BY date DESC
LIMIT 30;

-- Top 10 usuários mais ativos
SELECT user_name, COUNT(*) as action_count
FROM audit_logs
GROUP BY user_name
ORDER BY action_count DESC
LIMIT 10;

-- Top 10 ações mais comuns
SELECT action, COUNT(*) as count
FROM audit_logs
GROUP BY action
ORDER BY count DESC
LIMIT 10;

-- Tamanho da tabela
SELECT pg_size_pretty(pg_total_relation_size('audit_logs'));
```

## Suporte

Para dúvidas ou issues relacionadas ao sistema de auditoria:

1. Verifique este documento
2. Consulte os logs da aplicação
3. Abra uma issue no repositório

---

**Última atualização**: 2025-06-09  
**Versão**: 2.0.0  
**Autor**: Equipe SGTI PlaySync
