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

set "TARGET_BAT=%~dp0JALANKAN_SERVER_TOKO.bat"
set "TARGET_DIR=%~dp0"
set "STARTUP_LNK=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\KaleboxServer.lnk"
set "VBS_HELPER=%TEMP%\make_kalebox_shortcut.vbs"

(
echo Set oWS = WScript.CreateObject("WScript.Shell"^)
echo Set oLink = oWS.CreateShortcut("%STARTUP_LNK%"^)
echo oLink.TargetPath = "%TARGET_BAT%"
echo oLink.WorkingDirectory = "%TARGET_DIR%"
echo oLink.WindowStyle = 7
echo oLink.Description = "Server Kalebox Percetakan Toko"
echo oLink.Save
) > "%VBS_HELPER%"

cscript //nologo "%VBS_HELPER%"
del "%VBS_HELPER%" >nul 2>&1

if exist "%STARTUP_LNK%" (
    echo.
    echo ======================================================================
    echo           [V] AUTOSTART BERHASIL DIPASANG DENGAN SUKSES!
    echo ======================================================================
    echo Mulai sekarang, setiap kali PC Toko dinyalakan:
    echo 1. Server Kalebox Backend dan Frontend otomatis langsung jalan.
    echo 2. Browser otomatis terbuka ke Portal Kalebox.
    echo ======================================================================
) else (
    echo.
    echo [X] Gagal memasang shortcut ke folder startup.
)
echo.
pause
