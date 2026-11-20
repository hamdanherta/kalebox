# PROMPT ANTIGRAVITY IDE — APLIKASI WEB KALEBOX (PERCETAKAN KEMASAN)

> Kamu adalah Senior Full-Stack Engineer + UI/UX Designer. Bangun aplikasi web lengkap **Kalebox** sesuai spesifikasi di bawah. Baca SELURUH dokumen ini sebelum menulis kode. Kerjakan bertahap (fase), uji setiap fase, dan jangan lanjut kalau masih ada error. Target akhir: **semua fitur berfungsi 100%, tanpa error, tanpa bug, tanpa halaman/tombol yang mati.**

---

## 0. ATURAN UTAMA (WAJIB)

1. Semua fitur harus benar-benar bekerja (frontend, backend, database). Dilarang membuat tombol/menu/halaman placeholder, data dummy yang tidak terhubung, atau fitur "coming soon".
2. Tidak boleh ada error di console browser, error di log Laravel, error 500, atau error validasi yang tidak tertangani. Semua error ditampilkan sebagai pesan yang ramah dan jelas dalam Bahasa Indonesia.
3. Seluruh antarmuka dan pesan memakai **Bahasa Indonesia**.
4. Responsif penuh: desktop, tablet, dan mobile (mulai lebar 320px). **Tidak boleh ada konten yang overflow/keluar dari card/layar**, tidak ada scroll horizontal pada halaman (tabel lebar boleh scroll horizontal di dalam container-nya sendiri, atau berubah jadi tampilan card di mobile).
5. UI modern, UX nyaman, rapi, konsisten di seluruh halaman.
6. Setiap tabel data wajib bisa **Tambah, Edit, Hapus, Cari, Sort, dan Pagination** oleh role yang bertanggung jawab (lihat Matriks Hak Akses).
7. Sebelum dinyatakan selesai, lakukan pengujian menyeluruh (lihat bagian 16) dan perbaiki semua temuan.

---

## 1. TECH STACK

| Bagian | Teknologi |
|---|---|
| Backend | Laravel (versi stabil terbaru), REST API, Laravel Sanctum (autentikasi token/SPA) |
| Frontend | React (Vite) + Tailwind CSS + React Router + Axios |
| Database | MySQL (migration + seeder lengkap) |
| Ikon | `lucide-react` (DILARANG memakai ikon `Sparkles`) |
| Gambar | Intervention Image (driver GD/Imagick) untuk konversi & kompres ke **WebP resolusi tinggi** |
| PDF | `barryvdh/laravel-dompdf` untuk laporan absensi, slip gaji, dll |
| Email | Laravel Mail (SMTP via `.env`) |
| Realtime | Polling ringan (mis. tiap 5–10 detik) atau Laravel Reverb/Pusher bila lebih stabil; pilih yang paling andal |
| Scheduler/Queue | Laravel Scheduler + Queue (driver `database`) |

Struktur: monorepo dengan folder `backend/` (Laravel) dan `frontend/` (React), atau struktur setara yang rapi. Sertakan `README.md` berisi cara instalasi dan menjalankan.

---

## 2. ASET PROYEK (LOGO, FONT, FAVICON)

- Folder logo resmi: `D:\HAMDANI\PROJECT_DONE\APLIKASI\WEB\rajasagroup\kalebox\logo`
  - Latar **putih** → pakai `kaleboxlogo.png`
  - Latar **pink (#DE0E86) atau navy (#004582)** → pakai `kaleboxwhite.png`
- **Favicon** → `kalebox\logo\kaleboxpink.png` (salin ke `frontend/public/` dan buat juga ukuran 32x32, 180x180 untuk apple-touch-icon bila perlu).
- Folder font: `D:\HAMDANI\PROJECT_DONE\APLIKASI\WEB\rajasagroup\kalebox\fonts`
  - Salin font ke `frontend/public/fonts` atau `src/assets/fonts`, daftarkan dengan `@font-face` (`font-display: swap`), dan petakan ke Tailwind (`fontFamily`).
  - Gunakan **font-weight sesuai fungsi**: judul/heading (bold/semibold), sub-judul (semibold/medium), isi teks (regular), label kecil/caption (medium), tombol (semibold). Bila file font tertentu tidak tersedia, pakai weight terdekat yang ada dan jangan memalsukan weight.
- Bila ada gambar welcome di Company Profile pada Halaman Home, **kompres dulu ke WebP resolusi tinggi** sebelum dipakai (lihat bagian 12).
- Jangan hardcode path Windows di kode aplikasi. Salin aset ke dalam proyek dan rujuk lewat path relatif.

---

## 3. DESAIN SISTEM (UI/UX) — ATURAN KETAT

### 3.1 Palet warna (HANYA 3 WARNA INI)
- `#FFFFFF` — putih, **warna dominan** (background halaman)
- `#DE0E86` — pink, warna sekunder/aksen
- `#004582` — navy, warna aksen

**Warna status** mengikuti aturan umum (di luar 3 warna di atas):
- Berhasil / selesai / disetujui → hijau
- Gagal / ditolak / terlambat / tidak masuk / kadaluarsa → merah
- Peringatan / menunggu / mendekati deadline → kuning
- Informasi netral → boleh memakai navy

Aturan teks:
- Semua teks di atas background **putih** wajib `#004582`.
- Di atas background pink/navy, sesuaikan warna teks (umumnya putih) agar kontras dan mudah dibaca. Pastikan rasio kontras memadai.
- **Card, navbar, dan footer tetap berwarna putih.**
- Definisikan semua warna sebagai design token di `tailwind.config.js` (mis. `brand-pink`, `brand-navy`) dan jangan menulis warna lain.

### 3.2 Komponen
- **Card seragam di seluruh website**: `rounded` 30–40px (mis. `rounded-[32px]`), **TANPA border sama sekali** (card, button, input, select, tabel, modal, dropdown, dll — tidak ada `border`, `ring` sebagai border, maupun `outline` yang tampak seperti border).
- Setiap card wajib punya **shadow tipis** di belakangnya (terutama card putih di atas background putih) agar tetap terlihat terpisah.
- Pemisah antar elemen (mis. baris tabel) memakai spasi, perbedaan background halus, atau shadow — bukan border.
- Input/select/textarea/button: sudut membulat konsisten, tanpa border, dibedakan dengan background lembut + shadow tipis; state fokus memakai shadow/warna aksen, bukan border.
- **Padding**: atur padding kiri-kanan dan atas-bawah di semua card, modal, tombol, input, badge, tabel, navbar, dan footer agar tidak ada konten yang mepet ke tepi. Gunakan skala spacing konsisten.
- Tombol: varian primer (pink), sekunder (navy), dan lembut (putih + shadow). Ukuran minimal area sentuh 44px di mobile.

### 3.3 Larangan
- **DILARANG** memakai ikon `Sparkles` (dan sejenisnya seperti `Wand`/`Stars` yang bermakna sama) dan **semua emoji** (di UI, teks, seed data, toast, email, PDF).
- Ikon lain (lucide-react) boleh.

### 3.4 Kerapian & responsif
- Rapikan semuanya: alignment, jarak, tipografi, ukuran gambar (gunakan `object-cover`/`object-contain` dan aspect-ratio), truncate/line-clamp untuk teks panjang, `break-words` untuk teks tanpa spasi.
- Pastikan **tidak ada konten keluar dari card** di tampilan desktop maupun mobile.
- Navigasi mobile: hamburger menu/drawer untuk publik; sidebar yang bisa dilipat (drawer) untuk dasbor internal.
- Sediakan state **loading (skeleton/spinner)**, **empty state**, dan **error state** yang rapi di semua daftar/halaman.
- Semua aksi destruktif (hapus) memakai dialog konfirmasi (modal, tanpa `window.confirm`). Semua aksi memunculkan toast sukses/gagal.
- Aksesibilitas dasar: label form, `alt` gambar, fokus keyboard terlihat (tanpa border), kontras cukup.

---

## 4. ARSITEKTUR HALAMAN & NAVIGASI

### 4.1 Halaman Publik
1. **Home** — berisi:
   - Hero (judul, deskripsi, tombol ke Katalog)
   - **Company Profile** (tentang Kalebox, visi/misi, keunggulan, gambar welcome WebP hasil kompres)
   - Kategori/produk unggulan, cara pemesanan (alur singkat), testimoni (opsional dikelola dari dasbor), kontak/peta lokasi, footer
   - **JANGAN ada tombol di Home yang mengarah ke Halaman Internal.**
2. **Katalog (Daftar Produk)** — menampilkan **semua produk**, dengan **pencarian (search)**, **sort** (terbaru, harga terendah/tertinggi, nama A–Z/Z–A), **filter kategori produk** (dan filter bahan bila relevan), pagination/infinite scroll.
3. **Detail Produk** — nama produk, **galeri (carousel)** (cover + maksimal 3 galeri), kategori, jenis bahan, deskripsi, minimal order, harga satuan, pilihan finishing/cutting yang tersedia untuk bahan tersebut, tombol **Pesan Sekarang** (membuka Formulir Pesanan), produk terkait.
4. **Formulir Pesanan Online** (lihat bagian 8.2) dan **Halaman Pembayaran QRIS**.
5. **Halaman Status Pesanan Klien** (`/pesanan/{token}`) dan **Halaman Review/Revisi Desain** (lihat bagian 8.3).
6. **Daftar / Login Member**, serta **Profil Member** (muncul bila sudah login).
7. Halaman statis: Tentang Kami (bila terpisah), Kontak, 404, dan halaman error yang rapi.

### 4.2 Halaman Internal (Karyawan)
- **Login Karyawan** dan **Pendaftaran Karyawan** (Role 1–5) — **halaman terpisah** dari Daftar/Login Member, dengan URL internal khusus (mis. `/internal/login`, `/internal/daftar`). Tidak ada link ke halaman ini dari halaman publik.
- Dasbor per role, semua modul manajemen (bagian 7–10), profil karyawan, ganti password.

### 4.3 Aturan tombol & akses (penting)
- **Tombol "Masuk Karyawan" TIDAK ditampilkan** di mana pun pada situs publik.
- Tombol **Dasbor** hanya muncul di navbar **jika karyawan (role 1–5) sudah login**.
- Pengunjung/pelanggan biasa yang belum login **tidak melihat tombol menuju halaman internal**. Untuk pelanggan, yang tersedia hanya akses **Daftar/Login Member** (khusus Member, bukan karyawan) sesuai Halaman Publik. Pelanggan umum tetap bisa memesan **tanpa login**.
- Setelah login sebagai Member, navbar menampilkan menu Profil Member + Keluar.
- Route guard di frontend DAN middleware/policy di backend (jangan hanya menyembunyikan menu).

---

## 5. ROLE & HAK AKSES

| No | Role | Batas |
|---|---|---|
| 1 | Owner | maksimal **1** orang |
| 2 | Manager | maksimal **1** orang |
| 3 | Admin & Content Creator | boleh lebih dari 1 |
| 4 | Design (Graphic Designer) | boleh lebih dari 1 |
| 5 | Staff | boleh lebih dari 1 |
| 6 | Member | boleh lebih dari 1 (login/daftar terpisah) |

Aturan:
- Backend wajib memvalidasi batas Owner (1) dan Manager (1) saat pendaftaran, edit role, maupun seeding. Pesan error jelas bila batas tercapai.
- **Pendaftaran karyawan (Role 1–5)**: halaman daftar internal memakai **kode undangan/registrasi** yang dibuat Owner/Manager (terikat ke posisi/role tertentu, sekali pakai/kedaluwarsa). Akun Owner pertama dibuat lewat seeder/first-run setup. Akun baru dapat diaktifkan/nonaktifkan oleh Owner/Manager.
- Semua password di-hash (bcrypt/argon), validasi kekuatan password, fitur **lupa/reset password** (email), dan **ganti password**.
- Rate limiting pada login, proteksi CSRF/XSS/SQL injection, validasi input server-side, otorisasi tingkat record, dan audit log.

### Matriks hak akses modul
Notasi role: **1 Owner, 2 Manager, 3 Admin, 4 Design, 5 Staff**.

| Modul | Role yang mengelola (CRUD penuh) | Catatan |
|---|---|---|
| Data Pesanan | 3, 2, 1 | Design & Staff: lihat pesanan yang ditugaskan + ubah progres sesuai tugasnya |
| Data Kategori Produk | 2, 1 | |
| Data Produk | 3, 2, 1 | |
| Data Finishing | 3, 2, 1 | |
| Data Cutting | 3, 2, 1 | |
| Data Bahan | 3, 2, 1 | |
| Data Klien | 3, 2, 1 | |
| Data Vendor | 2, 1 | |
| Data Member | 3, 2, 1 | |
| Data QRIS | 2, 1 | (tambahan, lihat bagian 8.2) |
| Data Karyawan | 2, 1 | |
| Data Waktu Kerja | 2, 1 | |
| Data Absensi | 2, 1 (lihat semua) | Karyawan melakukan absen sendiri |
| Data Pengajuan Cuti | 2, 1 (kelola/setujui) | Karyawan mengajukan sendiri |
| Data Lembur | 2, 1 | |
| Data Penggajian | 2, 1 | |
| Data Posisi Karyawan | 2, 1 | |
| Data Divisi Karyawan | 2, 1 | |
| Data Status Karyawan | 2, 1 | |
| Data Bonus | 2, 1 | (tambahan) |
| Data Konten | 3, 2, 1 | Design/Staff: lihat & ajukan hasil sesuai penugasan |
| Data Platform Promosi | 3, 2, 1 | |

Role 3 (Admin), 2 (Manager), 1 (Owner) juga dapat **memantau tahapan** pesanan dan konten.

---

## 6. LAYOUT DASBOR INTERNAL

- Sidebar (drawer di mobile) yang menu-nya menyesuaikan role, topbar dengan nama/role pengguna, notifikasi (lonceng), dan menu profil.
- Dasbor per role:
  - **Owner/Manager**: ringkasan pesanan per status, pesanan prioritas, konten per status, kehadiran hari ini, pendapatan, pesanan mendekati deadline, grafik ringkas.
  - **Admin**: pesanan masuk baru, revisi dari klien, desain yang diajukan, konten yang diajukan, siap cetak, daftar tugas hari ini.
  - **Design**: tugas desain milik sendiri, **label Prioritas Tinggi**, **notifikasi deadline ≤ 12 jam**, revisi dari klien, konten yang ditugaskan.
  - **Staff**: tugas produksi, notifikasi barang siap diambil beserta informasinya, absensi.
- Semua dasbor menampilkan tombol **Absen** (masuk/keluar) untuk karyawan.

---

## 7. MANAJEMEN PESANAN & PRODUK

### 7.1 Data Pesanan (Role 3, 2, 1)
Field:
- Nama Pemesan *(setiap input otomatis masuk/ter-sinkron ke Data Klien)*
- No HP *(otomatis ke Data Klien)*
- Email
- Pelanggan Baru (Ya / Tidak) *(otomatis menentukan Jenis Klien di Data Klien)*
- Kategori Produk *(select dari Data Kategori Produk)*
- Jenis File Desain (File Lama / File Baru)
- Jumlah Pesanan
- Status Pembayaran (DP / Belum Dibayar / Lunas)
- Pilih Pesanan *(select dari Data Produk/Barang)*
- Jenis Finishing *(select dari Data Finishing)*
- Jenis Cutting *(select dari Data Cutting)*
- Jenis Penyerahan (Ambil Sendiri / Dikirim)
- Deadline
- Tanggal Pengambilan/Pengiriman
- Catatan
- Desain *(select dari karyawan dengan role Design)*
- Produksi *(select dari karyawan dengan role Staff)*

Tambahan sistem (otomatis): nomor pesanan unik, total harga (harga satuan × jumlah, ditambah/dikurangi sesuai bahan & potongan diskon Member), nominal terbayar, sisa pembayaran, token link klien, riwayat status (timeline), lampiran file desain (upload), serta **penanda Prioritas Tinggi** (toggle).

Fitur tabel: cari, filter (status, pembayaran, desainer, prioritas, rentang tanggal, deadline), sort, pagination, export, aksi cepat ubah status, cetak/unduh invoice & surat pesanan (PDF).

### 7.2 Data Kategori Produk (Role 2, 1)
No Kategori Produk (auto), Nama Kategori Produk. CRUD penuh. Cegah hapus bila masih dipakai (beri pesan jelas) atau lakukan soft-delete dengan aman.

### 7.3 Data Produk (Role 3, 2, 1)
Nama Produk, Jenis Produk (select Data Kategori Produk), Jenis Bahan (select Data Bahan), **Cover (maks 1, kompres WebP resolusi tinggi)**, **Galeri (maks 3, kompres WebP resolusi tinggi)**, Deskripsi, Minimal Order, Harga Satuan. Validasi: tipe file gambar, ukuran maksimal sebelum kompres, jumlah galeri maksimal 3, minimal order ≥ 1. Tampilkan preview gambar, hapus/ganti gambar, dan status aktif/nonaktif (tambahan) agar produk bisa disembunyikan dari katalog.

### 7.4 Data Finishing (Role 3, 2, 1)
No Finishing (auto), Nama Finishing.

### 7.5 Data Cutting (Role 3, 2, 1)
No Cutting (auto), Nama Cutting.

### 7.6 Data Bahan (Role 3, 2, 1)
No Bahan (auto), Nama Bahan, Jenis Finishing (select/multi-select dari Data Finishing), Jenis Cutting (select/multi-select dari Data Cutting), Deskripsi Bahan, Kategori Produk (select dari Data Kategori Produk), Harga.

### 7.7 Data Klien (Role 3, 2, 1)
Nama Klien, Jenis Klien (Baru/Lama — **bisa diatur manual** setelah klien ter-input), No HP, Email, Member (Ya/Tidak — **bisa diatur manual** setelah klien ter-input).

**Aturan otomatis (WAJIB):** Data Klien dibuat/diperbarui dari Data Pesanan.
- Jika **nama, no HP, dan email sama** dengan klien yang sudah ada → **jangan buat klien baru** (gunakan klien yang ada, hubungkan ke pesanan).
- Jika **nama berbeda atau no HP berbeda** → buat **klien baru**.
- Normalisasi data sebelum membandingkan (trim, lowercase, no HP diseragamkan ke format 62xxxx).
- Tampilkan riwayat pesanan per klien.

### 7.8 Data Vendor (Role 2, 1) — Form & Tabel
Id Vendor (auto), Nama Vendor, Alamat, No HP, Email, Jenis Cetakan (input bebas).

### 7.9 Data Member (Role 3, 2, 1)
Id Member (auto), No Member (auto, unik, format mis. `KLB-000001`), Nama Member, Alamat, No HP, Email, Potongan Diskon (persen). Member juga dapat mendaftar sendiri lewat halaman publik; data otomatis masuk ke tabel ini. Diskon member otomatis diterapkan pada pesanan online saat Member login.

---

## 8. FORMULIR PESANAN ONLINE, PEMBAYARAN, DAN ALUR PESANAN

### 8.1 Prinsip
- Pelanggan **tidak perlu login** untuk memesan (Member yang login mendapat data terisi otomatis + potongan diskon).
- Produk dipilih dari Halaman Detail Produk (tombol Pesan Sekarang) sehingga produk/kategori/bahan sudah terisi.

### 8.2 Formulir (wajib diisi pelanggan dari website)
- Nama Pemesan
- No HP
- Email
- Jumlah Pesanan *(validasi ≥ minimal order produk)*
- Metode Pembayaran: **DP / Belum Dibayar / Lunas**
  - **DP** → langsung tampil **QRIS** + **timer hitung mundur 5 menit** + **total harga DP = 50% dari total harga**.
  - **Lunas** → langsung tampil **QRIS** + **timer 5 menit** + **total harga penuh**.
  - **Belum Dibayar** → pesanan masuk tanpa QRIS.
  - **Gambar QR QRIS diambil dari Data QRIS** (tabel baru: nama/atas nama, gambar QR (WebP), status aktif; hanya satu yang aktif). Role 2 & 1 mengelola data ini.
- Jenis Finishing *(select dari Data Finishing, difilter sesuai bahan produk)*
- Jenis Cutting *(select dari Data Cutting, difilter sesuai bahan produk)*
- Jenis Penyerahan (Ambil Sendiri / Dikirim) — bila Dikirim, tampilkan field alamat pengiriman
- Tanggal Pengambilan/Pengiriman — **estimasi minimal 3 hari dari hari ini** (validasi di frontend dan backend; tanggal sebelum itu tidak bisa dipilih)
- Catatan
- Tambahan: upload file desain (opsional, untuk "File Lama"), pilihan Jenis File Desain (File Lama/File Baru)

Perilaku pembayaran QRIS:
- Tampilkan ringkasan harga (subtotal, diskon member, total, nominal yang harus dibayar) dan timer 5 menit yang jelas.
- Saat timer habis: QRIS ditutup, tampilkan pesan kadaluarsa dan tombol **Buat Ulang Pembayaran** atau **Lanjut Tanpa Bayar** (jadi Belum Dibayar). Validasi waktu juga dilakukan di **backend** (jangan hanya mengandalkan timer frontend).
- Tambahan: pelanggan bisa menekan **"Saya Sudah Bayar"** dan mengunggah bukti pembayaran (opsional). Admin memverifikasi pembayaran dari dasbor; status pembayaran berubah menjadi DP/Lunas setelah diverifikasi.
- Setelah pesanan dikirim: tampilkan halaman sukses berisi **nomor pesanan + link pantau pesanan**, dan kirim link tersebut ke email pelanggan.

### 8.3 Link Pesanan Klien (tanpa login)
- Setiap pesanan yang masuk otomatis punya **link unik** (`/pesanan/{token}`, token acak panjang yang sulit ditebak) yang dapat dibuka klien **tanpa login** untuk:
  - Memantau **status pesanan** (timeline tahapan) dan informasi pesanan.
  - Melihat **hasil desain** dan melakukan **review**: tombol **"Oke"** atau **"Belum Pas"**.
    - **Belum Pas** → muncul form **catatan revisi** (+ opsional upload gambar referensi) → **Kirim Revisian**.
    - **Oke** → desain disetujui.
  - Setelah desain direvisi dan diajukan ulang, halaman review menampilkan versi terbaru; klien dapat membukanya lagi dan memilih Oke/Belum Pas. Tampilkan riwayat versi/revisi.
- Link review dibagikan Admin ke klien lewat **WhatsApp** (tombol "Bagikan via WhatsApp" yang membuka `wa.me` dengan pesan template berisi link).
- Link tidak boleh membocorkan data sensitif pesanan lain; batasi rate dan validasi token.

### 8.4 Status Pesanan (pakai nama persis ini)
1. Pesanan Telah Masuk
2. Pesanan Diterima
3. Pesanan Diproses
4. Pesanan Sedang Revisi
5. Pesanan Sedang Dicetak
6. Pesanan Siap Diambil/Dikirim

### 8.5 Alur Pesanan

**A. Dari Website**
1. Klien mengisi formulir di website → pesanan masuk ke **Daftar Pesanan** (status: *Pesanan Telah Masuk*).
2. **Admin** memproses (status: *Pesanan Diterima*) dan **menentukan siapa yang Desain dan siapa Produksi**.
3. **Desain** mengerjakan (*Pesanan Diproses*), lalu **mengajukan desain ke Admin**.
4. **Admin** membagikan **link review** ke klien lewat WhatsApp klien.
5. **Klien** membuka halaman Revisi: melihat hasil desain + informasi pesanan → menekan **Oke** atau **Belum Pas**.
6. Jika **Belum Pas**: klien mengisi catatan → **Kirim Revisian** → muncul di **dasbor Admin** (*Pesanan Sedang Revisi*).
7. **Admin meneruskan** ke Desain yang bertugas → muncul di **dasbor Desain tersebut**.
8. **Desain memproses revisi** lalu **mengajukan langsung**; hasil muncul di link halaman review (menandai desain sudah direvisi).
9. Klien membuka kembali. Jika **Oke** → langsung muncul di **dasbor Desain tersebut**.
10. **Desain mengajukan ke Admin** bahwa revisi sudah OK → muncul di **dasbor Admin**.
11. **Admin naik cetak** (*Pesanan Sedang Dicetak*): desain dikirim ke **Vendor lewat Email** (alamat dari Data Vendor; lampirkan file desain + detail spesifikasi pesanan).
12. Setelah selesai cetak, **Admin memberi notifikasi ke Produksi (Staff)** bahwa barang siap diambil, beserta data/informasi pesanan (*Pesanan Siap Diambil/Dikirim*).
13. Klien dapat melihat status terakhir di link pantau pesanan.

**B. Dari Tambah Pesanan oleh Admin**
- Admin menambah pesanan di Daftar Pesanan → Admin memproses & menentukan Desain dan Produksi → **langkah selanjutnya sama persis** dengan alur A (mulai langkah 3).

### 8.6 Catatan Pesanan
1. Setiap pesanan bisa ditandai **Prioritas Tinggi** → label muncul di **dasbor Desain yang ditugaskan**.
2. Setiap pesanan yang **deadline-nya tersisa ≤ 12 jam** → **notifikasi muncul di dasbor Desain yang ditugaskan** (dihitung via scheduler/cek berkala; jangan duplikat notifikasi).
3. **Admin, Manager, dan Owner** dapat memantau tahapan pesanan sudah sampai mana (tampilan Kanban per status + tabel + timeline detail).
4. Klien tetap **tanpa login**.
5. Setiap perubahan status tercatat di riwayat (siapa, kapan, catatan) dan memicu notifikasi ke pihak terkait (in-app, opsional email).

---

## 9. MANAJEMEN KARYAWAN

### 9.1 Data Karyawan (Role 2, 1) — Form & Tabel
Id Karyawan (auto), **No Induk Karyawan** (otomatis hanya terbit setelah lewat **1 tahun** dari Tanggal Masuk — isi otomatis lewat scheduler harian; sebelum itu tampil "-"), Nama Karyawan, NIK (validasi 16 digit), Alamat Karyawan, Domisili, Posisi Karyawan (select Data Posisi Karyawan), Status Karyawan (select Data Status Karyawan), Tanggal Masuk, Jam Mulai Kerja, Jam Akhir Kerja, Gaji Per Hari. Tautkan karyawan dengan akun login. Tambahan: foto profil, kontak darurat (opsional).

### 9.2 Data Waktu Kerja (Role 2, 1) — Form & Tabel
Jam Mulai Kerja, Jam Akhir Kerja, Hari Kerja (multi-pilih Senin–Minggu). Dipakai sebagai default dan acuan perhitungan absensi.

### 9.3 Data Absensi (Role 2, 1) — Tabel
Kolom: Nama Karyawan, Id Karyawan, Jam Absen, Jam Keluar, Status.

**Status absensi:** *Menunggu* (sampai batas jam masuk, yaitu **3 jam** dari jam mulai kerja), *Masuk* (sudah absen), *Tidak Masuk* (lewat batas jam masuk tanpa absen), *Izin*, *Sakit*, *Lembur*.

Aturan:
- Data absensi **muncul sendiri secara realtime** di tabel saat karyawan melakukan absen.
- **Setiap hari data absensi di-reset** (tampilan hari baru mulai kosong/menunggu), namun **data lama tetap tersimpan** dan dapat dilihat per tanggal.
- **Setiap hari tersedia laporan PDF** absensi yang dapat **diunduh** (per hari, dan rentang tanggal/bulanan sebagai tambahan). Buat PDF otomatis di akhir hari via scheduler dan juga bisa dibuat manual.
- Absen karyawan memakai **foto (kamera)** dan **validasi lokasi: hanya bisa absen dalam radius 10 meter** dari titik koordinat kantor **(-1.6169982045745503, 103.57810290034548)**. Hitung jarak dengan rumus Haversine di **backend** (bukan hanya frontend). Simpan foto, koordinat, dan jarak; tampilkan pesan jelas bila di luar radius atau izin lokasi/kamera ditolak. Titik koordinat & radius disimpan di pengaturan agar bisa diubah Owner/Manager.
- Karyawan melihat riwayat absensinya sendiri.

Aturan bisnis absensi:
1. Absen masuk **lewat dari jam mulai kerja** → **terlambat**.
2. Absen keluar **sebelum jam akhir kerja** → **dianggap tidak masuk hari itu**, **kecuali** waktu lembur sedang aktif.
3. Tidak absen **lewat 3 jam** dari jam mulai kerja → **tidak masuk** hari itu, **kecuali** status izin sedang aktif.
4. Absensi hanya dihitung pada Hari Kerja sesuai Data Waktu Kerja.
5. Status Izin/Sakit/Lembur terisi otomatis dari pengajuan cuti/lembur yang aktif.

### 9.4 Data Pengajuan Cuti (Role 2, 1) — Form
Tanggal Cuti (bisa rentang), Jenis Cuti (**Sakit / Izin**) — jika **Sakit**, tampil upload **Lampiran PDF/JPEG** (validasi tipe & ukuran), Pesan. Karyawan mengajukan, Manager/Owner **menyetujui/menolak**; cuti yang disetujui memengaruhi status absensi & penggajian. Notifikasi ke pengaju.

### 9.5 Data Lembur (Role 2, 1) — Form & Tabel
Tanggal Lembur, Jam Mulai Lembur, Upah Lembur / Jam, Jam Berakhir Lembur, Pilih Karyawan (select Data Karyawan). Validasi jam selesai > jam mulai. Durasi & total upah lembur dihitung otomatis.

### 9.6 Data Penggajian (Role 2, 1) — Tabel
Kolom: Nama Karyawan, Id Karyawan, Total Izin, Total Sakit, Total Tidak Masuk, Total Terlambat, Total Lembur, Total Jam Lembur, Bonus (select dari **Data Bonus**), Total Gaji Bulan Ini.

Perhitungan (jelaskan rumusnya di UI dan tampilkan rincian):
- Gaji dasar bulan ini = Gaji Per Hari × jumlah hari **masuk** pada bulan tersebut (hari tidak masuk tidak dibayar; izin/sakit mengikuti kebijakan yang dapat diatur di pengaturan, default tidak dibayar kecuali ditetapkan lain).
- Keterlambatan memengaruhi gaji sesuai aturan potongan yang dapat diatur (default: potongan per kejadian terlambat, nominal bisa diubah).
- Ditambah **upah lembur** = total jam lembur × Upah Lembur/Jam.
- Ditambah **Bonus** terpilih.
- Total Gaji Bulan Ini = gaji dasar − potongan + lembur + bonus.
- Periode bulanan dengan tombol **Hitung/Hitung Ulang**, status (Draft/Final/Dibayar), dan **slip gaji PDF** per karyawan serta rekap PDF/Excel.

### 9.7 Data Posisi Karyawan (Role 2, 1) — Form & Tabel
Nama Posisi Kerja, Divisi (select Data Divisi Karyawan).

### 9.8 Data Divisi Karyawan (Role 2, 1) — Form & Tabel
Nama Divisi.

### 9.9 Data Status Karyawan (Role 2, 1) — Form & Tabel
Nama Status Kerja, Berapa Lama (sampai tanggal berapa / **Selamanya**). Karyawan dengan status berbatas waktu otomatis ditandai kedaluwarsa setelah tanggalnya lewat.

### 9.10 Data Bonus (tambahan, Role 2, 1)
Nama Bonus, Nominal, Keterangan. Dipakai di Data Penggajian.

---

## 10. MANAJEMEN KONTEN

### 10.1 Data Konten (Role 3, 2, 1)
Id Konten (auto), Nama Konten, Brief, Caption, Ide (select Data Karyawan), Penanggung Jawab (select Data Karyawan), Desain (select karyawan role **Design**), Upload (select karyawan role **Admin**), Produksi (select Data Karyawan), Jenis Konten (**carousel, feed, stories, flyer, reels**), Platform (select Data Platform Promosi), Deadline, Jadwal Tayang, Hasil (**paste link**). Tambahan: toggle **Prioritas Tinggi**, lampiran referensi, riwayat status, komentar/catatan revisi.

### 10.2 Data Platform Promosi (Role 3, 2, 1) — Form & Tabel
Nama Platform Promosi, **Logo (maks 1, rasio 1:1, tampil `contain`, maks 500 KB, format png/svg)**, Link Akun. Validasi rasio 1:1, ukuran, dan tipe file di frontend dan backend.

### 10.3 Status Konten (pakai nama persis ini)
Ide → Konten Antri → Konten Di Proses → Konten Sedang Revisi → Konten Ok → Konten Siap Tayang → Konten Sudah Tayang.

### 10.4 Alur Konten
1. **Admin** menambah konten baru dan memilih siapa yang Desain/Produksi/dll.
2. Admin **mengajukan ke Manager**.
3. Manager: **Revisi** → kembali ke Admin; **Oke** → kembali ke Admin juga.
4. Konten diproses (*Konten Di Proses*).
5. **Penanggung jawab** mengajukan hasil konten ke **Admin** → muncul di dasbor Admin.
6. Admin dapat **Revisi** (*Konten Sedang Revisi*) atau **Oke** (*Konten Ok*).
7. Jika Oke → *Konten Siap Tayang*.
8. Setelah Admin upload → *Konten Sudah Tayang*.

Catatan konten:
1. Setiap konten bisa ditandai **Prioritas Tinggi** → label muncul di dasbor **Desain yang ditugaskan**.
2. Konten dengan **deadline tersisa ≤ 12 jam** → notifikasi muncul di dasbor **Desain yang ditugaskan**.
3. **Admin, Manager, Owner** dapat memantau tahapan konten (Kanban + tabel + kalender jadwal tayang sebagai tambahan).

---

## 11. FITUR TAMBAHAN YANG DIREKOMENDASIKAN (IMPLEMENTASIKAN)

1. **Notifikasi in-app** (lonceng, badge, tandai dibaca) untuk semua event penting (penugasan, revisi, deadline ≤ 12 jam, pembayaran, cuti, barang siap).
2. **Audit log** (siapa mengubah apa dan kapan) untuk pesanan, harga, gaji, dan data sensitif; hanya Owner/Manager yang dapat melihat.
3. **Pengaturan sistem** (Owner/Manager): profil perusahaan (teks Company Profile, kontak, jam operasional, koordinat & radius absensi, nominal potongan terlambat, kebijakan gaji izin/sakit, SMTP test, nomor WhatsApp).
4. **Kelola Keuangan** (Owner/Manager): pemasukan otomatis dari pembayaran pesanan, pengeluaran (vendor, operasional, gaji) dengan kategori, ringkasan bulanan, laporan PDF/Excel.
5. **Kelola Karir** (opsional, Admin/Manager/Owner): lowongan kerja yang tampil di halaman publik Karir, form lamaran + upload CV; tanpa tombol ke halaman internal.
6. **Kelola Testimoni/FAQ** untuk Home (Admin).
7. **Export** data tabel ke Excel/CSV/PDF untuk tabel utama.
8. **Pencarian global** di dasbor internal.
9. **Backup** database sederhana lewat perintah artisan terjadwal.
10. **Invoice & surat pesanan PDF**, serta cetak label/spesifikasi produksi untuk Staff.
11. **Dark mode TIDAK diperlukan** (jaga konsistensi 3 warna).
12. **SEO dasar** untuk halaman publik (title, meta description, Open Graph), sitemap sederhana, lazy loading gambar.

---

## 12. PENGELOLAAN GAMBAR & FILE

- Semua gambar upload (cover produk, galeri, gambar welcome Company Profile, QRIS, bukti bayar, foto absensi, dll) **dikonversi ke WebP resolusi tinggi** di backend (kualitas tinggi ±85–90, batasi sisi terpanjang secara wajar, mis. 2000–2560 px, tanpa merusak rasio). Simpan hanya versi WebP (hapus file asli sementara).
- **Cover maks 1, galeri maks 3** per produk. Hapus file lama dari storage saat gambar diganti/dihapus.
- Logo Platform Promosi: png/svg, rasio 1:1, maks 500 KB (tidak dikonversi ke WebP agar transparansi/vektor tetap terjaga).
- Lampiran cuti sakit: PDF/JPEG, batasi ukuran (mis. 2–5 MB).
- Jalankan `php artisan storage:link`. Gunakan disk `public` untuk gambar publik dan disk privat untuk lampiran sensitif (akses lewat endpoint ter-otorisasi).
- Frontend: `loading="lazy"`, `srcset` bila perlu, placeholder/skeleton, fallback bila gambar gagal dimuat.

---

## 13. DATABASE (MySQL)

- Buat **migration lengkap** dengan relasi (foreign key, index, unique), **soft delete** di tempat yang sesuai, timestamp, dan **seeder**:
  - Akun Owner awal (kredensial ditampilkan di README, wajib ganti password), data contoh Kategori Produk, Finishing, Cutting, Bahan, Produk (dengan gambar contoh WebP **tanpa emoji**), Platform Promosi, Posisi/Divisi/Status Karyawan, Waktu Kerja, QRIS contoh, Pengaturan awal.
- Tabel inti (minimal): `users`, `roles`, `registration_codes`, `members`, `clients`, `orders`, `order_items/detail`, `order_status_histories`, `order_designs` (versi desain), `order_revisions`, `payments`, `qris_settings`, `product_categories`, `products`, `product_images`, `finishings`, `cuttings`, `materials`, `material_finishing`, `material_cutting`, `vendors`, `employees`, `work_schedules`, `attendances`, `leave_requests`, `overtimes`, `payrolls`, `bonuses`, `positions`, `divisions`, `employee_statuses`, `contents`, `content_status_histories`, `promotion_platforms`, `notifications`, `audit_logs`, `settings`, serta tabel keuangan/karir bila fitur tambahan diaktifkan.
- Pastikan integritas: tidak bisa menghapus data yang masih dipakai tanpa penanganan yang aman (pesan jelas), dan semua relasi `select` mengambil data dari tabel master yang sesuai.

---

## 14. KEAMANAN & KUALITAS KODE

- Form Request validation untuk semua endpoint; Policy/Gate per role; middleware role; pembatasan akses file privat.
- Sanitasi input, proteksi mass-assignment, CORS yang benar, rate limiting, header keamanan dasar.
- Konsistensi respons API (format JSON seragam: `success`, `message`, `data`, `errors`).
- Kode rapi dan terstruktur: Controller tipis, Service/Action untuk logika bisnis (alur pesanan, absensi, gaji), Resource untuk transformasi, komponen React reusable (Button, Card, Input, Select, Modal, Table, Badge, Toast, Pagination, EmptyState, Skeleton, ConfirmDialog, ImageUploader, Carousel).
- Gunakan state management/data-fetching yang rapi (mis. React Query/TanStack Query) agar UI tidak flicker dan cache konsisten.
- Komentar singkat pada logika bisnis yang kompleks.

---

## 15. SCRIPT MENJALANKAN APLIKASI (`./kalebox`)

Buat script di **root proyek** sehingga saya **tinggal menjalankan `./kalebox`** untuk memulai semuanya. Sediakan:
- `kalebox` (bash, untuk Git Bash/WSL/Linux/macOS, executable),
- `kalebox.ps1` (PowerShell) dan `kalebox.cmd` (Windows CMD).

Script harus otomatis dan idempoten:
1. Cek prasyarat (PHP, Composer, Node, npm, MySQL) dan beri pesan jelas bila ada yang kurang.
2. Salin `.env.example` → `.env` bila belum ada; isi konfigurasi DB default; `php artisan key:generate` bila perlu.
3. Pastikan database ada (buat bila belum), jalankan `composer install` dan `npm install` bila `vendor`/`node_modules` belum ada atau berubah.
4. Jalankan `php artisan migrate --seed` (seed hanya pada instalasi pertama), `php artisan storage:link`.
5. Jalankan **semua proses sekaligus**: backend (`php artisan serve`), **queue worker**, **scheduler** (`php artisan schedule:work`), dan **frontend** (`npm run dev`), dengan output berlabel dan **berhenti bersih bersama** saat Ctrl+C.
6. Tampilkan URL akses (frontend, backend/API) dan kredensial Owner awal di terminal.
7. Dukung argumen opsional: `./kalebox setup` (instalasi saja), `./kalebox build` (build produksi), `./kalebox fresh` (reset DB + seed, dengan konfirmasi).

---

## 16. PENGUJIAN WAJIB SEBELUM SELESAI

Uji dan perbaiki hingga bersih:
1. **Autentikasi**: daftar/login/logout Member; daftar (kode undangan)/login/logout karyawan; reset password; batas Owner=1 dan Manager=1; route guard per role (akses tanpa izin ditolak di frontend dan backend).
2. **CRUD** semua tabel di bagian 7, 9, 10 oleh role yang berwenang, serta penolakan oleh role yang tidak berwenang. Uji validasi, pencarian, sort, pagination.
3. **Klien otomatis**: pesanan dengan data sama tidak menambah klien; nama/no HP berbeda membuat klien baru.
4. **Pesanan online**: validasi min order, estimasi minimal 3 hari, DP 50%, Lunas, Belum Dibayar, QRIS dari Data QRIS, timer 5 menit (frontend + backend), kadaluarsa & buat ulang, bukti bayar, diskon Member, link pantau pesanan terkirim.
5. **Alur pesanan penuh** (A dan B): penugasan Desain/Produksi → pengajuan desain → link review WhatsApp → Oke/Belum Pas → revisi → Oke → naik cetak → email ke vendor → notifikasi Produksi → siap diambil/dikirim. Pastikan setiap perubahan status muncul di dasbor yang tepat.
6. **Prioritas Tinggi** dan **notifikasi deadline ≤ 12 jam** muncul di dasbor Desain yang ditugaskan (pesanan dan konten).
7. **Alur konten penuh** sampai *Konten Sudah Tayang*.
8. **Absensi**: foto + radius 10 m (uji di dalam & luar radius), terlambat, keluar lebih awal, batas 3 jam, izin aktif, lembur aktif, realtime muncul di tabel, reset harian dengan data tetap tersimpan, PDF harian terunduh.
9. **Cuti/Lembur/Penggajian**: perhitungan benar (uji dengan contoh angka), slip gaji PDF, No Induk Karyawan muncul setelah 1 tahun.
10. **Upload gambar**: konversi WebP, batas cover 1 dan galeri 3, logo platform (rasio 1:1, ≤500 KB), lampiran cuti.
11. **Responsif**: cek lebar 320, 375, 768, 1024, 1440 px — tidak ada overflow/konten keluar card/scroll horizontal halaman, padding aman, navigasi mobile berfungsi.
12. **Kepatuhan desain**: hanya 3 warna + warna status; tidak ada border di mana pun; card rounded 30–40px dan bershadow tipis; tidak ada ikon Sparkles/emoji; logo & font benar (logo putih vs berwarna sesuai latar); favicon `kaleboxpink.png`; tidak ada tombol menuju halaman internal di situs publik; tombol Dasbor hanya untuk karyawan yang login.
13. `./kalebox` berjalan dari kondisi bersih sampai aplikasi siap dipakai tanpa langkah manual tambahan.
14. Cek log Laravel dan console browser: **tidak boleh ada error/warning yang tidak ditangani.**

Setelah semua lolos, berikan ringkasan: apa yang dibangun, cara menjalankan, akun awal, dan daftar fitur tambahan yang diimplementasikan.

---

## 17. CARA KERJA YANG DIHARAPKAN DARI KAMU (AGENT)

1. Buat rencana implementasi per fase (setup & desain sistem → auth & role → master data → produk & katalog → pesanan & pembayaran → alur revisi → karyawan/absensi/gaji → konten → notifikasi/laporan/pengaturan → polishing & pengujian).
2. Kerjakan fase demi fase; setiap fase selesai, jalankan dan uji sebelum lanjut.
3. Jika ada ambiguitas kecil, pilih solusi paling masuk akal sesuai dokumen ini dan catat di README; jangan berhenti hanya untuk bertanya hal sepele.
4. Jangan mengurangi atau mengabaikan satu pun poin di dokumen ini. Jika menambah fitur, pastikan tidak melanggar aturan desain (3 warna, tanpa border, tanpa Sparkles/emoji) maupun aturan akses.
