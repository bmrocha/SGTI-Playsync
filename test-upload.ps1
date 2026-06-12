# Upload Test Script
# Run this script to test video upload functionality

Write-Host "=== PlaySync Video Upload Test ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:3000"
$testVideoPath = "$PSScriptRoot\test-video.mp4"

# Check if server is running
Write-Host "[1/4] Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✓ Server is running" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Server is NOT running at $baseUrl" -ForegroundColor Red
    Write-Host "  → Start server: npm run dev -w apps/web" -ForegroundColor Yellow
    exit 1
}

# Check if test file exists
Write-Host ""
Write-Host "[2/4] Checking test video file..." -ForegroundColor Yellow
if (Test-Path $testVideoPath) {
    $fileSize = (Get-Item $testVideoPath).Length
    $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
    Write-Host "  ✓ Test file found: $fileSizeMB MB" -ForegroundColor Green
} else {
    Write-Host "  ⚠ Test file not found: $testVideoPath" -ForegroundColor Yellow
    Write-Host "  → Create a test video file (any .mp4 file) at this location" -ForegroundColor Yellow
    Write-Host "  → Or modify `$testVideoPath in this script" -ForegroundColor Yellow
}

# Check upload directory
Write-Host ""
Write-Host "[3/4] Checking upload directory..." -ForegroundColor Yellow
$uploadDir = "$PSScriptRoot\apps\web\public\uploads"
if (Test-Path $uploadDir) {
    Write-Host "  ✓ Upload directory exists: $uploadDir" -ForegroundColor Green
} else {
    Write-Host "  ✗ Upload directory NOT found: $uploadDir" -ForegroundColor Red
    Write-Host "  → Create it: New-Item -ItemType Directory -Path `"$uploadDir`"" -ForegroundColor Yellow
}

# Check system settings
Write-Host ""
Write-Host "[4/4] Checking system settings..." -ForegroundColor Yellow
Write-Host "  → Video upload limit should be >= 1024 MB (1 GB)" -ForegroundColor Cyan
Write-Host "  → Check in: Dashboard > Settings > Media & Player" -ForegroundColor Cyan

Write-Host ""
Write-Host "=== How to Test Manual Upload ===" -ForegroundColor Cyan
Write-Host "1. Open browser: $baseUrl"
Write-Host "2. Login to dashboard"
Write-Host "3. Navigate to: Media Library"
Write-Host "4. Click upload button"
Write-Host "5. Select your 15MB .mp4 video"
Write-Host "6. Watch the progress bar"
Write-Host "7. Verify file appears in gallery"
Write-Host ""
Write-Host "=== Check Server Logs ===" -ForegroundColor Cyan
Write-Host "Look for these messages in console:"
Write-Host "  [Upload] Starting upload process"
Write-Host "  [Upload] User authenticated"
Write-Host "  [Upload] Parsing FormData with Busboy and streaming to disk"
Write-Host "  [Upload] FormData parsing completed"
Write-Host "  [Upload] File received and saved to disk"
Write-Host "  [Upload] Validating magic bytes"
Write-Host "  [Upload] Magic bytes validation completed"
Write-Host "  [Upload] Saving to database"
Write-Host "  [Upload] Upload completed successfully"
Write-Host ""
Write-Host "=== Common Issues ===" -ForegroundColor Cyan
Write-Host "• 413 Error: File size limit too small (check system settings)"
Write-Host "• 500 Error: Check server logs for specific error"
Write-Host "• Timeout: Increase maxDuration in route.ts (currently 120s)"
Write-Host "• Permission Error: Check uploads directory permissions"
Write-Host ""
