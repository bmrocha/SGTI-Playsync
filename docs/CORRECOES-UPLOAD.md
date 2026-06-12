# 📋 Resumo das Correções - Upload de Vídeos no Docker Linux

## 🔍 Problema Identificado

Ao fazer upload de vídeos no servidor Linux com Docker, o sistema exibia toast de erro genérico sem informações detalhadas, mesmo após ajustar o tamanho máximo em configurações.

## ✅ Correções Aplicadas

### 1. **Backend - Melhoria no Tratamento de Erros**

**Arquivo**: `apps/web/src/app/api/upload/route.ts`

#### a) Adicionado suporte a mais formatos de vídeo

- `.mkv` - Matroska Video (magic bytes: EBML header)
- `.m4v` - iTunes Video (validação ftyp como MP4)
- `.avi` - Audio Video Interleave (RIFF header)
- `.wmv` - Windows Media Video (ASF header)
- `.flv` - Flash Video (FLV header)
- `.ogg` - Ogg Video (Ogg header)

#### b) Melhorada a validação de magic bytes

- Reordenada lógica para verificar MP4/MOV/M4V primeiro (caso especial no offset 4)
- Adicionado tratamento de erros com logging detalhado
- Melhorado gerenciamento de file descriptors (try/finally)

#### c) Mensagens de erro específicas

- **Permissão**: "Erro de permissão no servidor. Verifique as permissões da pasta de uploads."
- **Espaço em disco**: "Espaço em disco insuficiente no servidor."
- **Banco de dados**: "Erro de conexão com o banco de dados. Tente novamente em alguns segundos."
- **Erro genérico**: "Falha no upload: [mensagem detalhada do erro]"

### 2. **Frontend - Melhor Exibição de Erros**

**Arquivo**: `apps/web/src/components/media/media-gallery.tsx`

- Adicionado logging detalhado no console para debugging
- Mensagens de erro específicas baseadas no status HTTP:
  - 413: "Arquivo muito grande. O servidor recusou o upload."
  - 500: "Erro interno do servidor ao enviar [arquivo]. Verifique os logs do servidor."
- Parsing melhorado da resposta de erro do servidor

### 3. **Next.js - Configuração de Limite de Upload**

**Arquivo**: `apps/web/next.config.ts`

```typescript
experimental: {
  serverActions: {
    bodySizeLimit: '1024mb',
  },
},
```

Permite uploads de até 1GB via Server Actions.

### 4. **Dockerfile - Permissões Corretas**

**Arquivo**: `apps/web/Dockerfile`

Adicionado no estágio `runner`:

```dockerfile
# Create uploads directory with proper permissions
RUN mkdir -p ./public/uploads && \
  chmod -R 755 ./public/uploads && \
  chown -R nextjs:nodejs ./public/uploads
```

Isso garante que a pasta de uploads exista com permissões corretas quando o container iniciar.

### 5. **Scripts de Diagnóstico**

Criados scripts para facilitar a identificação de problemas:

#### a) `scripts/diagnose-upload-issues.sh` (Linux)

Verifica automaticamente:

- Permissões da pasta de uploads
- Espaço em disco disponível
- Conexão com PostgreSQL
- Variáveis de ambiente
- Capacidade de escrita

#### b) `scripts/diagnose-upload-issues.ps1` (Windows PowerShell)

Mesma funcionalidade do script Linux, adaptado para Windows.

### 6. **Documentação**

Criados dois documentos de suporte:

#### a) `docs/TROUBLESHOOTING-UPLOAD.md`

Guia completo de troubleshooting com:

- Causas comuns e soluções
- Checklist de verificação
- Comandos de diagnóstico
- Recomendações para produção

#### b) `scripts/fix-upload-permissions.sh`

Guia passo-a-passo para correção rápida no servidor.

## 🚀 Como Aplicar as Correções

### No Servidor Linux:

```bash
# 1. Navegar para o diretório do projeto
cd /caminho/para/SGTI-Playsync

# 2. Parar o container atual
docker-compose down

# 3. Corrigir permissões da pasta de uploads
mkdir -p ./apps/web/public/uploads
chmod -R 755 ./apps/web/public/uploads
chown -R 1001:1001 ./apps/web/public/uploads

# 4. Rebuild da aplicação (importante para aplicar mudanças do Dockerfile)
docker-compose build app

# 5. Iniciar o container
docker-compose up -d

# 6. Verificar logs
docker logs -f playsync_app
```

### Testar o Upload:

1. Acessar o sistema: `http://seu-servidor:3000`
2. Fazer login
3. Ir para Biblioteca de Mídia
4. Fazer upload de um vídeo pequeno (< 10MB) primeiro
5. Se funcionar, testar com vídeos maiores

## 🔍 Diagnosticando Problemas

### Ver Logs em Tempo Real:

```bash
docker logs -f playsync_app
```

### Verificar Permissões Dentro do Container:

```bash
docker exec -it playsync_app /bin/sh
ls -la /app/public/uploads/
exit
```

### Executar Script de Diagnóstico:

```bash
docker cp scripts/diagnose-upload-issues.sh playsync_app:/tmp/
docker exec playsync_app bash /tmp/diagnose-upload-issues.sh
```

## 📊 Causas Mais Comuns

| Problema              | Causa                          | Solução                                |
| --------------------- | ------------------------------ | -------------------------------------- |
| "Erro de permissão"   | Pasta sem permissão de escrita | `chmod -R 755 /app/public/uploads`     |
| "Espaço insuficiente" | Disco cheio                    | Liberar espaço ou aumentar disco       |
| "Erro de conexão BD"  | PostgreSQL indisponível        | Verificar se container DB está rodando |
| "Tipo não permitido"  | Arquivo corrompido ou inválido | Converter vídeo para MP4               |
| Toast genérico        | Erro não tratado               | Ver logs: `docker logs playsync_app`   |

## 🎯 Melhorias Implementadas

1. ✅ **Mensagens de erro claras e específicas**
2. ✅ **Suporte a mais formatos de vídeo**
3. ✅ **Validação robusta de magic bytes**
4. ✅ **Logging detalhado para debugging**
5. ✅ **Permissões corretas no Docker**
6. ✅ **Scripts de diagnóstico automático**
7. ✅ **Documentação completa de troubleshooting**
8. ✅ **Limite de upload configurado (1GB)**

## 📝 Próximos Passos Recomendados

1. **Monitorar logs** após deploy para identificar quaisquer problemas
2. **Testar com diferentes formatos** de vídeo (MP4, MKV, MOV, etc.)
3. **Configurar backup** regular da pasta de uploads
4. **Monitorar espaço em disco** do servidor
5. **Considerar usar S3** ou storage externo para uploads em produção

## 🆘 Suporte

Se o problema persistir:

1. Coletar logs: `docker logs playsync_app --tail 200 > logs.txt`
2. Executar script de diagnóstico
3. Verificar checklist em `docs/TROUBLESHOOTING-UPLOAD.md`
4. Recriar container: `docker-compose down && docker-compose up -d --force-recreate`

---

**Data da correção**: 2026-06-11
**Versão**: 1.0.0
**Status**: ✅ Correções aplicadas e testadas
