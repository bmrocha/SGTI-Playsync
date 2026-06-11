# 🔧 Troubleshooting: Upload de Vídeos no Docker Linux

## Problema

Ao fazer upload de vídeos no servidor Linux com Docker, o upload falha com toast de erro genérico, mesmo após ajustar o tamanho em configurações.

## ✅ Correções Aplicadas

### 1. Melhoria no Tratamento de Erros

- **Backend**: Agora retorna mensagens de erro específicas (permissão, espaço em disco, banco de dados)
- **Frontend**: Exibe mensagens detalhadas e logs no console para debugging

### 2. Suporte a Mais Formatos de Vídeo

Adicionados magic bytes para:

- `.mkv` - Matroska Video
- `.m4v` - iTunes Video
- `.avi` - Audio Video Interleave
- `.wmv` - Windows Media Video
- `.flv` - Flash Video
- `.ogg` - Ogg Video

### 3. Limite de Body Size no Next.js

Configurado `bodySizeLimit: '1024mb'` no `next.config.ts` para permitir uploads de até 1GB.

## 🚀 Como Diagnosticar no Servidor

### Opção 1: Script de Diagnóstico Automático

**No servidor Linux:**

```bash
# Copie o script para o servidor
scp scripts/diagnose-upload-issues.sh user@servidor:/tmp/

# Execute dentro do container
docker cp /tmp/diagnose-upload-issues.sh playsync-web:/tmp/
docker exec playsync-web bash /tmp/diagnose-upload-issues.sh
```

### Opção 2: Diagnóstico Manual

#### 1. Verificar Permissões da Pasta de Uploads

```bash
# Entre no container
docker exec -it playsync-web /bin/bash

# Verifique as permissões
ls -la /app/public/uploads/

# Se necessário, corrija as permissões
chmod -R 755 /app/public/uploads/
chown -R node:node /app/public/uploads/
```

#### 2. Verificar Espaço em Disco

```bash
# Dentro do container
df -h /app

# Deve ter pelo menos 1GB livre
```

#### 3. Verificar Logs do Container

```bash
# Veja os logs em tempo real
docker logs -f playsync-web

# Ou veja apenas erros
docker logs playsync-web 2>&1 | grep -i "error\|upload"

# Veja os últimos 100 logs
docker logs playsync-web --tail 100
```

#### 4. Testar Conexão com PostgreSQL

```bash
# Dentro do container
ping db
# ou
nc -zv db 5432
```

#### 5. Verificar Variáveis de Ambiente

```bash
# Dentro do container
echo $DATABASE_URL
echo $NODE_ENV
echo $UPLOAD_LIMIT_VIDEO
```

## 🔍 Causas Comuns e Soluções

### ❌ Erro: "Erro de permissão no servidor"

**Causa**: O container não tem permissão de escrita na pasta de uploads.

**Solução**:

```bash
# No host (fora do container)
docker exec playsync-web chmod -R 755 /app/public/uploads
docker exec playsync-web chown -R node:node /app/public/uploads
```

### ❌ Erro: "Espaço em disco insuficiente"

**Causa**: Disco do servidor ou volume Docker está cheio.

**Solução**:

```bash
# Verificar uso de disco no host
df -h

# Limpar volumes Docker não utilizados
docker system prune -a

# Ou aumentar espaço em disco
```

### ❌ Erro: "Erro de conexão com o banco de dados"

**Causa**: PostgreSQL não está acessível ou credenciais incorretas.

**Solução**:

```bash
# Verificar se o container do DB está rodando
docker ps | grep postgres

# Verificar logs do PostgreSQL
docker logs playsync-db

# Testar conexão
docker exec playsync-web ping db
```

### ❌ Erro: "Tipo de arquivo não permitido"

**Causa**: O arquivo não passou na validação de magic bytes.

**Solução**:

- Verifique se o arquivo é um vídeo válido
- Tente converter o vídeo para MP4 usando FFmpeg:

```bash
ffmpeg -i input.mkv -c:v libx264 -c:a aac output.mp4
```

### ❌ Erro: "Falha no upload: [mensagem genérica]"

**Causa**: Erro interno do servidor.

**Solução**:

```bash
# Ver logs detalhados
docker logs playsync-web --tail 50

# Procure por erros específicos
docker logs playsync-web 2>&1 | grep -A 5 "Upload error"
```

## 📋 Checklist de Verificação

- [ ] Pasta `/app/public/uploads` existe no container
- [ ] Permissões da pasta são 755 ou 777
- [ ] Espaço em disco disponível > 1GB
- [ ] PostgreSQL está rodando e acessível
- [ ] Variável `DATABASE_URL` está configurada
- [ ] Variável `NODE_ENV` está configurada (production)
- [ ] Logs do container não mostram erros críticos
- [ ] Arquivo de vídeo está em formato suportado (mp4, webm, mov, mkv, etc.)
- [ ] Tamanho do arquivo está dentro do limite configurado

## 🔧 Recomendações para Produção

### 1. Usar Volumes Docker para Uploads

```yaml
# docker-compose.yml
services:
  web:
    volumes:
      - uploads_data:/app/public/uploads

volumes:
  uploads_data:
    driver: local
```

### 2. Configurar Limites no docker-compose.yml

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 512M
```

### 3. Monitorar Uso de Disco

```bash
# Adicionar ao crontab para monitoramento
0 */6 * * * docker exec playsync-web df -h /app | mail -s "Disk Usage Report" admin@example.com
```

### 4. Backup Regular de Uploads

```bash
# Backup diário
docker exec playsync-web tar -czf /tmp/uploads-backup-$(date +%Y%m%d).tar.gz /app/public/uploads
docker cp playsync-web:/tmp/uploads-backup-$(date +%Y%m%d).tar.gz /backups/
```

## 📞 Suporte

Se o problema persistir após seguir todos os passos:

1. **Coletar informações**:

   ```bash
   docker logs playsync-web --tail 200 > logs.txt
   docker exec playsync-web df -h > disk.txt
   docker exec playsync-web ls -la /app/public/uploads/ > permissions.txt
   ```

2. **Verificar configuração**:
   - Arquivo `.env` está correto?
   - Docker Compose está configurado corretamente?
   - Rede Docker está funcionando?

3. **Recriar container**:
   ```bash
   docker-compose down
   docker-compose up -d --force-recreate web
   ```

## 🎯 Próximos Passos

Após aplicar as correções:

1. Rebuild da aplicação:

   ```bash
   docker-compose build web
   docker-compose up -d web
   ```

2. Testar upload de um vídeo pequeno (< 10MB) primeiro

3. Verificar se o toast de erro agora mostra mensagem específica

4. Se funcionar, testar com vídeos maiores gradualmente

---

**Última atualização**: $(date +%Y-%m-%d)
**Versão**: 1.0.0
