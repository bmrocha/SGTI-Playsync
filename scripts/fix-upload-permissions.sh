# 🚀 Correção Rápida: Upload de Vídeos no Docker

Execute estes comandos no servidor Linux para corrigir o problema de upload:

## Passo 1: Parar o Container
```bash
cd /caminho/para/SGTI-Playsync
docker-compose down
```

## Passo 2: Corrigir Permissões da Pasta de Uploads
```bash
# Criar pasta se não existir
mkdir -p ./apps/web/public/uploads

# Corrigir permissões (o container usa usuário nextjs:nodejs com UID/GID 1001)
chmod -R 755 ./apps/web/public/uploads

# Se estiver usando root no host, mudar proprietário para o usuário do container
chown -R 1001:1001 ./apps/web/public/uploads
```

## Passo 3: Rebuild da Aplicação
```bash
# Reconstruir a imagem com as correções
docker-compose build app

# Ou se quiser reconstruir tudo
docker-compose build --no-cache
```

## Passo 4: Iniciar o Container
```bash
docker-compose up -d
```

## Passo 5: Verificar se Está Funcionando
```bash
# Ver logs
docker-compose logs -f app

# Ou ver logs do container específico
docker logs -f playsync_app
```

## Passo 6: Testar Upload
1. Acesse o sistema: `http://seu-servidor:3000`
2. Faça login
3. Vá para Biblioteca de Mídia
4. Tente fazer upload de um vídeo pequeno (< 10MB) primeiro

## Se Ainda Estiver Falhando

### Verificar Logs Detalhados
```bash
# Ver últimos 100 logs
docker logs playsync_app --tail 100

# Procurar por erros de upload
docker logs playsync_app 2>&1 | grep -i "upload\|error"
```

### Verificar Permissões Dentro do Container
```bash
# Entrar no container
docker exec -it playsync_app /bin/sh

# Verificar permissões
ls -la /app/public/uploads/

# Testar escrita
touch /app/public/uploads/test.txt
ls -la /app/public/uploads/test.txt
rm /app/public/uploads/test.txt

# Sair do container
exit
```

### Corrigir Permissões Dentro do Container
```bash
# Entrar no container
docker exec -it playsync_app /bin/sh

# Corrigir permissões
chmod -R 755 /app/public/uploads
chown -R nextjs:nodejs /app/public/uploads

# Sair
exit

# Reiniciar container
docker-compose restart app
```

## Verificar Espaço em Disco
```bash
# No host
df -h

# Dentro do container
docker exec playsync_app df -h /app
```

## Verificar Conexão com Banco de Dados
```bash
# Dentro do container
docker exec -it playsync_app /bin/sh
ping playsync_db_player
exit
```

## Configurações Recomendadas no .env

Verifique se estas variáveis estão no seu `.env`:

```env
# Limites de Upload (em MB)
UPLOAD_LIMIT=500
UPLOAD_LIMIT_VIDEO=1024

# Ambiente
NODE_ENV=production

# Banco de Dados
POSTGRES_USER=seu_usuario
POSTGRES_PASSWORD=sua_senha_segura
POSTGRES_DB=playsync
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@playsync_db_player:5432/${POSTGRES_DB}?schema=public
```

## Comandos Úteis

### Ver status do container
```bash
docker-compose ps
```

### Reiniciar container
```bash
docker-compose restart app
```

### Parar tudo
```bash
docker-compose down
```

### Iniciar tudo
```bash
docker-compose up -d
```

### Ver uso de disco Docker
```bash
docker system df
```

### Limpar cache Docker (se necessário)
```bash
docker system prune -a
```

---

**Após aplicar as correções**, o upload deve funcionar corretamente com mensagens de erro detalhadas se algum problema ocorrer.
