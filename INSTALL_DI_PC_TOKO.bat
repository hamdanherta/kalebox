@echo off
title SETUP AWAL KALEBOX DI PC TOKO
color 0a

echo ======================================================================
echo          SETUP DAN INSTALASI AWAL KALEBOX INTERNAL DI PC TOKO
echo ======================================================================
echo.

if not exist "%~dp0backend\.env" (
    echo [*] Menyiapkan file konfigurasi backend .env...
    copy "%~dp0backend\.env.example" "%~dp0backend\.env"
)

echo.
echo ======================================================================
echo [*] Menginstall Dependensi Backend Laravel...
echo ======================================================================
cd /d "%~dp0backend"
call composer install --no-interaction

echo.
echo [*] Menghasilkan APP_KEY dan symlink storage...
call php artisan key:generate
call php artisan storage:link

echo.
echo ======================================================================
echo [*] Menjalankan Migrasi dan Seeding Database 'kalebox'...
echo ======================================================================
call php artisan migrate:fresh --seed --force

echo.
echo ======================================================================
echo [*] Menginstall Dependensi Frontend Internal...
echo ======================================================================
cd /d "%~dp0frontend-internal"
call npm install

echo.
echo ======================================================================
echo                 [V] SETUP AWAL SELESAI DENGAN SUKSES!
echo ======================================================================
echo Sekarang Anda bisa menjalankan server dengan klik 2x:
echo                   JALANKAN_SERVER_TOKO.bat
echo ======================================================================
echo.
pause
