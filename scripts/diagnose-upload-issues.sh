#!/bin/bash
# Script de diagnóstico para upload de vídeos no Docker
# Execute dentro do container: docker exec -it <container> /bin/bash

echo "=========================================="
echo "  Diagnóstico de Upload - PlaySync"
echo "=========================================="
echo ""

# 1. Verificar permissões da pasta de uploads
echo "1. Verificando permissões da pasta de uploads..."
UPLOAD_DIRS=(
  "/app/public/uploads"
  "/app/apps/web/public/uploads"
  "/app/.next/standalone/apps/web/public/uploads"
)

for dir in "${UPLOAD_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "✓ Pasta existe: $dir"
    ls -la "$dir" | head -5
    echo "Permissões: $(stat -c '%a %U:%G' "$dir" 2>/dev/null || stat -f '%Lp %Su:%Sg' "$dir" 2>/dev/null)"
    echo ""
  else
    echo "✗ Pasta não existe: $dir"
    echo ""
  fi
done

# 2. Verificar espaço em disco
echo "2. Espaço em disco disponível:"
df -h /app 2>/dev/null || df -h /
echo ""

# 3. Verificar conexão com PostgreSQL
echo "3. Testando conexão com PostgreSQL..."
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL está configurado"
  # Extrair informações da URL
  echo "Host: $(echo $DATABASE_URL | grep -oP '@\K[^:]+')"
  echo "Porta: $(echo $DATABASE_URL | grep -oP ':\K[0-9]+(?=/)')"
else
  echo "✗ DATABASE_URL não está configurado"
fi
echo ""

# 4. Verificar variáveis de ambiente
echo "4. Variáveis de ambiente importantes:"
echo "NODE_ENV: ${NODE_ENV:-não definido}"
echo "UPLOAD_LIMIT: ${UPLOAD_LIMIT:-não definido}"
echo "UPLOAD_LIMIT_VIDEO: ${UPLOAD_LIMIT_VIDEO:-não definido}"
echo ""

# 5. Testar criação de arquivo de teste
echo "5. Testando escrita na pasta de uploads..."
TEST_FILE="/app/public/uploads/test-$(date +%s).tmp"
if touch "$TEST_FILE" 2>/dev/null; then
  echo "✓ Escrita bem-sucedida em $TEST_FILE"
  rm -f "$TEST_FILE"
else
  echo "✗ Falha ao criar arquivo de teste"
  echo "  Execute: chmod -R 755 /app/public/uploads"
fi
echo ""

# 6. Verificar tamanho máximo de upload no código
echo "6. Verificando configuração de limite de upload..."
if [ -f "/app/apps/web/src/app/api/upload/route.ts" ]; then
  grep -A 2 "limitMb" /app/apps/web/src/app/api/upload/route.ts | head -6
elif [ -f "/app/.next/standalone/apps/web/src/app/api/upload/route.ts" ]; then
  grep -A 2 "limitMb" /app/.next/standalone/apps/web/src/app/api/upload/route.ts | head -6
else
  echo "Arquivo de upload não encontrado"
fi
echo ""

# 7. Verificar logs recentes de erros
echo "7. Logs recentes do PM2/Node (se disponível)..."
if command -v pm2 &> /dev/null; then
  pm2 logs --nopager --lines 20 2>/dev/null | grep -i "error\|upload" | tail -10
else
  echo "PM2 não está instalado"
fi
echo ""

echo "=========================================="
echo "  Diagnóstico concluído!"
echo "=========================================="
echo ""
echo "Se o upload está falhando, verifique:"
echo "1. Permissões da pasta de uploads (deve ser 755 ou 777)"
echo "2. Espaço em disco disponível (mínimo 1GB livre)"
echo "3. Conexão com PostgreSQL está ativa"
echo "4. Logs do container: docker logs <container> --tail 50"
echo ""
