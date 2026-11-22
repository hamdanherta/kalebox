<?php

namespace Database\Seeders;

use App\Models\Bonus;
use App\Models\Client;
use App\Models\Cutting;
use App\Models\Division;
use App\Models\Employee;
use App\Models\EmployeeStatus;
use App\Models\Finishing;
use App\Models\Material;
use App\Models\Member;
use App\Models\Position;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\PromotionPlatform;
use App\Models\QrisSetting;
use App\Models\RegistrationCode;
use App\Models\Role;
use App\Models\Setting;
use App\Models\User;
use App\Models\Vendor;
use App\Models\WorkSchedule;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Roles
        $roles = [
            ['name' => 'owner', 'display_name' => 'Owner'],
            ['name' => 'manager', 'display_name' => 'Manager'],
            ['name' => 'admin', 'display_name' => 'Admin & Content Creator'],
            ['name' => 'design', 'display_name' => 'Design (Graphic Designer)'],
            ['name' => 'staff', 'display_name' => 'Staff (Produksi)'],
            ['name' => 'keuangan', 'display_name' => 'Keuangan & Kas'],
            ['name' => 'member', 'display_name' => 'Member'],
        ];

        $roleModels = [];
        foreach ($roles as $r) {
            $roleModels[$r['name']] = Role::firstOrCreate(['name' => $r['name']], $r);
        }

        // Catatan: Seluruh akun user demo telah dikosongkan.
        // User baru dibuat mandiri melalui halaman registrasi internal (/internal/daftar)
        // dengan format domain email khusus role.

        // 2. Divisi & Posisi Karyawan
        $divManajemen = Division::firstOrCreate(['name' => 'Manajemen']);
        $divDesain    = Division::firstOrCreate(['name' => 'Desain & Kreatif']);
        $divProduksi  = Division::firstOrCreate(['name' => 'Produksi & Finishing']);

        $posOwner    = Position::firstOrCreate(['name' => 'Direktur Utama / Owner', 'division_id' => $divManajemen->id]);
        $posManager  = Position::firstOrCreate(['name' => 'Manajer Operasional', 'division_id' => $divManajemen->id]);
        $posAdmin    = Position::firstOrCreate(['name' => 'Admin & Content Specialist', 'division_id' => $divDesain->id]);
        $posDesign   = Position::firstOrCreate(['name' => 'Senior Graphic Designer', 'division_id' => $divDesain->id]);
        $posStaff    = Position::firstOrCreate(['name' => 'Operator Mesin Cetak & QC', 'division_id' => $divProduksi->id]);
        $posKeuangan = Position::firstOrCreate(['name' => 'Staff Keuangan & Kasir', 'division_id' => $divManajemen->id]);

        // 3. Status Karyawan
        $stTetap = EmployeeStatus::firstOrCreate(['name' => 'Karyawan Tetap', 'duration_type' => 'Selamanya']);
        $stKontrak = EmployeeStatus::firstOrCreate([
            'name' => 'Kontrak 1 Tahun',
            'duration_type' => 'Berbatas Waktu',
            'valid_until' => Carbon::now()->addYear()->toDateString(),
        ]);

        // 4. Waktu Kerja
        WorkSchedule::firstOrCreate(
            ['name' => 'Jadwal Standar Percetakan'],
            [
                'start_time' => '08:00:00',
                'end_time' => '17:00:00',
                'work_days' => ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
                'is_active' => true,
            ]
        );

        // 7. Master Finishing & Cutting
        $finGlossy = Finishing::firstOrCreate(['finishing_code' => 'FIN-001'], ['name' => 'Laminasi Glossy']);
        $finDoff   = Finishing::firstOrCreate(['finishing_code' => 'FIN-002'], ['name' => 'Laminasi Doff']);
        $finGold   = Finishing::firstOrCreate(['finishing_code' => 'FIN-003'], ['name' => 'Hot Print Foil Emas']);
        $finSpotUV = Finishing::firstOrCreate(['finishing_code' => 'FIN-004'], ['name' => 'Spot UV Eksklusif']);
        $finNone   = Finishing::firstOrCreate(['finishing_code' => 'FIN-005'], ['name' => 'Tanpa Finishing']);

        $cutDieCut = Cutting::firstOrCreate(['cutting_code' => 'CUT-001'], ['name' => 'Pond Die-Cut Custom']);
        $cutSquare = Cutting::firstOrCreate(['cutting_code' => 'CUT-002'], ['name' => 'Potong Lurus']);
        $cutWindow = Cutting::firstOrCreate(['cutting_code' => 'CUT-003'], ['name' => 'Window Mika Transparan']);
        $cutCrease = Cutting::firstOrCreate(['cutting_code' => 'CUT-004'], ['name' => 'Garis Lipat (Creasing)']);

        // 8. Kategori Produk
        $katBakery     = ProductCategory::firstOrCreate(['category_code' => 'KAT-001'], ['name' => 'Box Roti & Bakery']);
        $katMartabak   = ProductCategory::firstOrCreate(['category_code' => 'KAT-002'], ['name' => 'Box Martabak & Snack']);
        $katCorrugated = ProductCategory::firstOrCreate(['category_code' => 'KAT-003'], ['name' => 'Dus Polos & Corrugated Box']);
        $katPaperBag   = ProductCategory::firstOrCreate(['category_code' => 'KAT-004'], ['name' => 'Paper Bag & Pouch Sablon']);
        $katHardbox    = ProductCategory::firstOrCreate(['category_code' => 'KAT-005'], ['name' => 'Hardbox Premium Custom']);

        // 9. Bahan & Pivot
        $matIvory = Material::firstOrCreate(
            ['material_code' => 'BAH-001'],
            [
                'name' => 'Ivory 300 GSM Food Grade',
                'category_id' => $katBakery->id,
                'description' => 'Permukaan luar putih halus mengkilap, bagian dalam putih bersih bersertifikasi aman untuk makanan berminyak.',
                'price' => 1500.00,
            ]
        );
        $matIvory->finishings()->sync([$finGlossy->id, $finDoff->id, $finGold->id, $finSpotUV->id, $finNone->id]);
        $matIvory->cuttings()->sync([$cutDieCut->id, $cutWindow->id, $cutCrease->id]);

        $matDuplex = Material::firstOrCreate(
            ['material_code' => 'BAH-002'],
            [
                'name' => 'Duplex 350 GSM Ekonomis',
                'category_id' => $katMartabak->id,
                'description' => 'Sisi luar putih halus untuk cetak full color tajam, bagian dalam abu-abu tebal dan ekonomis untuk jajanan/martabak.',
                'price' => 1100.00,
            ]
        );
        $matDuplex->finishings()->sync([$finGlossy->id, $finDoff->id, $finNone->id]);
        $matDuplex->cuttings()->sync([$cutDieCut->id, $cutCrease->id]);

        $matKraft = Material::firstOrCreate(
            ['material_code' => 'BAH-003'],
            [
                'name' => 'Kraft Coklat 275 GSM Eco Food Grade',
                'category_id' => $katPaperBag->id,
                'description' => 'Tampilan coklat natural vintage ramah lingkungan dengan laminasi anti-minyak bagian dalam.',
                'price' => 1250.00,
            ]
        );
        $matKraft->finishings()->sync([$finDoff->id, $finNone->id]);
        $matKraft->cuttings()->sync([$cutDieCut->id, $cutWindow->id]);

        $matFlute = Material::firstOrCreate(
            ['material_code' => 'BAH-004'],
            [
                'name' => 'Corrugated E-Flute Coklat Kokoh',
                'category_id' => $katCorrugated->id,
                'description' => 'Karton bergelombang tebal dan kuat, tahan tumpukan hingga 10 kg untuk pengiriman jarak jauh.',
                'price' => 2400.00,
            ]
        );
        $matFlute->finishings()->sync([$finNone->id]);
        $matFlute->cuttings()->sync([$cutDieCut->id, $cutCrease->id]);

        // 10. Produk Contoh
        $prod1 = Product::firstOrCreate(
            ['product_code' => 'PRD-001'],
            [
                'name' => 'Box Roti Bakar Bandung Window Mika',
                'category_id' => $katBakery->id,
                'material_id' => $matIvory->id,
                'description' => 'Kemasan kotak roti bakar khas Bandung dengan jendela mika transparan di bagian atas sehingga produk roti langsung terlihat menggugah selera. Dilengkapi laminasi dalam anti-minyak dan mentega.',
                'min_order' => 500,
                'unit_price' => 1850.00,
                'cover_image' => '/storage/products/box_roti_bakar.webp',
                'is_active' => true,
            ]
        );

        $prod2 = Product::firstOrCreate(
            ['product_code' => 'PRD-002'],
            [
                'name' => 'Kotak Martabak Manis Food Grade Ivory',
                'category_id' => $katMartabak->id,
                'material_id' => $matIvory->id,
                'description' => 'Box martabak premium dengan sirkulasi udara lubang uap tersembunyi agar martabak tetap renyah dan tidak lembek selama pengantaran. Cetak full color tahan panas.',
                'min_order' => 500,
                'unit_price' => 2100.00,
                'cover_image' => '/storage/products/box_martabak.webp',
                'is_active' => true,
            ]
        );

        $prod3 = Product::firstOrCreate(
            ['product_code' => 'PRD-003'],
            [
                'name' => 'Corrugated Box Pizza & Pastry E-Flute',
                'category_id' => $katCorrugated->id,
                'material_id' => $matFlute->id,
                'description' => 'Dus kemasan pizza, donat isi 6/12, atau pastry berat dengan struktur gelombang mikro E-Flute tahan tumpukan dan tidak mudah penyok saat kurir mengantar.',
                'min_order' => 300,
                'unit_price' => 3200.00,
                'cover_image' => '/storage/products/box_corrugated.webp',
                'is_active' => true,
            ]
        );

        $prod4 = Product::firstOrCreate(
            ['product_code' => 'PRD-004'],
            [
                'name' => 'Paper Bag Sablon Kraft Coklat UMKM',
                'category_id' => $katPaperBag->id,
                'material_id' => $matKraft->id,
                'description' => 'Kantong belanja berbahan kraft coklat daur ulang dilengkapi tali kur / tali twisted paper yang kuat. Sablon logo presisi 1-2 warna untuk meningkatkan citra brand lokal.',
                'min_order' => 250,
                'unit_price' => 2500.00,
                'cover_image' => '/storage/products/paperbag_kraft.webp',
                'is_active' => true,
            ]
        );

        // 11. Vendor
        Vendor::firstOrCreate(
            ['vendor_code' => 'VND-001'],
            [
                'name' => 'PT Sinar Percetakan Offset Jaya',
                'address' => 'Kawasan Industri Cikarang Blok B-12, Bekasi',
                'phone' => '628118899001',
                'email' => 'offset@sinarpercetakan.co.id',
                'print_type' => 'Cetak Offset 5 Warna & Coating UV Skala Besar',
            ]
        );

        Vendor::firstOrCreate(
            ['vendor_code' => 'VND-002'],
            [
                'name' => 'CV Cahaya Mika Packaging',
                'address' => 'Jl. Industri Grafika No. 8, Palembang',
                'phone' => '628117788002',
                'email' => 'order@cahayamika.com',
                'print_type' => 'Pond Die-Cut Presisi & Jendela Mika Rigid',
            ]
        );

        // 12. QRIS Default
        QrisSetting::firstOrCreate(
            ['account_name' => 'KALEBOX PERCETAKAN MANDIRI'],
            [
                'qr_image' => '/storage/qris/sample_qris.webp',
                'is_active' => true,
            ]
        );

        // 13. Platform Promosi
        PromotionPlatform::firstOrCreate(
            ['name' => 'Instagram'],
            [
                'logo' => '/logo/kaleboxpink.png',
                'account_link' => 'https://instagram.com/kalebox.id',
            ]
        );
        PromotionPlatform::firstOrCreate(
            ['name' => 'TikTok'],
            [
                'logo' => '/logo/kaleboxnavy.png',
                'account_link' => 'https://tiktok.com/@kalebox.kemasan',
            ]
        );

        // 14. Bonus Karyawan
        Bonus::firstOrCreate(
            ['name' => 'Bonus Target Produksi Bulanan'],
            ['amount' => 500000.00, 'description' => 'Diberikan apabila target cetak 50.000 pcs per bulan tercapai tanpa komplain cacat.']
        );
        Bonus::firstOrCreate(
            ['name' => 'Insentif Lembur Proyek Prioritas'],
            ['amount' => 250000.00, 'description' => 'Insentif lembur cepat untuk pesanan klien berlabel Prioritas Tinggi.']
        );

        // 15. Klien Contoh
        $client1 = Client::firstOrCreate(
            ['client_code' => 'CLN-00001'],
            [
                'name' => 'Roti Bakar Juara 88',
                'phone' => '6281234567895',
                'email' => 'klien@rotibakar88.com',
                'client_type' => 'Lama',
                'is_member' => false,
                'notes' => 'Pelanggan rutin box roti bakar 1.000 pcs per bulan.',
            ]
        );

        // 17. Pengaturan Sistem Awal
        Setting::set('company_name', 'Kalebox Percetakan Kemasan');
        Setting::set('company_tagline', 'Solusi Percetakan Kemasan Modern, Food Grade & Berkualitas');
        Setting::set('company_about', 'Kalebox adalah mitra percetakan kemasan terpercaya yang berdiri untuk mendukung pertumbuhan bisnis UMKM hingga skala industri di Indonesia. Kami memadukan teknologi cetak offset mutakhir, bahan baku bersertifikat food-grade, dan ketelitian produksi untuk menghasilkan kemasan yang kokoh, memikat, dan higienis.');
        Setting::set('company_vision', 'Menjadi pionir manufaktur kemasan ramah lingkungan dan terdepan dalam inovasi cetak kustom bagi pelaku usaha kuliner dan produk kreatif di Indonesia.');
        Setting::set('company_mission', '1. Menyediakan kemasan berkualitas tinggi dengan standar ketat food-grade.\n2. Memberikan layanan desain responsif dan transparan tanpa proses berbelit.\n3. Membantu UMKM memiliki kemasan berkelas dengan minimal order yang fleksibel.');
        Setting::set('company_phone', '0812-3456-7890');
        Setting::set('company_whatsapp', '6281234567890');
        Setting::set('company_email', 'kontak@kalebox.id');
        Setting::set('company_address', 'Jl. Kolonel Pol. M. Thaher No. 88, Wijayapura, Jambi Selatan, Kota Jambi 36139');
        Setting::set('office_lat', -1.6169982045745503);
        Setting::set('office_lng', 103.57810290034548);
        Setting::set('attendance_radius_meter', 10.0);
        Setting::set('late_penalty_amount', 25000.0);
        Setting::set('sick_salary_paid', false);
        Setting::set('leave_salary_paid', false);
    }
}
