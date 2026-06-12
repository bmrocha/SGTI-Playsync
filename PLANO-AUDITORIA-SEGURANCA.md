# PLANO DE AUDITORIA DE SEGURANÇA E ANÁLISE DE VULNERABILIDADES

**Documento:** PLANO-AUDITORIA-SEGURANCA-v1.0  
**Versão:** 1.0  
**Data:** 2026-06-12  
**Classificação:** CONFIDENCIAL  
**Aplicabilidade:** Web Apps, APIs, Infraestrutura Cloud, Mobile, Containers

---

## 1. VISÃO GERAL

### 1.1 Propósito

Este documento estabelece o plano completo de auditoria de segurança e análise de vulnerabilidades para identificar, avaliar e remediar falhas de segurança em aplicações web, APIs, infraestrutura e containers ANTES da execução de testes de penetração formais por terceiros.

### 1.2 Escopo

- **Aplicação Web:** Next.js 16, React 19, TypeScript, App Router, API Routes
- **Banco de Dados:** PostgreSQL 15 com queries parametrizadas
- **Infraestrutura:** Docker, Docker Compose, Alpine Linux, Node.js 22
- **Autenticação:** JWT (access + refresh tokens), 2FA/TOTP, bcrypt, RBAC
- **Deploy:** Produção com Docker Compose, healthchecks, volumes persistentes
- **Monitoramento:** Sentry, audit logs, structured logging (pino)

### 1.3 Objetivos

- Identificar 90%+ das vulnerabilidades comuns antes do pentest formal
- Garantir conformidade com OWASP Top 10 2025, LGPD, NIST SP 800-53
- Validar controles de segurança implementados
- Fornecer checklist acionável para desenvolvedores e arquitetos
- Estabelecer baseline de segurança para auditorias futuras
- Reduzir custos de pentest externalizado através de autoavaliação

### 1.4 Público-Alvo

- Arquitetos de Segurança
- Desenvolvedores Full-Stack
- DevOps/SRE Engineers
- CTOs e Tech Leads
- Auditores de Segurança da Informação

---

## 2. METODOLOGIA

### 2.1 Frameworks de Referência

| Framework           | Versão          | Aplicação                                   |
| ------------------- | --------------- | ------------------------------------------- |
| **OWASP Top 10**    | 2025            | Vulnerabilidades críticas de aplicações web |
| **OWASP ASVS**      | 4.0.3           | Verificação de segurança de aplicações      |
| **SANS Top 25**     | 2024            | Erros de software mais perigosos            |
| **PTES**            | 0.9.7           | Padrão técnico de execução de pentest       |
| **NIST SP 800-53**  | Rev 5           | Controles de segurança e privacidade        |
| **NIST SP 800-115** | 2008            | Guia técnico de testes de segurança         |
| **LGPD**            | Lei 13.709/2018 | Proteção de dados pessoais (Brasil)         |
| **CIS Benchmarks**  | 2025            | Hardening de Docker, PostgreSQL, Node.js    |

### 2.2 Classificação de Severidade

| Nível       | Descrição                                                                | SLA de Remediação |
| ----------- | ------------------------------------------------------------------------ | ----------------- |
| **CRÍTICA** | Exploração direta, perda total de controle, exposição de dados sensíveis | 24 horas          |
| **ALTA**    | Exploitação com condições específicas, acesso não autorizado             | 7 dias            |
| **MÉDIA**   | Impacto limitado, requer interação do usuário                            | 30 dias           |
| **BAIXA**   | Melhores práticas, hardening, informação                                 | 90 dias           |

### 2.3 Abordagem de Testes

- **Caixa Branca:** Acesso ao código-fonte, configurações, documentação
- **Caixa Cinza:** Acesso parcial (credenciais de usuário padrão)
- **Automatizado:** Scanners SAST/DAST, análise de dependências
- **Manual:** Revisão de código, lógica de negócio, fluxos complexos

---

## 3. FASE 1: ANÁLISE ESTÁTICA DE SEGURANÇA (SAST)

### 3.1 Revisão de Código-Fonte

#### 3.1.1 Verificações Críticas

- [ ] **Hardcoded Secrets:** Buscar chaves API, senhas, tokens no código

  ```bash
  # Comandos para detecção
  grep -r "password\s*=\s*['\"]" src/ --include="*.ts" --include="*.tsx"
  grep -r "secret\s*=\s*['\"]" src/ --include="*.ts"
  grep -r "API_KEY\s*=\s*['\"]" src/ --include="*.ts"
  grep -r "JWT_SECRET" src/ --include="*.ts" | grep -v "process.env"
  ```

  **Severidade:** CRÍTICA se encontrado em produção

- [ ] **SQL Injection:** Verificar construção de queries SQL

  ```bash
  # Padrões perigosos
  grep -r "query.*\`.*\${" packages/database/src/ --include="*.ts"
  grep -r "query.*\+.*\+" packages/database/src/ --include="*.ts"
  grep -rn "\.query(" packages/database/src/repositories/ --include="*.ts"
  ```

  **Validar:** Todas as queries usam parâmetros parametrizados (`$1, $2`)

- [ ] **Injeção de Comandos:** Execução de comandos do sistema

  ```bash
  grep -r "exec(" src/ --include="*.ts" --include="*.js"
  grep -r "execSync(" src/ --include="*.ts" --include="*.js"
  grep -r "spawn(" src/ --include="*.ts" --include="*.js"
  grep -r "child_process" src/ --include="*.ts"
  ```

  **Severidade:** CRÍTICA se input do usuário é passado sem sanitização

- [ ] **Path Traversal:** Acesso a arquivos do sistema
  ```bash
  grep -r "readFile" src/ --include="*.ts" -A 3
  grep -r "writeFile" src/ --include="*.ts" -A 3
  grep -r "createReadStream" src/ --include="*.ts" -A 3
  grep -r "path.join" src/ --include="*.ts" -A 3
  grep -r "fs\." src/app/api/file/ --include="*.ts" -B 2 -A 5
  ```
  **Validar:** Uso de `path.resolve()`, validação de extensão, restrição de diretório base

#### 3.1.2 Verificações de Autenticação

- [ ] **JWT Security:**

  ```bash
  # Verificar implementação JWT
  grep -r "signToken\|signAccessToken" src/lib/ --include="*.ts" -A 10
  grep -r "verifyToken\|jwt.verify" src/ --include="*.ts" -A 5
  grep -r "algorithm" src/lib/auth*.ts --include="*.ts"
  ```

  **Checklist:**
  - [ ] Algoritmo RS256 ou ES256 (NÃO usar HS256 com segredo fraco)
  - [ ] Expiração adequada (access token: 15min, refresh: 7-30 dias)
  - [ ] Validação de `issuer`, `audience`, `subject`
  - [ ] Revogação implementada (blacklist ou session tracking)
  - [ ] NÃO armazenar dados sensíveis no payload JWT

- [ ] **2FA/TOTP Implementation:**

  ```bash
  grep -r "otplib\|TOTP\|two_factor" src/ --include="*.ts" -A 3
  ```

  **Checklist:**
  - [ ] Secret gerada com criptograficamente seguro (`crypto.randomBytes`)
  - [ ] Período TOTP padrão (30s)
  - [ ] Window de tolerância configurada (±1 período)
  - [ ] Backup codes gerados e armazenados com hash
  - [ ] Rate limiting no endpoint de verificação

- [ ] **Password Hashing:**
  ```bash
  grep -r "bcrypt\|hash\|salt" src/ --include="*.ts" -B 2 -A 2
  ```
  **Validar:**
  - [ ] bcrypt com salt rounds >= 10 (recomendado: 12)
  - [ ] Password policy: mínimo 12 caracteres, complexidade
  - [ ] Prevenção de senhas vazadas (Have I Been Pwned API)
  - [ ] Forçar troca no primeiro login

#### 3.1.3 Validação de Input

- [ ] **Zod Schema Validation:** Verificar se TODOS os endpoints validam input

  ```bash
  # Buscar rotas POST/PUT/DELETE sem validação
  grep -rn "export async function POST\|PUT\|DELETE" src/app/api/ --include="*.ts" -A 15 | grep -v "safeParse\|parse\|z\."
  ```

  **Severidade:** ALTA se endpoint crítico sem validação

- [ ] **File Upload Security:**
  ```bash
  grep -r "upload\|multipart\|FormData" src/ --include="*.ts" -B 2 -A 5
  ls -la apps/web/public/uploads/
  ```
  **Checklist:**
  - [ ] Validação de MIME type (NÃO confiar apenas na extensão)
  - [ ] Validação de tamanho máximo
  - [ ] Renomeação de arquivos (evitar path traversal)
  - [ ] Restrição de extensões permitidas (.jpg, .png, .mp4, .webm)
  - [ ] Scan de malware em uploads (ClamAV)
  - [ ] Armazenamento fora do webroot ou com acesso controlado
  - [ ] Execução de scripts bloqueada (sem .php, .js, .html)

### 3.2 Análise de Dependências

#### 3.2.1 Vulnerabilidades em Packages

```bash
# Verificar vulnerabilidades conhecidas
npm audit --audit-level=moderate
npm audit --json > audit-report.json

# Verificar packages desatualizados
npm outdated

# Verificar licenças de packages
npx license-checker --production --onlyAllow="MIT;ISC;BSD-2-Clause;BSD-3-Clause;Apache-2.0"
```

**Ações:**

- [ ] CRÍTICA: Corrigir todas as vulnerabilidades HIGH/CRITICAL
- [ ] ALTA: Atualizar dependencies com vulnerabilidades MEDIUM
- [ ] MÉDIA: Manter packages atualizados (<= 2 versões atrás)
- [ ] BAIXA: Revisar licenças de terceiros

#### 3.2.2 Ferramentas Automatizadas

```bash
# Instalar e rodar Snyk (gratuito para open source)
npm install -g snyk
snyk auth
snyk test
snyk monitor

# Instalar e rodar Retire.js (detecta libs vulneráveis)
npm install -g retire
retire --js --path apps/web/src/

# OWASP Dependency-Check (Java required)
# Download: https://owasp.org/www-project-dependency-check/
dependency-check.sh --project "PlaySync" --scan . --out dependency-report.html
```

### 3.3 Detecção de Segredos

#### 3.3.1 Varredura de Secrets no Código

```bash
# Instalar gitleaks
# Windows: winget install gitleaks
gitleaks detect --source . --verbose --report-path gitleaks-report.json

# Instalar trufflehog
pip install trufflehog
trufflehog filesystem . --json > trufflehog-report.json

# Detectar arquivos .env commitados
git log --all --full-history -- "**/.env"
git log --all --full-history -- "**/*.env.*"
```

#### 3.3.2 Padrões para Buscar

```bash
# Buscar por padrões de secrets
grep -rE "(password|passwd|pwd)\s*[:=]" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.yml" --include="*.yaml" --exclude-dir=node_modules --exclude-dir=.next

grep -rE "(api_key|apikey|api-key|access_token|secret_key)\s*[:=]" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.yml" --exclude-dir=node_modules --exclude-dir=.next

grep -rE "-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.pem" --include="*.key" --exclude-dir=node_modules
```

**Checklist de Arquivos Sensíveis:**

- [ ] `.env` no `.gitignore`
- [ ] `.env.production` no `.gitignore`
- [ ] `*.key`, `*.pem`, `*.p12` no `.gitignore`
- [ ] `id_rsa`, `id_ed25519` no `.gitignore`
- [ ] `.aws/credentials` no `.gitignore`
- [ ] Verificar `.dockerignore` exclui arquivos sensíveis
- [ ] Verificar `docker-compose.yml` NÃO tem senhas hardcoded

### 3.4 Análise de Configuração

#### 3.4.1 TypeScript Strict Mode

```bash
# Verificar tsconfig.json
cat apps/web/tsconfig.json | grep -A 20 "compilerOptions"
```

**Checklist:**

- [ ] `"strict": true` habilitado
- [ ] `"noImplicitAny": true`
- [ ] `"strictNullChecks": true`
- [ ] `"noUncheckedIndexedAccess": true`
- [ ] `"forceConsistentCasingInFileNames": true`

#### 3.4.2 ESLint Security Rules

```bash
cat apps/web/eslint.config.mjs
```

**Instalar plugins de segurança:**

```bash
npm install --save-dev eslint-plugin-security eslint-config-safe-typescript
```

**Adicionar ao ESLint:**

```javascript
import security from 'eslint-plugin-security';

export default [
  // ... existing configs
  security.configs.recommended,
  {
    rules: {
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-object-injection': 'warn',
    },
  },
];
```

---

## 4. FASE 2: ANÁLISE DINÂMICA DE SEGURANÇA (DAST)

### 4.1 Testes em Runtime

#### 4.1.1 Preparação do Ambiente

```bash
# Build da aplicação em modo produção
npm run build

# Iniciar servidor
npm run start

# Ou usar Docker
docker compose up -d --build

# Verificar se está rodando
curl -I http://localhost:3000/api/health
```

#### 4.1.2 Testes Automatizados com OWASP ZAP

```bash
# Instalar OWASP ZAP
# Windows: https://www.zaproxy.org/download/
# Docker:
docker pull ghcr.io/zaproxy/zaproxy:stable

# Rodar scan baseline
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
  -t http://host.docker.internal:3000 \
  -r zap-report.html \
  -I

# Rodar scan completo (mais demorado)
docker run -t ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py \
  -t http://host.docker.internal:3000 \
  -r zap-full-report.html
```

#### 4.1.3 Testes com Nuclei

```bash
# Instalar Nuclei
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest

# Rodar templates de vulnerabilidades web
nuclei -u http://localhost:3000 -t http/vulnerabilities/ -o nuclei-vuln-report.txt

# Rodar templates de exposição
nuclei -u http://localhost:3000 -t http/exposures/ -o nuclei-exposure-report.txt

# Rodar todos os templates (cuidado: pode ser invasivo)
nuclei -u http://localhost:3000 -o nuclei-full-report.txt
```

### 4.2 Testes de API Security

#### 4.2.1 Autenticação e Autorização

```bash
# Testar endpoint sem autenticação
curl -X GET http://localhost:3000/api/users
curl -X GET http://localhost:3000/api/companies
curl -X GET http://localhost:3000/api/audit-logs

# Testar com token expirado
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired"

# Testar BOLA (Broken Object Level Authorization)
# Fazer login como user1, tentar acessar recursos de user2
curl -X GET http://localhost:3000/api/users/OUTRO_USER_ID \
  -H "Cookie: auth_token=TOKEN_USER1"

# Testar privilege escalation
# User com role 'viewer' tentando acessar endpoints de admin
curl -X DELETE http://localhost:3000/api/users/ID \
  -H "Cookie: auth_token=VIEWER_TOKEN"
```

**Checklist de API Security:**

- [ ] Todos os endpoints protegidos requerem autenticação
- [ ] Authorization header ou cookie validado em cada request
- [ ] RBAC enforced em nível de rota E de repositório
- [ ] BOLA: Usuário só pode acessar seus próprios recursos
- [ ] IDOR: IDs não podem ser manipulados para acessar dados de outros
- [ ] Rate limiting ativo em endpoints sensíveis (login, reset password)
- [ ] Request size limitado (evitar DoS)
- [ ] CORS configurado corretamente (não `*` em produção)
- [ ] Content-Type validation (JSON esperado, não HTML)

#### 4.2.2 Testes de Input Validation

```bash
# SQL Injection via API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br\' OR 1=1 --", "password": "test"}'

# XSS via API
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -d '{"name": "<script>alert(1)</script>", "email": "test@test.com"}'

# NoSQL/JSON Injection
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": {"$gt": ""}, "password": "test"}'

# Path Traversal
curl -X GET "http://localhost:3000/api/file/..%2F..%2F..%2Fetc%2Fpasswd"
curl -X GET "http://localhost:3000/api/file/....//....//etc/passwd"

# Command Injection
curl -X POST http://localhost:3000/api/media \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -d '{"name": "; cat /etc/passwd;"}'
```

### 4.3 Testes de Autenticação

#### 4.3.1 Brute Force Protection

```bash
# Script para testar rate limiting
#!/bin/bash
for i in {1..15}; do
  echo "Tentativa $i"
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "admin@sgti.tec.br", "password": "wrong"}'
  echo ""
  sleep 0.5
done
```

**Validar:**

- [ ] Após 3 tentativas falhas, conta é bloqueada
- [ ] HTTP 429 retornado quando rate limit excedido
- [ ] Lockout duration configurável (mínimo 15 minutos)
- [ ] Admin pode desbloquear contas
- [ ] Logging de tentativas falhas com IP

#### 4.3.2 JWT Token Security

```bash
# Testar token manipulation
# 1. Fazer login e pegar token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br", "password": "SENHA"}' \
  | jq -r '.token')

# 2. Decodificar token (instalar: npm install -g jwt-cli)
jwt decode $TOKEN

# 3. Testar com algoritmo 'none'
# Usar ferramenta: https://github.com/ticarpi/jwt_tool
python3 jwt_tool.py $TOKEN -X a

# 4. Testar com token de outro usuário
# Modificar claim 'id' no payload e re-assinar com HS256

# 5. Testar refresh token reuse
# Usar refresh token 2x - segundo uso deve falhar
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: refresh_token=REFRESH_TOKEN"
```

**Checklist JWT:**

- [ ] Access token expira em <= 15 minutos
- [ ] Refresh token expira em <= 30 dias
- [ ] Refresh token é one-time use (rotation)
- [ ] Token validation verifica `exp`, `iat`, `iss`, `aud`
- [ ] Algoritmo de assinatura validado (não aceitar `none`)
- [ ] Secret mínimo 256 bits
- [ ] Cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`
- [ ] Logout invalida token no servidor (session tracking)

---

## 5. FASE 3: TESTES DE INFRAESTRUTURA

### 5.1 Segurança de Rede

#### 5.1.1 Verificação de Portas e Serviços

```bash
# Scan de portas (requer nmap)
nmap -sV -sC -p- localhost

# Verificar portas expostas no Docker
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Verificar se banco de dados está acessível externamente
# Deve estar em 127.0.0.1:5433, NÃO em 0.0.0.0:5433
netstat -tuln | grep 5433
```

**Checklist de Rede:**

- [ ] PostgreSQL exposto APENAS em `127.0.0.1` (localhost)
- [ ] Porta 3000 exposta para acesso web
- [ ] Firewall configurado (bloquear portas desnecessárias)
- [ ] SSH hardening (desabilitar login root, usar chaves)
- [ ] Fail2ban ativo para proteção de brute force
- [ ] TLS/SSL ativo em produção (HTTPS obrigatório)

#### 5.1.2 Docker Security

```bash
# Verificar configurações do Docker Compose
cat docker-compose.yml

# Analisar imagem Docker
docker scout cve playsync_app:latest

# Verificar se container roda como root
docker exec playsync_app whoami
# Deve retornar 'node' ou outro usuário não-root

# Verificar capabilities do container
docker inspect playsync_app | grep -A 20 "CapAdd\|CapDrop"
```

**Dockerfile Security Checklist:**

```dockerfile
# Verificar apps/web/Dockerfile
```

- [ ] Base image específica (NÃO usar `latest`): `node:22-alpine`
- [ ] Usuário não-root configurado: `USER node`
- [ ] Multi-stage build para reduzir attack surface
- [ ] Somente packages de produção instalados: `npm ci --only=production`
- [ ] Healthcheck configurado
- [ ] Secrets via `--secret` ou env_file, NUNCA hardcoded
- [ ] `.dockerignore` exclui: `.env`, `.git`, `node_modules`, `.next`
- [ ] Read-only filesystem onde possível
- [ ] No unnecessary capabilities (`--cap-drop ALL`)
- [ ] Resource limits configurados (memory, CPU)

**Comandos para Hardening Docker:**

```bash
# Rodar container com security flags
docker run -d \
  --read-only \
  --cap-drop ALL \
  --cap-add NET_BIND_SERVICE \
  --security-opt no-new-privileges:true \
  --memory="512m" \
  --cpus="1.0" \
  --user 1000:1000 \
  playsync_app:latest
```

### 5.2 Container Security Scanning

```bash
# Instalar Trivy
# Windows: winget install trivy
# Ou: https://github.com/aquasecurity/trivy/releases

# Scan de vulnerabilidades na imagem
trivy image playsync_app:latest --severity CRITICAL,HIGH

# Scan do filesystem
trivy fs --severity CRITICAL,HIGH --format table .

# Scan de config (docker-compose.yml, Dockerfile)
trivy config docker-compose.yml
trivy config apps/web/Dockerfile

# Scan completo com relatório
trivy image --format sarif --output trivy-report.sarif playsync_app:latest
```

### 5.3 Cloud Configuration (se aplicável)

#### 5.3.1 AWS Security

```bash
# Instalar Prowler (AWS security auditing)
pip install prowler

# Rodar audit
prowler aws --checks-file custom-checks.json --output-format html

# Verificar S3 buckets públicos
aws s3api list-buckets --query 'Buckets[].Name' | \
  xargs -I {} aws s3api get-bucket-acl --bucket {}

# Verificar security groups
aws ec2 describe-security-groups --output table
```

#### 5.3.2 Checklist de Cloud

- [ ] Storage buckets NÃO públicos (exceto assets estáticos)
- [ ] IAM roles com princípio de menor privilégio
- [ ] Encryption at rest habilitada (RDS, S3, EBS)
- [ ] Encryption in transit (TLS 1.2+)
- [ ] Logging habilitado (CloudTrail, CloudWatch)
- [ ] Backups automatizados testados regularmente
- [ ] WAF configurado para aplicação web
- [ ] DDoS protection ativa
- [ ] Secrets em AWS Secrets Manager ou Parameter Store
- [ ] Security groups restritivos (whitelist de IPs)

---

## 6. FASE 4: TESTES DE APLICAÇÃO WEB

### 6.1 OWASP Top 10 2025 - Guia Detalhado

#### A01:2025 - Broken Access Control

**Testes:**

```bash
# 1. IDOR (Insecure Direct Object Reference)
# Acessar playlist de outra empresa
curl -X GET http://localhost:3000/api/playlists/OUTRA_EMPRESA_ID \
  -H "Cookie: auth_token=TOKEN_EMPRESA_1"

# 2. Horizontal Privilege Escalation
# User de empresa A acessando dados de empresa B
curl -X GET http://localhost:3000/api/media \
  -H "Cookie: auth_token=TOKEN_EMPRESA_A" \
  -H "X-Company-ID: EMPRESA_B_ID"

# 3. Vertical Privilege Escalation
# Viewer tentando criar usuário admin
curl -X POST http://localhost:3000/api/users \
  -H "Cookie: auth_token=VIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "hacker@test.com", "role": "admin", "name": "Hacker"}'

# 4. Bypass de Middleware
# Acessar endpoint de API diretamente sem passar por autenticação
curl -X GET http://localhost:3000/api/users \
  -H "X-Forwarded-For: 127.0.0.1"
```

**Validar:**

- [ ] RBAC implementado em TODOS os endpoints
- [ ] `companyId` validado em cada requisição
- [ ] Middleware de autenticação aplica-se a rotas protegidas
- [ ] Server-side enforcement (NÃO confiar em frontend)
- [ ] Default deny (acesso negado por padrão)

#### A02:2025 - Cryptographic Failures

**Testes:**

```bash
# 1. Verificar se senhas estão hasheadas no banco
docker exec playsync_db_player psql -U playsync -d sgti_playsync \
  -c "SELECT id, email, LEFT(password, 20) FROM users LIMIT 5;"

# 2. Verificar se JWT usa algoritmo forte
curl -s http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br", "password": "SENHA"}' \
  | jq -r '.token' | cut -d. -f1 | base64 -d 2>/dev/null | jq .

# 3. Verificar TLS em produção
openssl s_client -connect seu-dominio.com:443 -tls1_2
openssl s_client -connect seu-dominio.com:443 -tls1_3

# 4. Verificar certificados
nmap --script ssl-cert,ssl-enum-ciphers -p 443 seu-dominio.com
```

**Checklist Criptografia:**

- [ ] Senhas com bcrypt (salt rounds >= 10)
- [ ] TLS 1.2+ em produção
- [ ] HTTPS enforced (HSTS header presente)
- [ ] JWT com algoritmo RS256/ES256
- [ ] Dados sensíveis encryptados em repouso
- [ ] Chaves de criptografia em vault/secret manager
- [ ] NUNCA logar dados sensíveis

#### A03:2025 - Injection

**Testes de SQL Injection:**

```bash
# 1. Authentication bypass
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br' OR '1'='1", "password": "anything"}'

# 2. Union-based SQLi
curl -X GET "http://localhost:3000/api/media?search=' UNION SELECT 1,2,3,4,5,6,7,8,9,10--"

# 3. Blind SQLi
curl -X GET "http://localhost:3000/api/players?name=test' AND 1=1--"
curl -X GET "http://localhost:3000/api/players?name=test' AND 1=2--"

# 4. Time-based SQLi
curl -X GET "http://localhost:3000/api/players?name=test' OR pg_sleep(10)--"
```

**Testes de XSS:**

```bash
# 1. Stored XSS via upload de mídia
curl -X POST http://localhost:3000/api/media \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -F "file=@malicious.svg" \
  -F "name=<script>alert('XSS')</script>"

# 2. Reflected XSS via search
curl -X GET "http://localhost:3000/api/media?search=<img src=x onerror=alert(1)>"

# 3. DOM XSS (testar no navegador via DevTools)
# Injetar via console:
# window.location.hash = "#<script>alert(1)</script>"
```

**Testes de Command Injection:**

```bash
# 1. Via nome de arquivo
curl -X POST http://localhost:3000/api/media \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -F "file=@test.jpg" \
  -F "name=test; cat /etc/passwd"

# 2. Via parâmetros de sistema
curl -X POST http://localhost:3000/api/system-settings \
  -H "Cookie: auth_token=ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"maintenance_message": "$(whoami)"}'
```

#### A04:2025 - Insecure Design

**Avaliação de Design Flaws:**

- [ ] Rate limiting implementado em endpoints críticos?
- [ ] Threat modeling realizado para features novas?
- [ ] Princípio de menor privilégio aplicado?
- [ ] Segregation of duties (separação de funções)?
- [ ] Audit logging de ações sensíveis?
- [ ] Defense in depth (múltiplas camadas de segurança)?

**Testar Fluxos de Negócio:**

```bash
# 1. Bypass de agendamento de conteúdo
# Acessar playlist fora do horário permitido
curl -X GET http://localhost:3000/api/playlist-links/PLAYER_ID

# 2. Manipulação de licença
# Testar com licença expirada
curl -X POST http://localhost:3000/api/license \
  -H "Content-Type: application/json" \
  -d '{"license_key": "EXPIRED_KEY"}'

# 3. Race condition em upload
# Enviar múltiplos uploads simultâneos
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/media \
    -H "Cookie: auth_token=VALID_TOKEN" \
    -F "file=@large-file.mp4" &
done
wait
```

#### A05:2025 - Security Misconfiguration

**Verificações:**

```bash
# 1. Security headers
curl -I http://localhost:3000 | grep -i "x-frame\|x-content-type\|strict-transport\|content-security"

# 2. Error handling
curl -X GET http://localhost:3000/api/nonexistent
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d 'invalid json'

# 3. Directory listing
curl -X GET http://localhost:3000/public/
curl -X GET http://localhost:3000/uploads/

# 4. Default credentials
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br", "password": "MudeEstaSenha123!"}'

# 5. Debug endpoints
curl -X GET http://localhost:3000/api/health
curl -X GET http://localhost:3000/_next/static/
curl -X GET http://localhost:3000/api/__nextjs_original-stack-frame
```

**Checklist de Configuração:**

- [ ] `poweredByHeader: false` no Next.js ✅ (já implementado)
- [ ] Security headers configurados (ver next.config.ts)
- [ ] Environment variables corretamente configuradas
- [ ] Debug mode desabilitado em produção
- [ ] Stack traces não expostos em erros
- [ ] CORS configurado (não `*` em produção)
- [ ] Content-Security-Policy restritiva
- [ ] HSTS habilitado
- [ ] X-Frame-Options: SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff

#### A06:2025 - Vulnerable and Outdated Components

```bash
# Verificar versões de componentes
npm list --depth=0

# Verificar vulnerabilidades
npm audit --audit-level=high

# Verificar Node.js version
node --version
# Deve ser >= 22 (LTS)

# Verificar PostgreSQL version
docker exec playsync_db_player psql --version
# Deve ser >= 15

# Verificar Alpine Linux packages no container
docker exec playsync_app cat /etc/alpine-release
docker exec playsync_app apk list --installed
```

**Ações:**

- [ ] Atualizar packages com vulnerabilidades conhecidas
- [ ] Manter Node.js LTS atualizado
- [ ] Manter PostgreSQL atualizado
- [ ] Remover packages não utilizados
- [ ] Monitorar CVEs de dependencies (GitHub Dependabot, Snyk)

#### A07:2025 - Identification and Authentication Failures

**Testes:**

```bash
# 1. Credential stuffing (simular com lista de senhas comuns)
while read password; do
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"admin@sgti.tec.br\", \"password\": \"$password\"}"
done < common-passwords.txt

# 2. Session fixation
# Fazer login, pegar session ID, usar em outro browser
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br", "password": "SENHA"}'

# Usar cookies em outra sessão
curl -b cookies.txt http://localhost:3000/api/users

# 3. Weak password policy
curl -X POST http://localhost:3000/api/users \
  -H "Cookie: auth_token=ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "password": "123", "name": "Test", "role": "viewer"}'

# 4. 2FA bypass
# Tentar login sem 2FA quando habilitado
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br", "password": "SENHA"}'
# Deve retornar require2fa: true
```

**Checklist de Autenticação:**

- [ ] Password policy: mínimo 12 chars, complexidade
- [ ] 2FA/TOTP disponível e funcional
- [ ] Brute force protection (rate limiting, lockout)
- [ ] Session timeout configurado
- [ ] Secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Password reset seguro (token expirável, one-time use)
- [ ] Login monitoring e alerting
- [ ] Credential stuffing protection

#### A08:2025 - Software and Data Integrity Failures

**Testes:**

```bash
# 1. Verificar integridade de uploads
# Tentar upload de arquivo malicioso
echo '<script>alert(1)</script>' > test.svg
curl -X POST http://localhost:3000/api/media \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -F "file=@test.svg"

# 2. Verificar SRI (Subresource Integrity) em scripts externos
curl http://localhost:3000 | grep -i "integrity"

# 3. Verificar assinatura de licenças
curl -X POST http://localhost:3000/api/license \
  -H "Content-Type: application/json" \
  -d '{"license_key": "INVALID_KEY"}'
```

**Checklist de Integridade:**

- [ ] Validação de integridade de uploads (hash SHA-256)
- [ ] SRI para recursos externos (CDN)
- [ ] Assinatura digital de licenças (Ed25519) ✅ (já implementado)
- [ ] CI/CD pipeline com verificação de integridade
- [ ] Container images assinadas (Cosign)
- [ ] Dependency pinning (lock files commitados)

#### A09:2025 - Security Logging and Monitoring Failures

**Verificações:**

```bash
# 1. Verificar logging de eventos de segurança
docker logs playsync_app 2>&1 | grep -i "login\|auth\|error\|warn"

# 2. Verificar audit logs no banco
docker exec playsync_db_player psql -U playsync -d sgti_playsync \
  -c "SELECT COUNT(*) FROM audit_logs;"

docker exec playsync_db_player psql -U playsync -d sgti_playsync \
  -c "SELECT action, COUNT(*) FROM audit_logs GROUP BY action ORDER BY COUNT(*) DESC LIMIT 10;"

# 3. Verificar structured logging
docker logs playsync_app 2>&1 | head -20 | jq . 2>/dev/null || echo "Não é JSON"
```

**Checklist de Logging:**

- [ ] Log de todas as tentativas de login (sucesso e falha)
- [ ] Log de alterações de permissões
- [ ] Log de acesso a dados sensíveis
- [ ] Log de erros de validação
- [ ] Log formatado em JSON para parsing automatizado
- [ ] Logs centralizados (ELK Stack, Datadog, Sentry)
- [ ] Alertas para eventos críticos
- [ ] Retenção de logs (mínimo 12 meses para LGPD)
- [ ] Logs NÃO contêm dados sensíveis (senhas, tokens, PII)

#### A10:2025 - Server-Side Request Forgery (SSRF)

**Testes:**

```bash
# 1. SSRF via URL externa (se houver feature de import)
curl -X POST http://localhost:3000/api/media/import \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://169.254.169.254/latest/meta-data/"}'

# 2. SSRF via webhook/callback
curl -X POST http://localhost:3000/api/webhooks \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:5432/"}'

# 3. SSRF via DNS rebinding
curl -X POST http://localhost:3000/api/media/import \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "http://localhost:3000/api/users"}'
```

**Mitigações:**

- [ ] Allowlist de domínios permitidos
- [ ] Bloquear IPs privados (127.0.0.0/8, 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- [ ] Bloquear metadata endpoints (169.254.169.254)
- [ ] Validar e sanitizar URLs
- [ ] Timeout em requisições externas

---

## 7. FASE 5: SEGURANÇA DE DADOS

### 7.1 Encryption

#### 7.1.1 Encryption in Transit

```bash
# Verificar TLS configuration
nmap --script ssl-enum-ciphers -p 443 seu-dominio.com

# Testar TLS versions
openssl s_client -connect seu-dominio.com:443 -tls1
openssl s_client -connect seu-dominio.com:443 -tls1_2
openssl s_client -connect seu-dominio.com:443 -tls1_3

# Verificar certificado
openssl s_client -connect seu-dominio.com:443 </dev/null 2>/dev/null | openssl x509 -noout -dates -subject -issuer
```

**Checklist TLS:**

- [ ] TLS 1.2+ habilitado (TLS 1.0/1.1 desabilitados)
- [ ] Cipher suites fortes (ECDHE, AES-GCM, ChaCha20)
- [ ] Certificate válido e não expirado
- [ ] HSTS header configurado
- [ ] Perfect Forward Secrecy (PFS) habilitado

#### 7.1.2 Encryption at Rest

```bash
# Verificar se PostgreSQL tem encryption
docker exec playsync_db_player psql -U playsync -d sgti_playsync \
  -c "SELECT name, setting FROM pg_settings WHERE name LIKE '%ssl%';"

# Verificar se volumes Docker são encryptados
docker inspect postgres_data | grep -i "encrypt"

# Verificar backup encryption
ls -la backups/
file backups/*.sql.gz
```

**Checklist Encryption em Repouso:**

- [ ] SSL/TLS para conexões PostgreSQL (`DATABASE_SSL=true` em produção)
- [ ] Storage volumes encryptados (LUKS, AWS EBS encryption)
- [ ] Backups encryptados
- [ ] Arquivos de upload encryptados ou em storage seguro
- [ ] Chaves de criptografia em vault/secret manager
- [ ] Dados sensíveis (CPF, telefone) encryptados no banco

### 7.2 Proteção de Dados Pessoais (LGPD)

#### 7.2.1 Verificações de Conformidade

```bash
# Buscar por dados pessoais no banco
docker exec playsync_db_player psql -U playsync -d sgti_playsync \
  -c "\d users"

# Verificar se há dados sensíveis
docker exec playsync_db_player psql -U playsync -d sgti_playsync \
  -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users';"

# Verificar logs contêm PII
docker logs playsync_app 2>&1 | grep -iE "email|cpf|telefone|nome" | head -20
```

**LGPD Checklist:**

- [ ] **Consentimento:** Usuários consentem com coleta de dados
- [ ] **Finalidade:** Dados coletados apenas para finalidade específica
- [ ] **Minimização:** Apenas dados necessários são coletados
- [ ] **Transparência:** Política de privacidade disponível
- [ ] **Direitos do titular:** Acesso, retificação, exclusão, portabilidade
- [ ] **Retenção:** Dados deletados quando não mais necessários
- [ ] **Segurança:** Medidas técnicas adequadas implementadas
- [ ] **Notificação de incidente:** Processo para reportar vazamentos
- [ ] **DPO:** Encarregado de dados designado
- [ ] **Logs:** Não armazenar dados sensíveis em logs

#### 7.2.2 Data Mapping

| Dado Pessoal  | Tabela               | Finalidade    | Base Legal         | Retenção                        |
| ------------- | -------------------- | ------------- | ------------------ | ------------------------------- |
| Email         | users                | Autenticação  | Legítimo interesse | Enquanto conta ativa + 12 meses |
| Nome          | users                | Identificação | Legítimo interesse | Enquanto conta ativa + 12 meses |
| IP Address    | audit_logs, sessions | Segurança     | Legítimo interesse | 12 meses                        |
| User Agent    | sessions             | Analytics     | Consentimento      | 12 meses                        |
| Playback Logs | playback_logs        | Analytics     | Legítimo interesse | 6 meses                         |

### 7.3 Backup e Recovery

```bash
# Testar backup
docker exec playsync_db_player pg_dump -U playsync sgti_playsync > backup_$(date +%Y%m%d).sql

# Testar restore
docker exec -i playsync_db_player psql -U playsync -d sgti_playsync < backup_20260612.sql

# Verificar integridade do backup
docker exec playsync_db_player pg_dump -U playsync sgti_playsync | sha256sum
```

**Backup Checklist:**

- [ ] Backups automatizados (daily)
- [ ] Backups encryptados
- [ ] Backups testados regularmente (restore test)
- [ ] Retention policy definida (30 dias mínimo)
- [ ] Offsite storage (S3, Backblaze, etc.)
- [ ] Point-in-time recovery (PITR) habilitado
- [ ] Monitoring de falhas de backup
- [ ] Documentação de procedimento de recovery

---

## 8. FASE 6: AUTENTICAÇÃO E AUTORIZAÇÃO

### 8.1 JWT Security

#### 8.1.1 Análise da Implementação

```bash
# Verificar arquivo de configuração JWT
cat apps/web/src/lib/auth.ts

# Verificar claims do token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br", "password": "SENHA"}' \
  | jq -r '.token')

echo $TOKEN | cut -d. -f1 | base64 -d 2>/dev/null | jq .
echo $TOKEN | cut -d. -f2 | base64 -d 2>/dev/null | jq .
```

**JWT Claims Checklist:**

- [ ] `iss` (issuer): Identificador do emissor
- [ ] `sub` (subject): ID do usuário
- [ ] `aud` (audience): Identificador da aplicação
- [ ] `exp` (expiration): Tempo de expiração
- [ ] `iat` (issued at): Tempo de criação
- [ ] `jti` (JWT ID): Identificador único (para revogação)
- [ ] NENHUM dado sensível no payload (senha, PII)

#### 8.1.2 Testes de Vulnerabilidades JWT

```bash
# Instalar jwt_tool
git clone https://github.com/ticarpi/jwt_tool
cd jwt_tool
pip3 install -r requirements.txt

# Testar algoritmo 'none'
python3 jwt_tool.py $TOKEN -X a

# Testar com chave fraca
python3 jwt_tool.py $TOKEN -C -d dictionary.txt

# Testar confusion attack (RS256 -> HS256)
python3 jwt_tool.py $TOKEN -X k -pk public_key.pem

# Fuzzing de claims
python3 jwt_tool.py $TOKEN -I -hc "role" -hv "admin"
```

**Testes Manuais:**

```bash
# 1. Token sem expiração
# Modificar claim 'exp' para timestamp distante

# 2. Token com role alterada
# Modificar claim 'role' de 'viewer' para 'admin'

# 3. Token com companyId alterada
# Modificar claim 'companyId' para acessar dados de outra empresa

# 4. Replay attack
# Usar mesmo token após logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Cookie: auth_token=$TOKEN"

curl -X GET http://localhost:3000/api/users \
  -H "Cookie: auth_token=$TOKEN"
# Deve falhar
```

### 8.2 Session Management

#### 8.2.1 Verificações de Sessão

```bash
# Verificar repositório de sessões
cat packages/database/src/repositories/session.repository.ts

# Verificar sessões ativas no banco
docker exec playsync_db_player psql -U playsync -d sgti_playsync \
  -c "SELECT id, user_id, created_at, updated_at FROM sessions ORDER BY created_at DESC LIMIT 10;"

# Testar session timeout
# Fazer login, esperar expirar, tentar usar token
```

**Session Management Checklist:**

- [ ] Session ID gerado com criptograficamente seguro
- [ ] Session timeout configurado (30 minutos inatividade)
- [ ] Session invalidada no logout
- [ ] Session binding (IP, User-Agent)
- [ ] Concurrent sessions limit configurável
- [ ] Session tracking no banco para revogação
- [ ] Refresh token rotation implementado
- [ ] Old refresh tokens invalidados após uso

#### 8.2.2 Cookie Security

```bash
# Verificar flags de cookies
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br", "password": "SENHA"}' \
  -D - | grep -i "set-cookie"
```

**Cookie Security Checklist:**

- [ ] `HttpOnly`: Previne acesso via JavaScript
- [ ] `Secure`: Envia apenas via HTTPS
- [ ] `SameSite=Lax` ou `Strict`: Previne CSRF
- [ ] `Path=/`: Escopo do cookie
- [ ] `Domain`: Definido explicitamente
- [ ] `Expires` ou `Max-Age`: Tempo de vida definido
- [ ] `__Host-` prefix para cookies críticos

### 8.3 RBAC (Role-Based Access Control)

#### 8.3.1 Matriz de Permissões

| Permissão            | Admin | Manager | Editor | Viewer |
| -------------------- | ----- | ------- | ------ | ------ |
| Criar usuário        | ✅    | ✅      | ❌     | ❌     |
| Deletar usuário      | ✅    | ❌      | ❌     | ❌     |
| Criar empresa        | ✅    | ❌      | ❌     | ❌     |
| Gerenciar licenças   | ✅    | ❌      | ❌     | ❌     |
| Criar playlist       | ✅    | ✅      | ✅     | ❌     |
| Deletar playlist     | ✅    | ✅      | ✅     | ❌     |
| Upload mídia         | ✅    | ✅      | ✅     | ❌     |
| Visualizar analytics | ✅    | ✅      | ✅     | ✅     |
| Gerenciar players    | ✅    | ✅      | ✅     | ❌     |
| Ver audit logs       | ✅    | ✅      | ❌     | ❌     |

#### 8.3.2 Testes de RBAC

```bash
# Testar cada role
for role in admin manager editor viewer; do
  echo "Testing role: $role"

  # Fazer login com usuário da role
  TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${role}@test.com\", \"password\": \"senha\"}" \
    | jq -r '.token')

  # Testar endpoints proibidos
  curl -s -o /dev/null -w "%{http_code}" \
    -X DELETE http://localhost:3000/api/users/ID \
    -H "Cookie: auth_token=$TOKEN"

  echo ""
done
```

**RBAC Checklist:**

- [ ] Roles bem definidas (admin, manager, editor, viewer)
- [ ] Permissões granulares por recurso
- [ ] Server-side enforcement (não confiar em frontend)
- [ ] Middleware de autorização em TODAS as rotas
- [ ] Princípio de menor privilégio
- [ ] Segregation of duties (SoD)
- [ ] Audit logging de mudanças de permissão
- [ ] Regular review de permissões (quarterly)

---

## 9. FASE 7: SEGURANÇA DE API

### 9.1 Rate Limiting

#### 9.1.1 Verificação de Implementação

```bash
# Verificar configuração de rate limiting
cat apps/web/src/lib/rate-limit.ts

# Testar rate limiting
for i in {1..20}; do
  echo -n "Request $i: "
  curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "test@test.com", "password": "wrong"}'
  echo ""
done
```

**Rate Limiting Checklist:**

- [ ] Login: 10 tentativas/minuto por IP
- [ ] Reset password: 3 tentativas/hora por email
- [ ] API geral: 100 requests/minuto por usuário
- [ ] Upload: 10 uploads/hora por usuário
- [ ] Headers de rate limit na resposta (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`)
- [ ] Rate limiting distribuído (Redis para multi-node)
- [ ] Whitelist para IPs confiáveis
- [ ] Logging de rate limit violations

### 9.2 Input Validation

#### 9.2.1 Validação com Zod

```bash
# Verificar schemas de validação
grep -r "z\.\|zod\|safeParse" apps/web/src/app/api/ --include="*.ts" | head -30

# Buscar endpoints sem validação
grep -L "safeParse\|parse" apps/web/src/app/api/*/route.ts
```

**Input Validation Checklist:**

- [ ] TODOS os inputs validados com Zod schema
- [ ] Validação server-side (não confiar em frontend)
- [ ] Type checking rigoroso
- [ ] Sanitização de strings (trim, escape)
- [ ] Validação de tamanho máximo
- [ ] Validação de formato (email, URL, phone)
- [ ] Whitelist de valores permitidos (enums)
- [ ] Reject unknown fields

#### 9.2.2 Testes de Injeção

```bash
# SQL Injection
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@sgti.tec.br\' OR \'1\'=\'1", "password": "test"}'

# XSS
curl -X POST http://localhost:3000/api/playlists \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(1)</script>"}'

# LDAP Injection (se aplicável)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin)(uid=*))(|(uid=*", "password": "test"}'

# XML Injection (se aplicável)
curl -X POST http://localhost:3000/api/import \
  -H "Cookie: auth_token=VALID_TOKEN" \
  -H "Content-Type: application/xml" \
  -d '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><root>&xxe;</root>'
```

### 9.3 API Documentation e Versioning

```bash
# Verificar se API está documentada
curl http://localhost:3000/api/docs
curl http://localhost:3000/openapi.json

# Verificar versionamento
curl http://localhost:3000/api/v1/users
curl http://localhost:3000/api/v2/users
```

**API Security Checklist:**

- [ ] API documentation atualizada (OpenAPI/Swagger)
- [ ] Versionamento de API (URL ou header)
- [ ] Deprecation policy definida
- [ ] Response codes HTTP corretos (200, 201, 400, 401, 403, 404, 429, 500)
- [ ] Error messages não expõem detalhes internos
- [ ] Pagination implementada (evitar DoS)
- [ ] Request size limitado
- [ ] Content-Type validation
- [ ] CORS configurado corretamente
- [ ] API keys ou tokens para acesso programático

---

## 10. FASE 8: CONFIGURAÇÃO E HARDENING

### 10.1 Server Hardening

#### 10.1.1 Next.js Configuration

```bash
# Verificar next.config.ts
cat apps/web/next.config.ts
```

**Next.js Security Checklist:**

- [ ] `poweredByHeader: false` ✅
- [ ] Security headers configurados ✅
- [ ] CSP restritiva ✅
- [ ] HSTS habilitado ✅
- [ ] X-Frame-Options: SAMEORIGIN ✅
- [ ] X-Content-Type-Options: nosniff ✅
- [ ] Referrer-Policy configurado ✅
- [ ] HTTPS enforced em produção
- [ ] Error pages customizadas (não expor stack traces)
- [ ] Server actions com validação
- [ ] API routes com rate limiting
- [ ] Static files com cache headers

#### 10.1.2 Security Headers Avançados

```bash
# Verificar headers atuais
curl -I http://localhost:3000

# Headers recomendados para adicionar:
# X-Permitted-Cross-Domain-Policies: none
# Cross-Origin-Opener-Policy: same-origin
# Cross-Origin-Resource-Policy: same-origin
# Permissions-Policy: camera=(), microphone=(), geolocation=()
```

**Headers Recomendados:**

```typescript
// Adicionar ao next.config.ts
{
  key: 'Permissions-Policy',
  value: 'camera=(), microphone=(), geolocation=(), payment=()'
},
{
  key: 'Cross-Origin-Opener-Policy',
  value: 'same-origin'
},
{
  key: 'Cross-Origin-Resource-Policy',
  value: 'same-origin'
},
{
  key: 'X-Permitted-Cross-Domain-Policies',
  value: 'none'
}
```

### 10.2 CORS Configuration

```bash
# Verificar CORS atual
curl -I -X OPTIONS http://localhost:3000/api/users \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST"

# Testar com origem legítima
curl -I -X OPTIONS http://localhost:3000/api/users \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"
```

**CORS Checklist:**

- [ ] Origins permitidos definidos explicitamente
- [ ] NÃO usar `*` em produção
- [ ] Métodos HTTP restritos (GET, POST, PUT, DELETE)
- [ ] Headers permitidos definidos
- [ ] Credentials configuradas corretamente
- [ ] Preflight requests (OPTIONS) tratados
- [ ] Player endpoints com CORS específico

### 10.3 Content Security Policy (CSP)

```bash
# Verificar CSP atual
curl -I http://localhost:3000 | grep -i "content-security-policy"
```

**CSP Atual (do next.config.ts):**

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://www.youtube.com https://s.ytimg.com;
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https:;
font-src 'self' data:;
media-src 'self' blob: data: https:;
frame-src 'self' http://localhost:* https://www.youtube.com https://www.youtube-nocookie.com https: data:;
connect-src 'self' https:;
frame-ancestors 'self' *;
```

**Problemas Identificados:**

- ⚠️ `'unsafe-inline'` em script-src (risco XSS)
- ⚠️ `frame-ancestors 'self' *` permite embedding de qualquer domínio
- ⚠️ `https:` muito permissivo em várias diretivas
- ⚠️ `http://localhost:*` deve ser removido em produção

**CSP Recomendada para Produção:**

```
default-src 'self';
script-src 'self' 'nonce-{random}' https://www.youtube.com;
style-src 'self' 'nonce-{random}';
img-src 'self' blob: https://*.youtube.com;
font-src 'self';
media-src 'self' blob: https://*.youtube.com;
frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
connect-src 'self' https://*.sentry.io;
frame-ancestors 'self';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

---

## 11. CHECKLIST DE VERIFICAÇÃO

### 11.1 CRÍTICA (Remediação em 24h)

| #   | Verificação                         | Status | Notas |
| --- | ----------------------------------- | ------ | ----- |
| C1  | Senhas hardcoded no código          | ⬜     |       |
| C2  | SQL Injection vulnerável            | ⬜     |       |
| C3  | XSS stored/reflected                | ⬜     |       |
| C4  | JWT com algoritmo 'none' aceito     | ⬜     |       |
| C5  | Secrets em repositório Git          | ⬜     |       |
| C6  | Autenticação bypassada              | ⬜     |       |
| C7  | Dados sensíveis em logs             | ⬜     |       |
| C8  | RCE via command injection           | ⬜     |       |
| C9  | Path traversal em uploads           | ⬜     |       |
| C10 | Banco de dados exposto publicamente | ⬜     |       |
| C11 | TLS desabilitado em produção        | ⬜     |       |
| C12 | Default credentials ativas          | ⬜     |       |

### 11.2 ALTA (Remediação em 7 dias)

| #   | Verificação                              | Status | Notas |
| --- | ---------------------------------------- | ------ | ----- |
| H1  | IDOR/Insecure Direct Object Reference    | ⬜     |       |
| H2  | Broken Access Control (RBAC)             | ⬜     |       |
| H3  | CSRF em endpoints críticos               | ⬜     |       |
| H4  | Rate limiting ausente                    | ⬜     |       |
| H5  | 2FA bypass possível                      | ⬜     |       |
| H6  | Session fixation                         | ⬜     |       |
| H7  | XML External Entity (XXE)                | ⬜     |       |
| H8  | Server-Side Request Forgery              | ⬜     |       |
| H9  | Insecure deserialization                 | ⬜     |       |
| H10 | Privilege escalation vertical            | ⬜     |       |
| H11 | Brute force sem lockout                  | ⬜     |       |
| H12 | Cookie sem flags HttpOnly/Secure         | ⬜     |       |
| H13 | CORS misconfigured                       | ⬜     |       |
| H14 | File upload sem validação                | ⬜     |       |
| H15 | Dependency com vulnerabilidade conhecida | ⬜     |       |

### 11.3 MÉDIA (Remediação em 30 dias)

| #   | Verificação                        | Status | Notas |
| --- | ---------------------------------- | ------ | ----- |
| M1  | CSP muito permissiva               | ⬜     |       |
| M2  | Headers de segurança ausentes      | ⬜     |       |
| M3  | Error messages verbose             | ⬜     |       |
| M4  | Logging insuficiente               | ⬜     |       |
| M5  | Backup não testado                 | ⬜     |       |
| M6  | Password policy fraca              | ⬜     |       |
| M7  | Session timeout ausente            | ⬜     |       |
| M8  | Falta de monitoring                | ⬜     |       |
| M9  | API sem versionamento              | ⬜     |       |
| M10 | Falta de documentação de segurança | ⬜     |       |
| M11 | Container rodando como root        | ⬜     |       |
| M12 | Docker sem resource limits         | ⬜     |       |
| M13 | Falta de WAF                       | ⬜     |       |
| M14 | SSL/TLS com cipher fraco           | ⬜     |       |
| M15 | Dados pessoais sem encryption      | ⬜     |       |

### 11.4 BAIXA (Remediação em 90 dias)

| #   | Verificação                           | Status | Notas           |
| --- | ------------------------------------- | ------ | --------------- |
| L1  | Powered-By header exposto             | ⬜     | ✅ Já resolvido |
| L2  | Versões de software expostas          | ⬜     |                 |
| L3  | Falta de SRI em recursos externos     | ⬜     |                 |
| L4  | Directory listing habilitado          | ⬜     |                 |
| L5  | Comentários no HTML com info sensível | ⬜     |                 |
| L6  | Autocomplete em campos sensíveis      | ⬜     |                 |
| L7  | Clickjacking possível                 | ⬜     |                 |
| L8  | Faltando meta tags de segurança       | ⬜     |                 |
| L9  | Robots.txt expõe rotas sensíveis      | ⬜     |                 |
| L10 | Favicon fingerprinting                | ⬜     |                 |

---

## 12. FERRAMENTAS RECOMENDADAS

### 12.1 SAST (Static Application Security Testing)

| Ferramenta          | Tipo        | Preço    | Comando                               |
| ------------------- | ----------- | -------- | ------------------------------------- |
| **ESLint Security** | Plugin      | Gratuito | `npm install eslint-plugin-security`  |
| **Semgrep**         | SAST        | Gratuito | `semgrep scan --config auto`          |
| **SonarQube**       | SAST        | Freemium | Docker: `docker run sonarqube`        |
| **CodeQL**          | SAST        | Gratuito | GitHub Actions integration            |
| **Bandit**          | Python SAST | Gratuito | `bandit -r src/`                      |
| **Trivy FS**        | FS Scanner  | Gratuito | `trivy fs --severity HIGH,CRITICAL .` |

### 12.2 DAST (Dynamic Application Security Testing)

| Ferramenta     | Tipo | Preço    | Comando                                                        |
| -------------- | ---- | -------- | -------------------------------------------------------------- |
| **OWASP ZAP**  | DAST | Gratuito | `docker run -t ghcr.io/zaproxy/zaproxy zap-baseline.py -t URL` |
| **Nuclei**     | DAST | Gratuito | `nuclei -u URL -t http/vulnerabilities/`                       |
| **Burp Suite** | DAST | Freemium | GUI application                                                |
| **Arachni**    | DAST | Gratuito | `arachni http://localhost:3000`                                |
| **Wapiti**     | DAST | Gratuito | `wapiti http://localhost:3000`                                 |

### 12.3 Dependency Scanning

| Ferramenta     | Tipo       | Preço    | Comando                            |
| -------------- | ---------- | -------- | ---------------------------------- |
| **npm audit**  | Dependency | Gratuito | `npm audit --audit-level=moderate` |
| **Snyk**       | Dependency | Freemium | `snyk test`                        |
| **Dependabot** | Dependency | Gratuito | GitHub integration                 |
| **Renovate**   | Dependency | Gratuito | GitHub/GitLab integration          |
| **Retire.js**  | JS Scanner | Gratuito | `retire --js --path src/`          |
| **OWASP DC**   | Dependency | Gratuito | `dependency-check.sh --scan .`     |

### 12.4 Secret Detection

| Ferramenta         | Tipo    | Preço    | Comando                      |
| ------------------ | ------- | -------- | ---------------------------- |
| **Gitleaks**       | Secrets | Gratuito | `gitleaks detect --source .` |
| **TruffleHog**     | Secrets | Gratuito | `trufflehog filesystem .`    |
| **detect-secrets** | Secrets | Gratuito | `detect-secrets scan`        |
| **Git-secrets**    | Secrets | Gratuito | `git-secrets scan`           |
| **Talisman**       | Secrets | Gratuito | Git hook integration         |

### 12.5 Container Security

| Ferramenta       | Tipo        | Preço    | Comando                                |
| ---------------- | ----------- | -------- | -------------------------------------- |
| **Trivy**        | Container   | Gratuito | `trivy image playsync_app:latest`      |
| **Docker Scout** | Container   | Gratuito | `docker scout cve playsync_app:latest` |
| **Grype**        | Container   | Gratuito | `grype playsync_app:latest`            |
| **Hadolint**     | Linter      | Gratuito | `hadolint Dockerfile`                  |
| **Checkov**      | IaC Scanner | Gratuito | `checkov -f docker-compose.yml`        |

### 12.6 Network Security

| Ferramenta     | Tipo            | Preço    | Comando                   |
| -------------- | --------------- | -------- | ------------------------- |
| **Nmap**       | Port Scanner    | Gratuito | `nmap -sV -sC -p- host`   |
| **Masscan**    | Port Scanner    | Gratuito | `masscan -p1-65535 host`  |
| **TestSSL.sh** | TLS Scanner     | Gratuito | `testssl.sh https://host` |
| **SSLyze**     | TLS Scanner     | Gratuito | `sslyze --fast host`      |
| **Wireshark**  | Packet Analyzer | Gratuito | GUI application           |

### 12.7 API Security

| Ferramenta        | Tipo         | Preço    | Comando           |
| ----------------- | ------------ | -------- | ----------------- |
| **Postman**       | API Testing  | Freemium | GUI application   |
| **Insomnia**      | API Testing  | Gratuito | GUI application   |
| **OWASP CRASh**   | API Scanner  | Gratuito | Part of OWASP ZAP |
| **42Crunch**      | API Security | Freemium | Platform SaaS     |
| **Salt Security** | API Security | Pago     | Platform SaaS     |

### 12.8 Compliance e Privacy

| Ferramenta          | Tipo        | Preço    | Comando                              |
| ------------------- | ----------- | -------- | ------------------------------------ |
| **Prowler**         | Cloud Audit | Gratuito | `prowler aws`                        |
| **ScoutSuite**      | Cloud Audit | Gratuito | `scout aws`                          |
| **CloudSploit**     | Cloud Audit | Gratuito | `node index.js --config config.json` |
| **Privacy Checker** | LGPD/GDPR   | Gratuito | Manual checklist                     |

---

## 13. MATRIZ DE RISCO

### 13.1 Template de Avaliação de Risco

| ID  | Vulnerabilidade   | Probabilidade (1-5) | Impacto (1-5) | Nível de Risco | Severidade | Responsável | Prazo | Status    |
| --- | ----------------- | ------------------- | ------------- | -------------- | ---------- | ----------- | ----- | --------- |
| R01 | SQL Injection     | 3                   | 5             | 15             | CRÍTICA    | Dev Lead    | 24h   | ⬜ Aberto |
| R02 | XSS Stored        | 4                   | 4             | 16             | CRÍTICA    | Dev Lead    | 24h   | ⬜ Aberto |
| R03 | JWT Weak Secret   | 2                   | 5             | 10             | ALTA       | Security    | 7d    | ⬜ Aberto |
| R04 | Missing 2FA       | 3                   | 4             | 12             | ALTA       | Dev Lead    | 7d    | ⬜ Aberto |
| R05 | CSP Misconfigured | 4                   | 3             | 12             | ALTA       | Frontend    | 7d    | ⬜ Aberto |
| ... | ...               | ...                 | ...           | ...            | ...        | ...         | ...   | ⬜        |

### 13.2 Cálculo de Risco

**Fórmula:** `Risco = Probabilidade × Impacto`

| Probabilidade | Descrição                                 |
| ------------- | ----------------------------------------- |
| 1             | Improvável (requer condições específicas) |
| 2             | Baixa (exploit complexo)                  |
| 3             | Média (exploit disponível)                |
| 4             | Alta (exploit trivial)                    |
| 5             | Certa (automatizado, sem skill)           |

| Impacto | Descrição                                     |
| ------- | --------------------------------------------- |
| 1       | Insignificante (inconveniência menor)         |
| 2       | Menor (impacto limitado, fácil mitigação)     |
| 3       | Moderado (perda de dados não-sensíveis)       |
| 4       | Maior (perda de dados sensíveis, downtime)    |
| 5       | Catastrófico (perda total, multa regulatória) |

### 13.3 Classificação de Risco

| Score | Nível   | Ação                |
| ----- | ------- | ------------------- |
| 1-4   | BAIXO   | Aceitar, monitorar  |
| 5-9   | MÉDIO   | Mitigar em 30 dias  |
| 10-14 | ALTO    | Mitigar em 7 dias   |
| 15-25 | CRÍTICO | Mitigar em 24 horas |

### 13.4 Mapa de Calor de Risco

```
                IMPACTO
          1    2    3    4    5
        +----+----+----+----+----+
     5  |  5 | 10 | 15 | 20 | 25 |  ← CRÍTICO
        +----+----+----+----+----+
P  4  |  4 |  8 | 12 | 16 | 20 |  ← ALTO
R        +----+----+----+----+----+
O  3  |  3 |  6 |  9 | 12 | 15 |  ← ALTO
B        +----+----+----+----+----+
   2  |  2 |  4 |  6 |  8 | 10 |  ← MÉDIO
        +----+----+----+----+----+
   1  |  1 |  2 |  3 |  4 |  5 |  ← BAIXO
        +----+----+----+----+----+
```

---

## 14. PLANO DE REMEDIAÇÃO

### 14.1 Priorização

**Ordem de remediação:**

1. **CRÍTICA:** Exploração ativa ou iminente
2. **ALTA:** Exploitação com condições específicas
3. **MÉDIA:** Impacto limitado
4. **BAIXA:** Hardening e boas práticas

### 14.2 Estratégia de Correção

#### 14.2.1 Vulnerabilidades CRÍTICAS

```bash
# 1. Isolar sistema afetado
docker stop playsync_app

# 2. Aplicar hotfix
# - Corrigir código vulnerável
# - Validar fix
# - Rodar testes

# 3. Deploy de emergência
docker compose up -d --build

# 4. Verificar fix
curl -X TEST_VULNERABILITY http://localhost:3000/api/endpoint

# 5. Monitorar logs
docker logs -f playsync_app
```

#### 14.2.2 Vulnerabilidades ALTAS

- [ ] Criar issue no tracker com detalhes da vulnerabilidade
- [ ] Assignar a desenvolvedor responsável
- [ ] Implementar fix em branch separado
- [ ] Code review por security engineer
- [ ] Testes automatizados para prevenir regressão
- [ ] Deploy em staging
- [ ] Testes de penetração no fix
- [ ] Deploy em produção
- [ ] Monitoring pós-deploy (7 dias)

#### 14.2.3 Vulnerabilidades MÉDIAS

- [ ] Agendar sprint de segurança
- [ ] Implementar fix com testes
- [ ] Code review
- [ ] Deploy normal (CI/CD pipeline)
- [ ] Documentar fix

#### 14.2.4 Vulnerabilidades BAIXAS

- [ ] Adicionar ao backlog
- [ ] Implementar quando conveniente
- [ ] Ou aceitar risco documentado

### 14.3 Template de Plano de Remediação

| Vulnerabilidade | Severidade | Responsável | Início     | Prazo      | Status | Commit | Test |
| --------------- | ---------- | ----------- | ---------- | ---------- | ------ | ------ | ---- |
| SQL Injection   | CRÍTICA    | João        | 2026-06-12 | 2026-06-13 | ⬜     |        |      |
| XSS Stored      | CRÍTICA    | Maria       | 2026-06-12 | 2026-06-13 | ⬜     |        |      |
| CSP Permissiva  | ALTA       | Pedro       | 2026-06-13 | 2026-06-19 | ⬜     |        |      |
| ...             | ...        | ...         | ...        | ...        | ⬜     |        |      |

### 14.4 Verificação Pós-Remediação

```bash
# 1. Rodar scanner novamente
nuclei -u http://localhost:3000 -o post-fix-report.txt

# 2. Testar vulnerabilidade específica
curl -X TEST_VULN http://localhost:3000/api/endpoint

# 3. Verificar logs
docker logs playsync_app | grep -i "error\|warn" | tail -50

# 4. Rodar testes automatizados
npm test

# 5. Code review do fix
git diff main..fix-branch
```

---

## 15. RELATÓRIO FINAL

### 15.1 Template de Relatório de Auditoria

````markdown
# RELATÓRIO DE AUDITORIA DE SEGURANÇA

**Projeto:** SGTI PlaySync  
**Data:** YYYY-MM-DD  
**Auditor:** Nome do Auditor  
**Versão:** 1.0

## 1. EXECUTIVE SUMMARY

### 1.1 Visão Geral

- **Período da Auditoria:** YYYY-MM-DD a YYYY-MM-DD
- **Escopo:** Web App, API, Banco de Dados, Docker
- **Metodologia:** OWASP Top 10 2025, PTES, NIST

### 1.2 Resumo de Vulnerabilidades

| Severidade | Encontradas | Remedidas | Pendentes |
| ---------- | ----------- | --------- | --------- |
| CRÍTICA    | X           | X         | X         |
| ALTA       | X           | X         | X         |
| MÉDIA      | X           | X         | X         |
| BAIXA      | X           | X         | X         |
| **TOTAL**  | **X**       | **X**     | **X**     |

### 1.3 Score de Segurança

- **Score Geral:** X/100
- **Autenticação:** X/100
- **Autorização:** X/100
- **Criptografia:** X/100
- **Configuração:** X/100
- **Logging:** X/100

### 1.4 Principais Riscos

1. **[Vulnerabilidade CRÍTICA 1]** - Descrição breve
2. **[Vulnerabilidade CRÍTICA 2]** - Descrição breve
3. **[Vulnerabilidade ALTA 1]** - Descrição breve

## 2. DETALHAMENTO TÉCNICO

### 2.1 Vulnerabilidades CRÍTICAS

#### 2.1.1 [Nome da Vulnerabilidade]

- **ID:** VULN-001
- **Severidade:** CRÍTICA
- **OWASP:** A03:2025 - Injection
- **Localização:** `src/app/api/endpoint/route.ts:42`
- **Descrição:** Descrição detalhada da vulnerabilidade
- **Impacto:** O que pode acontecer se explorada
- **Probabilidade:** Fácil/Médio/Difícil de explorar
- **Evidência:** Screenshots, logs, PoC code
- **Recomendação:** Como corrigir
- **Referência:** Links para documentação

**Proof of Concept:**

```bash
curl -X EXPLOIT http://localhost:3000/api/endpoint
```
````

**Código Vulnerável:**

```typescript
// Linha vulnerável
const result = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
```

**Código Corrigido:**

```typescript
// Fix com query parametrizada
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### 2.2 Vulnerabilidades ALTAS

[Repetir estrutura para cada vulnerabilidade ALTA]

### 2.3 Vulnerabilidades MÉDIAS

[Repetir estrutura para cada vulnerabilidade MÉDIA]

### 2.4 Vulnerabilidades BAIXAS

[Repetir estrutura para cada vulnerabilidade BAIXA]

## 3. ANÁLISE DE CONFORMIDADE

### 3.1 OWASP Top 10 2025

| Categoria                    | Status          | Notas                    |
| ---------------------------- | --------------- | ------------------------ |
| A01 - Broken Access Control  | ⚠️ Parcial      | 2 issues encontrados     |
| A02 - Cryptographic Failures | ✅ Conforme     |                          |
| A03 - Injection              | ❌ Não conforme | SQL Injection encontrado |
| ...                          | ...             | ...                      |

### 3.2 LGPD

| Requisito                | Status | Notas                             |
| ------------------------ | ------ | --------------------------------- |
| Consentimento            | ✅     | Política de privacidade presente  |
| Direito ao esquecimento  | ⚠️     | Implementar endpoint de deleção   |
| Portabilidade            | ❌     | Não implementado                  |
| Notificação de incidente | ⚠️     | Processo documentado, não testado |

### 3.3 NIST SP 800-53 Controls

| Control                   | Status | Notes            |
| ------------------------- | ------ | ---------------- |
| AC-2 (Account Management) | ✅     |                  |
| AC-3 (Access Enforcement) | ⚠️     | 1 gap encontrado |
| AU-2 (Audit Events)       | ✅     |                  |
| ...                       | ...    | ...              |

## 4. RECOMENDAÇÕES

### 4.1 Imediatas (0-7 dias)

1. Corrigir SQL Injection em `/api/endpoint`
2. Corrigir XSS stored em `/api/media`
3. Atualizar packages com vulnerabilidades

### 4.2 Curto Prazo (7-30 dias)

1. Implementar CSP restritiva
2. Adicionar security headers faltantes
3. Configurar WAF
4. Implementar 2FA obrigatório

### 4.3 Médio Prazo (30-90 dias)

1. Implementar portabilidade de dados (LGPD)
2. Adicionar SRI em recursos externos
3. Implementar container signing
4. Configurar monitoring centralizado

### 4.4 Longo Prazo (90+ dias)

1. Certificação ISO 27001
2. Bug bounty program
3. Pentest trimestral
4. Security training para devs

## 5. CONCLUSÃO

### 5.1 Resumo

O sistema SGTI PlaySync apresenta X vulnerabilidades que requerem atenção imediata.
Após remediação, o score de segurança deve aumentar de X para Y.

### 5.2 Próximos Passos

1. Remediar vulnerabilidades CRÍTICAS em 24h
2. Remediar vulnerabilidades ALTAS em 7 dias
3. Agendar re-audit em 30 dias
4. Contratar pentest externo após remediação

### 5.3 Assinaturas

| Nome         | Cargo                    | Data       | Assinatura |
| ------------ | ------------------------ | ---------- | ---------- |
| Auditor Lead | Security Architect       | YYYY-MM-DD |            |
| CTO          | Chief Technology Officer | YYYY-MM-DD |            |

---

## APÊNDICES

### Apêndice A: Ferramentas Utilizadas

- OWASP ZAP v2.14.0
- Nuclei v3.1.0
- Trivy v0.48.0
- npm audit
- Gitleaks v8.17.0

### Apêndice B: Referências

- OWASP Top 10 2025: https://owasp.org/Top10/
- LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- NIST SP 800-53: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- PTES: http://www.pentest-standard.org/

### Apêndice C: Glossário

- **SAST:** Static Application Security Testing
- **DAST:** Dynamic Application Security Testing
- **RBAC:** Role-Based Access Control
- **JWT:** JSON Web Token
- **CSP:** Content Security Policy
- **HSTS:** HTTP Strict Transport Security
- **IDOR:** Insecure Direct Object Reference
- **SSRF:** Server-Side Request Forgery
- **RCE:** Remote Code Execution
- **PII:** Personally Identifiable Information

````

---

## 16. CHECKLIST PRÉ-PENTEST

### 16.1 Preparação para Pentest Externo

**ANTES de contratar pentest externo, verificar:**

#### 16.1.1 Autoavaliação Completa

- [ ] Todas as fases (1-8) deste plano executadas
- [ ] Vulnerabilidades CRÍTICAS e ALTAS remedidas
- [ ] Scanner SAST rodado e issues resolvidas
- [ ] Scanner DAST rodado e issues resolvidas
- [ ] Dependency scan sem vulnerabilidades HIGH/CRITICAL
- [ ] Secret scan limpo (zero secrets no código)
- [ ] Checklist de verificação (Seção 11) 100% completado

#### 16.1.2 Documentação Preparada

- [ ] Documentação de arquitetura atualizada
- [ ] Diagramas de fluxo de dados
- [ ] Lista de endpoints da API com autenticação requerida
- [ ] Matriz de roles e permissões (RBAC)
- [ ] Data flow diagram (onde dados sensíveis trafegam)
- [ ] Lista de third-party services integrados
- [ ] Policies de segurança documentadas
- [ ] Incident response plan

#### 16.1.3 Ambiente de Testes

- [ ] Ambiente de staging idêntico à produção
- [ ] Dados de teste anonimizados (NÃO usar dados reais)
- [ ] Backups atualizados antes do pentest
- [ ] Monitoring habilitado (detectar atividades do pentester)
- [ ] Logging verbose para auditoria do pentest
- [ ] Rollback plan documentado

#### 16.1.4 Credenciais de Teste

- [ ] Conta admin preparada
- [ ] Contas de teste para cada role (manager, editor, viewer)
- [ ] Players de teste configurados
- [ ] API keys de teste (se aplicável)
- [ ] 2FA desabilitado para contas de teste OU seeds TOTP fornecidos

#### 16.1.5 Escopo Definido

- [ ] URLs/IPS incluídos no escopo
- [ ] URLs/IPS EXCLUÍDOS do escopo (ex: third-party services)
- [ ] Tipos de teste autorizados (black box, gray box, white box)
- [ ] Testes de DoS autorizados? (sim/não)
- [ ] Engenharia social autorizada? (sim/não)
- [ ] Horário permitido para testes (business hours vs off-hours)
- [ ] Contacts de emergência do seu time
- [ ] Contacts de emergência do pentester

#### 16.1.6 Legal e Compliance

- [ ] NDA assinado com empresa de pentest
- [ ] Contrato definindo escopo, responsabilidades, timeline
- [ ] Autorização por escrito para testes
- [ ] Cláusula de confidencialidade
- [ ] Definição de propriedade dos achados
- [ ] SLA para reporte de vulnerabilidades críticas
- [ ] Definição de re-test incluído no contrato

#### 16.1.7 Monitoramento Durante Pentest

```bash
# Configurar monitoring adicional
# 1. Log de todas as requisições
docker logs -f playsync_app > pentest-access.log

# 2. Alertas para atividades suspeitas
tail -f pentest-access.log | grep -i "401\|403\|429\|500"

# 3. Monitorar banco de dados
docker exec playsync_db_player tail -f /var/lib/postgresql/data/log/postgresql-*.log

# 4. Dashboard de segurança (se disponível)
# Sentry, Datadog, ELK Stack
````

#### 16.1.8 Post-Pentest

- [ ] Reunir com pentesters para briefing dos achados
- [ ] Receber relatório draft
- [ ] Validar findings (false positives vs true positives)
- [ ] Priorizar remediação por severidade
- [ ] Criar plano de remediação com timeline
- [ ] Remediar vulnerabilidades
- [ ] Solicitar re-test das vulnerabilidades corrigidas
- [ ] Receber relatório final
- [ ] Apresentar resultados para stakeholders
- [ ] Atualizar documentação de segurança
- [ ] Agendar próximo pentest (recomendado: trimestral)

### 16.2 Perguntas para Empresa de Pentest

**Antes de contratar, perguntar:**

1. **Experiência:**
   - Quantos pentests de aplicações Next.js já realizaram?
   - Certificações da equipe (OSCP, OSWE, GWAPT, CEH)?
   - Referências de clientes similares?

2. **Metodologia:**
   - Seguem OWASP Testing Guide v4?
   - Usam PTES ou metodologia própria?
   - Incluem testes de API REST?
   - Testam lógica de negócio ou apenas técnico?

3. **Entregáveis:**
   - Relatório executivo e técnico separados?
   - Incluem proof-of-concept para cada finding?
   - Fornecem recomendações de correção?
   - Incluem re-test das correções?

4. **Timeline:**
   - Quanto tempo dura o pentest?
   - Quando o relatório é entregue?
   - Qual o SLA para reportar vulnerabilidades críticas?

5. **Preço:**
   - Preço fixo ou por hora?
   - Re-test incluído?
   - Há custos adicionais?

### 16.3 Critérios de Aceitação para Pentest

**O pentest deve:**

- [ ] Cobrir 100% dos endpoints da API
- [ ] Testar todos os flows de autenticação e autorização
- [ ] Incluir testes de OWASP Top 10 2025
- [ ] Testar infraestrutura (Docker, PostgreSQL)
- [ ] Validar compliance LGPD
- [ ] Fornecer PoC executável para cada vulnerability
- [ ] Classificar vulnerabilidades por severidade
- [ ] Incluir recomendações específicas de correção
- [ ] Fornecer relatório executivo para não-técnicos
- [ ] Fornecer relatório técnico detalhado para devs
- [ ] Incluir re-test após correções
- [ ] Fornecer certificate de conclusão

---

## APÊNDICE A: COMANDOS ÚTEIS

### A.1 Scanner Completo Automatizado

```bash
#!/bin/bash
# security-audit.sh - Script completo de auditoria

echo "=== SGTI PlaySync Security Audit ==="
echo "Date: $(date)"
echo ""

# 1. Dependency Audit
echo "[1/8] Running dependency audit..."
npm audit --audit-level=moderate > reports/audit-$(date +%Y%m%d).txt

# 2. Secret Detection
echo "[2/8] Scanning for secrets..."
gitleaks detect --source . --report-path reports/gitleaks-$(date +%Y%m%d).json

# 3. Container Scan
echo "[3/8] Scanning container..."
trivy image playsync_app:latest --severity CRITICAL,HIGH --format table > reports/trivy-$(date +%Y%m%d).txt

# 4. Docker Config Scan
echo "[4/8] Scanning Docker configuration..."
trivy config docker-compose.yml > reports/trivy-config-$(date +%Y%m%d).txt

# 5. Nmap Scan
echo "[5/8] Running nmap scan..."
nmap -sV -sC -p- -oN reports/nmap-$(date +%Y%m%d).txt localhost

# 6. Nuclei Scan
echo "[6/8] Running nuclei scan..."
nuclei -u http://localhost:3000 -o reports/nuclei-$(date +%Y%m%d).txt

# 7. Header Check
echo "[7/8] Checking security headers..."
curl -I http://localhost:3000 > reports/headers-$(date +%Y%m%d).txt

# 8. SSL Check
echo "[8/8] Checking SSL configuration..."
openssl s_client -connect localhost:3000 </dev/null 2>/dev/null | openssl x509 -noout -text > reports/ssl-$(date +%Y%m%d).txt

echo ""
echo "=== Audit Complete ==="
echo "Reports saved to reports/ directory"
```

### A.2 Monitoramento Contínuo

```bash
# GitHub Actions para CI/CD security scanning
name: Security Audit

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 6 * * 1'  # Toda segunda às 6am

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1
        with:
          config: >-
            p/javascript
            p/owasp-top-ten

      - name: Run Trivy filesystem scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          severity: 'CRITICAL,HIGH'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## APÊNDICE B: REFERÊNCIAS

### Documentação Oficial

- **OWASP Top 10 2025:** https://owasp.org/Top10/
- **OWASP Testing Guide v4:** https://owasp.org/www-project-web-security-testing-guide/
- **OWASP ASVS 4.0.3:** https://owasp.org/www-project-application-security-verification-standard/
- **NIST SP 800-53 Rev 5:** https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- **NIST SP 800-115:** https://csrc.nist.gov/publications/detail/sp/800-115/final
- **PTES Technical Guidelines:** http://www.pentest-standard.org/
- **CIS Benchmarks:** https://www.cisecurity.org/cis-benchmarks/
- **LGPD (Lei 13.709/2018):** https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

### Ferramentas

- **OWASP ZAP:** https://www.zaproxy.org/
- **Nuclei:** https://nuclei.projectdiscovery.io/
- **Trivy:** https://aquasecurity.github.io/trivy/
- **Semgrep:** https://semgrep.dev/
- **Gitleaks:** https://github.com/gitleaks/gitleaks
- **jwt_tool:** https://github.com/ticarpi/jwt_tool
- **Nmap:** https://nmap.org/

### Checklists e Templates

- **OWASP Cheat Sheet Series:** https://cheatsheetseries.owasp.org/
- **CIS Controls:** https://www.cisecurity.org/controls/cis-controls-list
- **AWS Security Checklist:** https://aws.amazon.com/architecture/security-identity-compliance/

---

## APÊNDICE C: GLOSSÁRIO

| Termo     | Definição                                                                   |
| --------- | --------------------------------------------------------------------------- |
| **SAST**  | Static Application Security Testing - Análise estática de código            |
| **DAST**  | Dynamic Application Security Testing - Análise dinâmica em runtime          |
| **IAST**  | Interactive Application Security Testing - Combinação SAST+DAST             |
| **RASP**  | Runtime Application Self-Protection - Proteção em tempo de execução         |
| **RBAC**  | Role-Based Access Control - Controle de acesso baseado em roles             |
| **JWT**   | JSON Web Token - Padrão para tokens de autenticação                         |
| **CSP**   | Content Security Policy - Header de segurança para prevenir XSS             |
| **HSTS**  | HTTP Strict Transport Security - Força HTTPS                                |
| **IDOR**  | Insecure Direct Object Reference - Acesso direto a objetos sem autorização  |
| **SSRF**  | Server-Side Request Forgery - Forçar servidor a fazer requests              |
| **RCE**   | Remote Code Execution - Execução remota de código                           |
| **PII**   | Personally Identifiable Information - Dados pessoais identificáveis         |
| **PoC**   | Proof of Concept - Demonstração de vulnerabilidade                          |
| **CVE**   | Common Vulnerabilities and Exposures - Identificador de vulnerabilidade     |
| **CWE**   | Common Weakness Enumeration - Catálogo de fraquezas de software             |
| **CVSS**  | Common Vulnerability Scoring System - Score de severidade                   |
| **WAF**   | Web Application Firewall - Firewall para aplicações web                     |
| **DoS**   | Denial of Service - Negação de serviço                                      |
| **DDoS**  | Distributed Denial of Service - Negação de serviço distribuída              |
| **2FA**   | Two-Factor Authentication - Autenticação em dois fatores                    |
| **TOTP**  | Time-based One-Time Password - Senha descartável baseada em tempo           |
| **LGPD**  | Lei Geral de Proteção de Dados - Regulamentação brasileira de privacidade   |
| **GDPR**  | General Data Protection Regulation - Regulamentação europeia de privacidade |
| **CI/CD** | Continuous Integration/Continuous Deployment                                |
| **PoLP**  | Principle of Least Privilege - Princípio do menor privilégio                |
| **SoD**   | Segregation of Duties - Separação de funções                                |

---

## NOTAS FINAIS

### Manutenção deste Documento

- **Revisar:** Trimestralmente ou após mudanças significativas
- **Atualizar:** Quando novas vulnerabilidades são descobertas
- **Versionar:** Incrementar versão a cada revisão maior
- **Distribuir:** Equipe de desenvolvimento, security, management

### Contatos de Emergência

| Função        | Nome   | Email                | Telefone   |
| ------------- | ------ | -------------------- | ---------- |
| Security Lead | [Nome] | security@sgti.tec.br | [Telefone] |
| CTO           | [Nome] | cto@sgti.tec.br      | [Telefone] |
| DevOps Lead   | [Nome] | devops@sgti.tec.br   | [Telefone] |

### Histórico de Revisões

| Versão | Data       | Autor         | Mudanças       |
| ------ | ---------- | ------------- | -------------- |
| 1.0    | 2026-06-12 | Security Team | Versão inicial |
|        |            |               |                |

---

**Documento classificado como CONFIDENCIAL - Distribuição restrita**

© 2026 SGTI Tecnologia - Todos os direitos reservados
