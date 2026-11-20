# KALEBOX — Sistem Manajemen Percetakan & Packaging Custom Box

Aplikasi terintegrasi untuk bisnis percetakan dan packaging box custom, mencakup sistem manajemen internal toko (operasional, kasir, produksi, SDM, keuangan) serta website portal pemesanan klien.

---

## 📁 Struktur Proyek

```text
kalebox/
├── backend/               # REST API Laravel 11 + Database MySQL
├── frontend-internal/     # Portal Karyawan & Operasional Toko (Local Network/LAN)
├── frontend-client/       # Website Publik & Form Pemesanan Custom Box Klien
├── frontend/              # Frontend Master Terpadu
└── JALANKAN_SERVER_TOKO.bat # Script Otomatis Menjalankan Server Toko (1 Klik)
```

---

## 🚀 Panduan Menjalankan Sistem

### 1. Menjalankan Server Toko (1 Klik)
Cukup jalankan file:
```bash
JALANKAN_SERVER_TOKO.bat
```
Script akan otomatis mendeteksi IP lokal komputer, menjalankan Backend API (Port 8000), Frontend Internal (Port 5173), dan membuka peramban.

### 2. Menjalankan Manual Lewat Terminal

#### A. Backend (Laravel API)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

#### B. Frontend Internal (Karyawan Toko)
```bash
cd frontend-internal
npm install
npm run dev
```
Akses di browser: `http://localhost:5173` atau `http://<IP_KOMPUTER_TOKO>:5173`.

#### C. Frontend Klien (Website Pembeli)
```bash
cd frontend-client
npm install
npm run dev
```
Akses di browser: `http://localhost:5174`.

---

## 👥 Hak Akses Pengguna (Roles)
1. **Owner (Pemilik Toko):** Hak akses penuh mencakup seluruh modul, analitik, approval cuti/lembur, dan keuangan.
2. **Manager (Manajer Operasional):** Pengawasan operasional, tinjauan konten, penugasan tim, persetujuan lembur.
3. **Admin (Admin Kantor/Kasir):** Input pesanan manual, verifikasi pembayaran, SPK/Invoice, konten antri.
4. **Design (Desainer Grafis):** Mengerjakan mockup 3D, revisi desain klien, materi konten promosi.
5. **Staff (Staff Produksi):** Pengawasan cetak, finishing, pond cutting, penyerahan pesanan.
6. **Member (Pelanggan Terdaftar):** Akun pembeli di website dengan diskon repeat order dan tracking pesanan.
