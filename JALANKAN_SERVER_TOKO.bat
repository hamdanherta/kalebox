@echo off
title SERVER KALEBOX INTERNAL TOKO
color 0b

echo ======================================================================
echo           MEMULAI SERVER KALEBOX INTERNAL (TOKO PERCETAKAN)
echo ======================================================================
echo.

:: 1. Tampilkan IP Komputer Server ini
echo [*] Mendeteksi IP Address Komputer Toko...
for /f "tokens=4" %%a in ('route print 0.0.0.0 ^| findstr 0.0.0.0 ^| findstr /v "Persistent"') do (
    set LOCAL_IP=%%a
)
echo     IP Komputer Server Toko: %LOCAL_IP%
echo.
echo ======================================================================
echo   KOMPUTER INI:
echo   Buka Browser: http://localhost:5173
echo.
echo   PC LAIN / HP DI TOKO (Kabel LAN / WiFi yang sama):
echo   Buka Browser: http://%LOCAL_IP%:5173
echo ======================================================================
echo.

:: 2. Jalankan Backend Laravel (Port 8000) di background terminal baru
echo [*] Menjalankan Backend Laravel API (Port 8000)...
start "Kalebox Backend API (Port 8000)" cmd /k "cd /d %~dp0backend && php artisan serve --host=0.0.0.0 --port=8000"

:: 3. Jalankan Frontend Internal (Port 5173) di background terminal baru
echo [*] Menjalankan Frontend Internal Karyawan (Port 5173)...
start "Kalebox Frontend Internal (Port 5173)" cmd /k "cd /d %~dp0frontend-internal && npm run dev"

echo.
echo [*] Membuka Dashboard Kalebox di browser default...
timeout /t 3 >nul
start http://localhost:5173

echo.
echo [V] Server berhasil dijalankan! Jendela ini dapat dibiarkan terbuka atau diminimize.
echo     Jangan tutup jendela terminal hitam Backend dan Frontend selama jam toko.
echo.
pause
