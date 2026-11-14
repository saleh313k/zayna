# ============================================
# setup.ps1 - Windows PowerShell Setup Script
# ============================================

# PowerShell equivalent for Windows users
<#
Write-Host "🎨 ZAYNA - Booking System Setup" -ForegroundColor Cyan
Write-Host "================================"
Write-Host ""

# Check Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is required but not installed." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Docker is installed" -ForegroundColor Green

# Create .env file
if (!(Test-Path .env)) {
    @"
# Database
DB_SERVER=localhost
DB_NAME=ZaynaDB
DB_USER=sa
DB_PASSWORD=YourStrong@Passw0rd

# JWT
JWT_KEY=YourSuperSecretKeyForJwtTokenGenerationMinimum32Characters!
JWT_ISSUER=https://zayna.om
JWT_AUDIENCE=https://zayna.om

# Frontend
VITE_API_URL=http://localhost:5000/api
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✓ Created .env file" -ForegroundColor Green
}

# Start containers
Write-Host "Starting Docker containers..." -ForegroundColor Blue
docker-compose down -v
docker-compose up -d

Write-Host ""
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Services:"
Write-Host "  Frontend:  http://localhost:3000"
Write-Host "  Backend:   http://localhost:5000"
Write-Host "  Swagger:   http://localhost:5000/swagger"
#>
