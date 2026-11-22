@echo off
title SETUP AWAL KALEBOX DI PC TOKO
color 0a

echo ======================================================================
echo          SETUP DAN INSTALASI AWAL KALEBOX INTERNAL DI PC TOKO
echo ======================================================================
echo.
echo Pastikan Laragon (atau XAMPP / MySQL) sudah AKTIF sebelum melanjutkan!
echo.
pause

echo.
echo [*] Langkah 1: Memeriksa Alat / Bahan yang dibutuhkan...
echo ----------------------------------------------------------------------

:: Cek Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Git BELUM terpasang! Silakan install Git for Windows terlebih dahulu.
    pause
    exit /b
) else (
    echo [V] Git terpasang.
)

:: Cek PHP
php -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] PHP BELUM terdeteksi di Command Prompt!
    echo     Pastikan Laragon sudah berjalan atau tambahkan PHP ke PATH.
    pause
    exit /b
) else (
    echo [V] PHP terpasang.
)

:: Cek Composer
composer --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Composer BELUM terdeteksi!
    pause
    exit /b
) else (
    echo [V] Composer terpasang.
)

:: Cek Node.js & NPM
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js BELUM terpasang! Silakan install Node.js (LTS version).
    pause
    exit /b
) else (
    echo [V] Node.js terpasang.
)

echo.
echo ======================================================================
echo [*] Langkah 2: Menyiapkan Konfigurasi Backend (.env)...
echo ======================================================================
if not exist "%~dp0backend\.env" (
    echo [*] Membuat file backend\.env dari template .env.example...
    copy "%~dp0backend\.env.example" "%~dp0backend\.env"
) else (
    echo [V] File backend\.env sudah ada.
)

echo.
echo ======================================================================
echo [*] Langkah 3: Menginstall Dependensi Backend (Composer Install)...
echo ======================================================================
cd /d "%~dp0backend"
call composer install --no-interaction
if %errorlevel% neq 0 (
    echo [X] Gagal menjalankan composer install. Periksa koneksi internet atau PHP extensions.
    pause
    exit /b
)

echo.
echo [*] Menghasilkan APP_KEY Laravel...
php artisan key:generate

echo.
echo [*] Membuat link symlink storage gambar...
php artisan storage:link

echo.
echo ======================================================================
echo [*] Langkah 4: Membuat Database dan Menjalankan Migrasi Data Awal...
echo ======================================================================
echo Pastikan database MySQL 'kalebox' sudah dibuat di Laragon/HeidiSQL/phpMyAdmin!
echo Menjalankan migrasi dan seeding data awal (Owner, Admin, Desain, Produk, dll)...
php artisan migrate:fresh --seed --force
if %errorlevel% neq 0 (
    echo.
    echo [!] PERINGATAN: Migrasi database gagal atau database 'kalebox' belum ada.
    echo     Buka HeidiSQL/phpMyAdmin di Laragon, buat database bernama: kalebox
    echo     Lalu jalankan manual di folder backend: php artisan migrate --seed
) else (
    echo [V] Migrasi dan seeding database BERHASIL!
)

echo.
echo ======================================================================
echo [*] Langkah 5: Menginstall Dependensi Frontend Internal (NPM Install)...
echo ======================================================================
cd /d "%~dp0frontend-internal"
call npm install
if %errorlevel% neq 0 (
    echo [X] Gagal menjalankan npm install pada frontend-internal.
    pause
    exit /b
)

echo.
echo ======================================================================
echo                 [V] SETUP AWAL SELESAI DENGAN SUKSES!
echo ======================================================================
echo Sekarang Anda bisa menjalankan server kapan saja dengan klik 2x file:
echo                   JALANKAN_SERVER_TOKO.bat
echo ======================================================================
echo.
pause
