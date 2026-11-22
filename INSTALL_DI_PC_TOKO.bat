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
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Git BELUM terpasang! Silakan install Git for Windows terlebih dahulu.
    pause
    exit /b
) else (
    echo [V] Git terpasang.
)

:: Cek PHP
where php >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] PHP BELUM terdeteksi di Command Prompt!
    echo     Pastikan Laragon sudah berjalan atau tambahkan PHP ke PATH.
    pause
    exit /b
) else (
    echo [V] PHP terpasang.
)

:: Cek Composer
where composer >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Composer BELUM terdeteksi!
    pause
    exit /b
) else (
    echo [V] Composer terpasang.
)

:: Cek Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js BELUM terpasang! Silakan install Node.js (LTS version).
    pause
    exit /b
) else (
    echo [V] Node.js terpasang.
)

:: Cek NPM
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] NPM BELUM terpasang!
    pause
    exit /b
) else (
    echo [V] NPM terpasang.
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
echo Sedang mendownload dependensi Laravel, mohon tunggu...
cd /d "%~dp0backend"
call composer install --no-interaction
if %errorlevel% neq 0 (
    echo [X] Gagal menjalankan composer install. Periksa koneksi internet atau PHP extensions.
    pause
    exit /b
)

echo.
echo [*] Menghasilkan APP_KEY Laravel...
call php artisan key:generate

echo.
echo [*] Membuat link symlink storage gambar...
call php artisan storage:link

echo.
echo ======================================================================
echo [*] Langkah 4: Menjalankan Migrasi dan Seeding Database...
echo ======================================================================
echo Pastikan database MySQL 'kalebox' sudah dibuat di Laragon/HeidiSQL!
call php artisan migrate:fresh --seed --force
if %errorlevel% neq 0 (
    echo.
    echo [!] PERINGATAN: Migrasi database gagal atau database 'kalebox' belum ada.
    echo     Buka HeidiSQL di Laragon, buat database bernama: kalebox
    echo     Lalu jalankan manual di folder backend: php artisan migrate --seed
) else (
    echo [V] Migrasi dan seeding database BERHASIL!
)

echo.
echo ======================================================================
echo [*] Langkah 5: Menginstall Dependensi Frontend Internal (NPM Install)...
echo ======================================================================
echo Sedang menginstall modul React (Frontend Internal), mohon tunggu...
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
