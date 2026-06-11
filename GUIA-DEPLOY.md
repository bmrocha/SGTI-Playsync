# 🚀 Guia Rápido: Corrigir Upload de Vídeos no Servidor Linux

## ⚡ Resumo

Foram feitas correções no sistema para:

- ✅ Mostrar mensagens de erro claras (não mais toast genérico)
- ✅ Suportar mais formatos de vídeo (MKV, M4V, AVI, WMV, FLV, OGG)
- ✅ Corrigir permissões da pasta de uploads no Docker
- ✅ Adicionar scripts de diagnóstico automático

## 📦 Deploy no Servidor

### Passo 1: Fazer Upload das Alterações

```bash
# No seu computador Windows, envie as alterações para o servidor
# (Usando Git ou SCP)

# Opção A - Git (recomendado)
git add .
git commit -m "fix: melhorar upload de vídeos com tratamento de erros e permissões Docker"
git push

# No servidor Linux
cd /caminho/para/SGTI-Playsync
git pull
```

### Passo 2: Parar o Container Atual

```bash
docker-compose down
```

### Passo 3: Corrigir Permissões da Pasta

```bash
# Criar pasta se não existir
mkdir -p ./apps/web/public/uploads

# Corrigir permissões (UID/GID 1001 = usuário nextjs no container)
chmod -R 755 ./apps/web/public/uploads
chown -R 1001:1001 ./apps/web/public/uploads
```

### Passo 4: Rebuild da Aplicação

```bash
# Reconstruir a imagem (importante para aplicar mudanças do Dockerfile)
docker-compose build app

# Isso vai levar alguns minutos...
```

### Passo 5: Iniciar o Container

```bash
docker-compose up -d
```

### Passo 6: Verificar se Está Funcionando

```bash
# Ver logs em tempo real
docker logs -f playsync_app

# Pressione Ctrl+C para sair dos logs
```

## 🧪 Testar o Upload

1. **Acessar o sistema**: `http://seu-servidor:3000`
2. **Fazer login** com credenciais de admin
3. **Ir para**: Biblioteca de Mídia (menu lateral)
4. **Testar upload**:
   - Clicar na área de upload ou arrastar arquivo
   - Usar um vídeo **pequeno primeiro** (< 10MB)
   - Aguardar confirmação de sucesso

## 🔍 Se Ainda Estiver Falhando

### Verificar Logs Detalhados

```bash
# Ver últimos 100 logs
docker logs playsync_app --tail 100

# Procurar por erros específicos
docker logs playsync_app 2>&1 | grep -i "upload"
docker logs playsync_app 2>&1 | grep -i "error"
```

### Executar Script de Diagnóstico

```bash
# Copiar script para o container
docker cp scripts/diagnose-upload-issues.sh playsync_app:/tmp/

# Executar diagnóstico
docker exec playsync_app bash /tmp/diagnose-upload-issues.sh
```

### Verificar Permissões Dentro do Container

```bash
# Entrar no container
docker exec -it playsync_app /bin/sh

# Verificar pasta de uploads
ls -la /app/public/uploads/

# Testar escrita
touch /app/public/uploads/teste.txt
ls -la /app/public/uploads/teste.txt
rm /app/public/uploads/teste.txt

# Sair
exit
```

### Corrigir Permissões Dentro do Container

```bash
# Entrar no container
docker exec -it playsync_app /bin/sh

# Corrigir permissões
chmod -R 755 /app/public/uploads
chown -R nextjs:nodejs /app/public/uploads

# Sair e reiniciar
exit
docker-compose restart app
```

## 📊 Mensagens de Erro e Soluções

| Mensagem de Erro                       | Causa                          | Solução                                         |
| -------------------------------------- | ------------------------------ | ----------------------------------------------- |
| "Erro de permissão no servidor"        | Pasta sem permissão de escrita | Executar passos de correção de permissões acima |
| "Espaço em disco insuficiente"         | Disco do servidor cheio        | Liberar espaço: `df -h`                         |
| "Erro de conexão com o banco de dados" | PostgreSQL não está rodando    | `docker-compose restart playsync_db_player`     |
| "Tipo de arquivo não permitido"        | Formato de vídeo inválido      | Converter para MP4                              |
| "Falha no upload: [detalhes]"          | Erro específico                | Ver logs: `docker logs playsync_app`            |

## 🎯 Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker logs -f playsync_app

# Reiniciar container
docker-compose restart app

# Parar tudo
docker-compose down

# Iniciar tudo
docker-compose up -d

# Ver espaço em disco
df -h

# Ver uso de disco Docker
docker system df

# Limpar cache Docker (cuidado!)
docker system prune -a
```

## 📋 Checklist Pós-Deploy

- [ ] Container está rodando (`docker-compose ps`)
- [ ] Logs não mostram erros críticos (`docker logs playsync_app`)
- [ ] Pasta de uploads tem permissões corretas (`ls -la`)
- [ ] Upload de vídeo pequeno funciona (< 10MB)
- [ ] Upload de vídeo grande funciona (< tamanho configurado)
- [ ] Toast de erro mostra mensagem específica (não genérica)
- [ ] Espaço em disco disponível > 1GB (`df -h`)

## 🆘 Precisa de Ajuda?

Se o problema persistir:

1. **Coletar informações**:

   ```bash
   docker logs playsync_app --tail 200 > logs.txt
   docker exec playsync_app df -h > disk.txt
   docker exec playsync_app ls -la /app/public/uploads/ > permissions.txt
   ```

2. **Ver documentação completa**: `docs/TROUBLESHOOTING-UPLOAD.md`

3. **Recriar container do zero**:
   ```bash
   docker-compose down
   docker-compose build --no-cache app
   docker-compose up -d
   ```

---

**✅ Após aplicar estas correções, o upload deve funcionar com mensagens de erro claras!**
