@echo off
title HAPUS AUTOSTART SERVER KALEBOX
color 0e

echo ======================================================================
echo             HAPUS AUTOSTART SERVER KALEBOX DARI STARTUP
echo ======================================================================
echo.
pause

if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\KaleboxServer.lnk" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\KaleboxServer.lnk"
    echo.
    echo [V] Autostart berhasil dihapus. Server tidak akan jalan otomatis saat boot.
) else (
    echo.
    echo [*] Shortcut autostart tidak ditemukan di Startup Windows.
)
echo.
pause

