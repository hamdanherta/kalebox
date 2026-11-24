@echo off
title KOSONGKAN SEMUA AKUN KALEBOX
color 0c

echo ======================================================================
echo           MENGOSONGKAN SEMUA AKUN USER DAN KARYAWAN KALEBOX
echo ======================================================================
echo.
echo PERINGATAN:
echo Tindakan ini akan mengosongkan semua akun user dan login di database.
echo Master data produk, kategori box, bahan, dan pengaturan toko TETAP AMAN.
echo.
echo Pastikan Laragon / MySQL sudah AKTIF sebelum melanjutkan!
echo.
pause

echo.
echo [*] Mereset tabel akun dan mengisi master data produk...
cd /d "%~dp0backend"
call php artisan migrate:fresh --seed --force

echo.
echo ======================================================================
echo                 [V] SEMUA AKUN BERHASIL DIKOSONGKAN!
echo ======================================================================
echo Database Anda sekarang sudah bersih dari akun demo/lama.
echo.
echo Silakan buka browser ke:
echo http://localhost:5173/internal/daftar
echo Atau dari HP / Laptop lain lewat WiFi:
echo http://192.168.1.50:5173/internal/daftar
echo untuk mendaftarkan akun Owner pertama Anda!
echo ======================================================================
echo.
pause

