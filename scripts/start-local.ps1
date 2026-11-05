# =============================================================================
# DXN Stockpoint Enterprise - Shop Server Launcher (Windows)
# =============================================================================

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "  DXN Stockpoint Enterprise - Shop Server Launcher" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$backendDir = Join-Path $PSScriptRoot "..\apps\backend"

if (-not (Test-Path "$backendDir\.env")) {
    Write-Host "Creating apps/backend/.env from template..." -ForegroundColor Yellow
    Copy-Item "$backendDir\.env.example" "$backendDir\.env"
}

Push-Location $backendDir

Write-Host "`n[1/3] Generating Prisma Client..." -ForegroundColor Green
npx prisma generate

Write-Host "`n[2/3] Applying Database Migrations..." -ForegroundColor Green
try {
    npx prisma migrate deploy
} catch {
    Write-Host "⚠️ Warning: Database not reachable or migrations failed. Please check DATABASE_URL in apps/backend/.env" -ForegroundColor Yellow
}

Write-Host "`n[3/3] Starting Backend Server on http://localhost:4000..." -ForegroundColor Green
Write-Host "Health Check: http://localhost:4000/health" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server.`n" -ForegroundColor Gray

npm run dev
Pop-Location
