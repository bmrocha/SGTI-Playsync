# Script de diagnóstico para upload de vídeos
# Execute no PowerShell

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Diagnóstico de Upload - PlaySync" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar existência da pasta de uploads
Write-Host "1. Verificando pasta de uploads..." -ForegroundColor Yellow
$uploadDirs = @(
    "$PSScriptRoot\..\apps\web\public\uploads",
    "$PSScriptRoot\..\public\uploads"
)

foreach ($dir in $uploadDirs) {
    $fullPath = Resolve-Path $dir -ErrorAction SilentlyContinue
    if ($fullPath) {
        Write-Host "✓ Pasta existe: $fullPath" -ForegroundColor Green
        $acl = Get-Acl $fullPath
        Write-Host "  Permissões: $($acl.AccessToString)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "✗ Pasta não existe: $dir" -ForegroundColor Red
        Write-Host ""
    }
}

# 2. Verificar espaço em disco
Write-Host "2. Espaço em disco disponível:" -ForegroundColor Yellow
$disks = Get-PSDrive -PSProvider FileSystem | Where-Object { $_.Used -gt 0 }
foreach ($disk in $disks) {
    $freeGB = [math]::Round($disk.Free / 1GB, 2)
    $totalGB = [math]::Round(($disk.Used + $disk.Free) / 1GB, 2)
    Write-Host "  Drive $($disk.Name): $freeGB GB livre de $totalGB GB" -ForegroundColor Gray
}
Write-Host ""

# 3. Verificar variáveis de ambiente
Write-Host "3. Variáveis de ambiente:" -ForegroundColor Yellow
Write-Host "  NODE_ENV: $($env:NODE_ENV ?? 'não definido')" -ForegroundColor Gray
Write-Host "  DATABASE_URL: $(if ($env:DATABASE_URL) { 'configurado' } else { 'não definido' })" -ForegroundColor Gray
Write-Host ""

# 4. Verificar Docker (se aplicável)
Write-Host "4. Verificando Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker version --format '{{.Server.Version}}' 2>$null
    if ($dockerVersion) {
        Write-Host "  ✓ Docker está rodando (versão: $dockerVersion)" -ForegroundColor Green
        $containers = docker ps --filter "name=playsync" --format "{{.Names}}" 2>$null
        if ($containers) {
            Write-Host "  Containers PlaySync encontrados:" -ForegroundColor Gray
            foreach ($container in $containers) {
                Write-Host "    - $container" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  ✗ Docker não está rodando" -ForegroundColor Red
    }
} catch {
    Write-Host "  ✗ Docker não está instalado" -ForegroundColor Red
}
Write-Host ""

# 5. Verificar arquivo .env
Write-Host "5. Verificando arquivo .env..." -ForegroundColor Yellow
$envFile = "$PSScriptRoot\..\.env"
if (Test-Path $envFile) {
    Write-Host "  ✓ Arquivo .env encontrado" -ForegroundColor Green
    $envContent = Get-Content $envFile
    $uploadLimit = $envContent | Select-String "UPLOAD_LIMIT"
    if ($uploadLimit) {
        Write-Host "  Configurações de upload:" -ForegroundColor Gray
        $uploadLimit | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    }
} else {
    Write-Host "  ✗ Arquivo .env não encontrado" -ForegroundColor Red
}
Write-Host ""

# 6. Verificar permissões de escrita
Write-Host "6. Testando escrita na pasta de uploads..." -ForegroundColor Yellow
$testFile = "$PSScriptRoot\..\apps\web\public\uploads\test-$(Get-Date -Format 'yyyyMMddHHmmss').tmp"
try {
    New-Item -ItemType File -Path $testFile -Force -ErrorAction Stop | Out-Null
    Write-Host "✓ Escrita bem-sucedida" -ForegroundColor Green
    Remove-Item $testFile -Force
} catch {
    Write-Host "✗ Falha ao criar arquivo de teste" -ForegroundColor Red
    Write-Host "  Verifique as permissões da pasta" -ForegroundColor Yellow
}
Write-Host ""

# 7. Verificar logs do Docker
Write-Host "7. Para ver logs do container Docker:" -ForegroundColor Yellow
Write-Host "  docker logs <nome-do-container> --tail 50" -ForegroundColor Gray
Write-Host "  docker logs <nome-do-container> 2>&1 | Select-String 'error'" -ForegroundColor Gray
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Diagnóstico concluído!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se o upload está falhando no Docker Linux, verifique:" -ForegroundColor White
Write-Host "1. Permissões da pasta de uploads (deve ser 755 ou 777)" -ForegroundColor White
Write-Host "   Execute: docker exec <container> chmod -R 755 /app/public/uploads" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Espaço em disco disponível (mínimo 1GB livre)" -ForegroundColor White
Write-Host "   Execute: docker exec <container> df -h" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Conexão com PostgreSQL está ativa" -ForegroundColor White
Write-Host "   Execute: docker exec <container> ping db" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Logs do container para ver erros detalhados:" -ForegroundColor White
Write-Host "   docker logs <container> --tail 100" -ForegroundColor Gray
Write-Host ""
