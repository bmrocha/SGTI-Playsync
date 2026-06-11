# ============================================
# PlaySync - Viewer Tracking Setup & Diagnostic (Windows PowerShell)
# ============================================

Write-Host "🔍 PlaySync Viewer Tracking Diagnostic Tool" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "1️⃣  Checking Docker status..." -ForegroundColor Yellow
try {
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Docker is NOT running!" -ForegroundColor Red
        Write-Host "   Please start Docker Desktop and try again." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Docker is NOT running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and try again." -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if containers are running
Write-Host "2️⃣  Checking Docker containers..." -ForegroundColor Yellow
$containers = docker compose ps -q 2>$null
if ([string]::IsNullOrEmpty($containers)) {
    Write-Host "❌ No containers are running!" -ForegroundColor Red
    Write-Host "   Starting containers..." -ForegroundColor Yellow
    docker compose up -d
    Start-Sleep -Seconds 5
} else {
    Write-Host "✅ Containers are running" -ForegroundColor Green
    docker compose ps
}
Write-Host ""

# Check database connectivity
Write-Host "3️⃣  Testing database connectivity..." -ForegroundColor Yellow
$dbContainer = docker compose ps -q postgres 2>$null
if ([string]::IsNullOrEmpty($dbContainer)) {
    $dbContainer = docker compose ps -q db 2>$null
}

if ([string]::IsNullOrEmpty($dbContainer)) {
    Write-Host "❌ Database container not found!" -ForegroundColor Red
    Write-Host "   Make sure your docker-compose.yml includes a postgres service." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✅ Database container found: $dbContainer" -ForegroundColor Green
}
Write-Host ""

# Check if playlist_link_viewers table exists
Write-Host "4️⃣  Checking playlist_link_viewers table..." -ForegroundColor Yellow
$tableCheck = docker exec $dbContainer psql -U postgres -d playsync -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'playlist_link_viewers');" 2>$null
$tableExists = $tableCheck.Trim()

if ($tableExists -eq "t") {
    Write-Host "✅ playlist_link_viewers table exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  playlist_link_viewers table NOT found!" -ForegroundColor Yellow
    Write-Host "   Creating table..." -ForegroundColor Yellow
    
    $createTableSql = @"
    CREATE TABLE IF NOT EXISTS playlist_link_viewers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        playlist_link_id VARCHAR(50) REFERENCES playlist_links(id) ON DELETE CASCADE,
        viewer_id VARCHAR(100) NOT NULL,
        last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_agent TEXT,
        ip_address VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_playlist_link_viewers_link_id ON playlist_link_viewers(playlist_link_id);
    CREATE INDEX IF NOT EXISTS idx_playlist_link_viewers_viewer_id ON playlist_link_viewers(viewer_id);
    CREATE INDEX IF NOT EXISTS idx_playlist_link_viewers_last_heartbeat ON playlist_link_viewers(last_heartbeat);
"@
    
    docker exec $dbContainer psql -U postgres -d playsync -c $createTableSql 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Table created successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create table" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📊 Diagnostic Summary" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ All checks passed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Rebuild your Docker containers:" -ForegroundColor White
Write-Host "   docker compose down" -ForegroundColor Gray
Write-Host "   docker compose up --build -d" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Open your browser to: http://localhost:3000" -ForegroundColor White
Write-Host "3. Login to the dashboard" -ForegroundColor White
Write-Host "4. Navigate to a playlist and click 'Gerar Link'" -ForegroundColor White
Write-Host "5. Copy the generated link" -ForegroundColor White
Write-Host "6. Open the link in another browser/device" -ForegroundColor White
Write-Host "7. Check the browser console (F12) for '[Viewer Tracking]' logs" -ForegroundColor White
Write-Host "8. Return to dashboard - you should see active viewer count" -ForegroundColor White
Write-Host ""
Write-Host "🐛 Debugging tips:" -ForegroundColor Yellow
Write-Host "- Check browser console (F12) for heartbeat logs" -ForegroundColor White
Write-Host "- Check Next.js terminal/logs for API logs" -ForegroundColor White
Write-Host "- Verify database entries:" -ForegroundColor White
Write-Host "  docker exec $dbContainer psql -U postgres -d playsync -c 'SELECT * FROM playlist_link_viewers ORDER BY last_heartbeat DESC LIMIT 5;'" -ForegroundColor Gray
Write-Host ""
