@echo off
title PASANG AUTOSTART SERVER KALEBOX
color 0a

echo ======================================================================
echo       PASANG AUTOSTART: SERVER OTOMATIS JALAN SAAT KOMPUTER HIDUP
echo ======================================================================
echo.
echo Script ini akan mendaftarkan JALANKAN_SERVER_TOKO.bat ke Windows Startup.
echo Sehingga saat PC toko dinyalakan, server otomatis langsung berjalan!
echo.
pause

echo.
echo [*] Memasang shortcut ke folder Startup Windows...
powershell -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\KaleboxServer.lnk\"); $s.TargetPath = \"%~dp0JALANKAN_SERVER_TOKO.bat\"; $s.WorkingDirectory = \"%~dp0\"; $s.WindowStyle = 7; $s.Save()"

if %errorlevel% equ 0 (
    echo.
    echo ======================================================================
    echo           [V] AUTOSTART BERHASIL DIPASANG!
    echo ======================================================================
    echo Mulai sekarang, setiap kali PC Toko dinyalakan:
    echo 1. Server Kalebox Backend dan Frontend otomatis langsung jalan.
    echo 2. Browser otomatis terbuka ke Dashboard Kalebox.
    echo ======================================================================
) else (
    echo [X] Gagal memasang shortcut.
)
echo.
pause

