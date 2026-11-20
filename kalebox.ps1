# Kalebox Application Runner (PowerShell)
param(
    [string]$Action = "start"
)

$ErrorActionPreference = "Stop"

function Write-Info($msg) {
    Write-Host "[KALEBOX] $msg" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "[KALEBOX] $msg" -ForegroundColor Green
}

function Write-Warn($msg) {
    Write-Host "[KALEBOX] $msg" -ForegroundColor Yellow
}

function Write-Err($msg) {
    Write-Host "[KALEBOX ERROR] $msg" -ForegroundColor Red
}

# 1. Cek Prasyarat
Write-Info "Memeriksa prasyarat sistem..."
if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Err "PHP tidak ditemukan di PATH! Pastikan Laragon / PHP aktif."
    exit 1
}
if (-not (Get-Command composer -ErrorAction SilentlyContinue)) {
    Write-Err "Composer tidak ditemukan di PATH!"
    exit 1
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js tidak ditemukan di PATH!"
    exit 1
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Err "npm tidak ditemukan di PATH!"
    exit 1
}
Write-Success "Prasyarat sistem (PHP, Composer, Node, npm) terpenuhi."

# 2. Setup Environment Backend
if (-not (Test-Path "backend\.env")) {
    Write-Info "Menyiapkan backend\.env..."
    Copy-Item "backend\.env.example" "backend\.env"
}

# 3. Setup Dependencies
if (-not (Test-Path "backend\vendor")) {
    Write-Info "Menjalankan composer install pada backend..."
    Push-Location backend
    composer install --no-interaction
    Pop-Location
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Info "Menjalankan npm install pada frontend..."
    Push-Location frontend
    npm install
    Pop-Location
}

# 4. Storage Link & Database Setup
Push-Location backend
php artisan storage:link --quiet 2>$null
Pop-Location

if ($Action -eq "setup") {
    Write-Info "Menjalankan database migration & seeder..."
    Push-Location backend
    php artisan migrate --seed --force
    Pop-Location
    Write-Success "Setup selesai!"
    exit 0
}

if ($Action -eq "fresh") {
    Write-Warn "Perhatian: Ini akan mereset seluruh database kalebox!"
    Push-Location backend
    php artisan migrate:fresh --seed --force
    Pop-Location
    Write-Success "Database berhasil di-reset dan diisi ulang (fresh seed)."
    exit 0
}

if ($Action -eq "build") {
    Write-Info "Membangun frontend untuk produksi..."
    Push-Location frontend
    npm run build
    Pop-Location
    Write-Success "Build produksi selesai!"
    exit 0
}

# 5. Pastikan migrasi terbaru sudah berjalan
Push-Location backend
php artisan migrate --force --quiet
Pop-Location

# 6. Menjalankan Server & Services
Clear-Host
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "                KALEBOX SERVER RUNNER                     " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "  Frontend Web     : http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend API      : http://localhost:8000" -ForegroundColor Cyan
Write-Host "  Login Karyawan   : http://localhost:5173/internal/login" -ForegroundColor Yellow
Write-Host "  Akun Owner Awal  : owner@kalebox.id / password123" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "Tekan [Ctrl+C] untuk menghentikan seluruh service." -ForegroundColor Gray
Write-Host ""

# Jalankan Background Jobs & Servers
$backendProc = Start-Process php -ArgumentList "artisan serve --port=8000" -WorkingDirectory "$PSScriptRoot\backend" -PassThru
$queueProc   = Start-Process php -ArgumentList "artisan queue:listen" -WorkingDirectory "$PSScriptRoot\backend" -PassThru
$schedProc   = Start-Process php -ArgumentList "artisan schedule:work" -WorkingDirectory "$PSScriptRoot\backend" -PassThru
$frontProc   = Start-Process npm -ArgumentList "run dev -- --host" -WorkingDirectory "$PSScriptRoot\frontend" -PassThru

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Info "Menghentikan seluruh service..."
    Stop-Process -Id $backendProc.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $queueProc.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $schedProc.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $frontProc.Id -ErrorAction SilentlyContinue
    Write-Success "Seluruh service Kalebox telah dihentikan."
}
