@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0kalebox.ps1" %*
