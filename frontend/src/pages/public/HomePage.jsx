import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { Skeleton } from '../../components/common/Skeleton';
import {
  ArrowRight,
  ShieldCheck,
  Palette,
  Clock,
  Truck,
  CheckCircle2,
  PhoneCall,
  Layers,
  Sparkle,
} from 'lucide-react';

export const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, prodRes, setRes] = await Promise.all([
          api.get('/product-categories'),
          api.get('/products?per_page=6'),
          api.get('/settings'),
        ]);

        if (catRes.data?.status === 'success') {
          setCategories(catRes.data.data || []);
        }
        if (prodRes.data?.status === 'success') {
          setFeaturedProducts(prodRes.data.data?.data || []);
        }
        if (setRes.data?.status === 'success') {
          setSettings(setRes.data.data || {});
        }
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const orderSteps = [
    {
      step: '01',
      title: 'Pilih Box & Spesifikasi',
      desc: 'Tentukan model box, dimensi kemasan (P x L x T), variasi kertas, serta laminasi finishing sesuai kebutuhan produk Anda.',
    },
    {
      step: '02',
      title: 'Pembayaran QRIS Instan',
      desc: 'Dapatkan kalkulasi biaya transparan dan selesaikan pembayaran cepat dengan QRIS resmi berbatas waktu otomatis.',
    },
    {
      step: '03',
      title: 'ACC & Penyesuaian Desain',
      desc: 'Tim desainer Kalebox menyiapkan pratinjau layout cetak. Anda dapat menyetujui langsung atau mengajukan revisi detail.',
    },
    {
      step: '04',
      title: 'Produksi Cetak Offset',
      desc: 'Setelah desain disetujui, pesanan dicetak dengan mesin offset presisi tinggi menggunakan tinta dan bahan bersertifikasi.',
    },
    {
      step: '05',
      title: 'Finishing & Quality Control',
      desc: 'Pond potongan die-cut, lipatan presisi, pengeleman rapi, serta inspeksi ketat sebelum pengepakan.',
    },
    {
      step: '06',
      title: 'Pengiriman Cepat & Aman',
      desc: 'Paket dikemas berlapis untuk perlindungan maksimal dan siap dikirim langsung ke alamat workshop atau tempat usaha Anda.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Headline */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FDF2F8] text-[#DE0E86] text-xs font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-[#DE0E86]" />
                Manufaktur Kemasan & Box Custom
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#004582] tracking-tight leading-[1.12]">
                Kemasan Berkualitas,{' '}
                <span className="text-[#DE0E86]">Nilai Jual Berkelas</span> Untuk Bisnis Anda.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 font-medium max-w-2xl leading-relaxed">
                Kalebox menghadirkan solusi percetakan kemasan custom profesional: box makanan food grade, packaging hampers, corrugated box, hingga gift box premium dengan cetak offset tajam dan minimal order fleksibel.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/katalog">
                  <Button variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
                    Jelajahi Katalog Box
                  </Button>
                </Link>
                <Link to="/cara-pesan">
                  <Button variant="light" size="lg">
                    Pelajari Alur Pesan
                  </Button>
                </Link>
              </div>

              {/* Value pillars */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8">
                <div className="space-y-1">
                  <p className="text-xl font-extrabold text-[#004582]">Food Grade</p>
                  <p className="text-xs text-slate-500 font-medium">Bahan Baku Higienis</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-extrabold text-[#DE0E86]">Offset Presisi</p>
                  <p className="text-xs text-slate-500 font-medium">Warna Cetak Akurat</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-extrabold text-[#004582]">ACC Digital</p>
                  <p className="text-xs text-slate-500 font-medium">Persetujuan Praktis</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-extrabold text-[#DE0E86]">QRIS Cepat</p>
                  <p className="text-xs text-slate-500 font-medium">Verifikasi Otomatis</p>
                </div>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="bg-white rounded-[32px] p-4 shadow-card overflow-hidden">
                  <img
                    src="/storage/products/sample_lunch_box.webp"
                    alt="Packaging Box Kalebox"
                    className="w-full h-80 sm:h-96 object-cover rounded-[24px]"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-[#004582] text-sm">Kemasan Custom Presisi</h3>
                      <p className="text-xs text-slate-500">Standar Produksi Kalebox Indonesia</p>
                    </div>
                    <Badge variant="primary" size="sm">Cetak Offset</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <Badge variant="secondary" size="md">Kategori Pilihan</Badge>
          <h2 className="text-3xl font-extrabold text-[#004582] tracking-tight">
            Beragam Model Kemasan Siap Pakai
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Temukan struktur kemasan yang tepat untuk memperkuat perlindungan dan estetika produk Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-[32px] p-6 shadow-card space-y-4">
                <Skeleton height="h-32" rounded="rounded-[20px]" />
                <Skeleton height="h-6" width="w-3/4" />
                <Skeleton height="h-4" width="w-full" />
              </div>
            ))
          ) : (
            categories.map((cat) => (
              <Card key={cat.id} hover className="flex flex-col justify-between text-left">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-[20px] bg-[#F0F6FB] text-[#004582] flex items-center justify-center font-extrabold text-base">
                    <Layers className="w-6 h-6 text-[#DE0E86]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#004582] tracking-tight">{cat.name}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {cat.description || 'Pilihan kemasan custom dengan variasi ketebalan bahan dan laminasi premium.'}
                  </p>
                </div>
                <div className="pt-6">
                  <Link to={`/katalog?kategori=${cat.slug}`}>
                    <Button variant="light" size="sm" className="w-full" icon={ArrowRight} iconPosition="right">
                      Lihat Produk
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div className="space-y-2">
            <Badge variant="primary" size="md">Produk Unggulan</Badge>
            <h2 className="text-3xl font-extrabold text-[#004582] tracking-tight">
              Pilihan Favorit Klien Kalebox
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Kemasan terlaris dengan formulasi kertas terbaik dan daya tahan teruji.
            </p>
          </div>
          <Link to="/katalog">
            <Button variant="secondary" size="md" icon={ArrowRight} iconPosition="right">
              Semua Produk
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-[32px] p-6 shadow-card space-y-4">
                <Skeleton height="h-48" rounded="rounded-[24px]" />
                <Skeleton height="h-6" width="w-2/3" />
                <Skeleton height="h-4" width="w-1/2" />
              </div>
            ))
          ) : (
            featuredProducts.map((prod) => {
              const primaryImg = prod.images?.find((img) => img.is_primary)?.image_path || prod.images?.[0]?.image_path;
              return (
                <Card key={prod.id} hover padding="p-5" className="flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="relative aspect-video w-full rounded-[24px] overflow-hidden bg-slate-100">
                      <img
                        src={primaryImg || '/storage/products/sample_lunch_box.webp'}
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop';
                        }}
                      />
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" size="sm">
                          {prod.category?.name || 'Kemasan'}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-[#004582] tracking-tight line-clamp-1">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-1 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    <div className="bg-[#F0F6FB] p-3 rounded-[20px] flex items-center justify-between text-xs">
                      <div>
                        <p className="text-[11px] text-slate-400 font-medium">Mulai dari</p>
                        <p className="font-extrabold text-[#DE0E86] text-base">
                          Rp {Number(prod.base_price).toLocaleString('id-ID')}
                          <span className="text-xs font-normal text-slate-500"> /pcs</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-slate-400 font-medium">Min. Order</p>
                        <p className="font-bold text-[#004582]">{prod.min_order} pcs</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Link to={`/katalog/${prod.id}`}>
                      <Button variant="primary" size="sm" className="w-full">
                        Lihat Detail & Pesan
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* 6 Tahapan Alur Pemesanan */}
      <section className="bg-white py-16 shadow-[0_4px_30px_rgba(0,69,130,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <Badge variant="secondary" size="md">Alur Transparan</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#004582] tracking-tight">
              6 Langkah Mudah Memesan Kemasan di Kalebox
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Dari pemilihan spesifikasi hingga barang tiba di depan pintu Anda, setiap tahap terpantau jelas melalui pelacak digital kami.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {orderSteps.map((s) => (
              <div
                key={s.step}
                className="bg-[#F0F6FB]/70 p-8 rounded-[32px] hover:bg-[#F0F6FB] transition-colors duration-200 text-left space-y-4"
              >
                <span className="text-3xl font-extrabold text-[#DE0E86] tracking-tighter block font-mono">
                  {s.step}
                </span>
                <h3 className="text-lg font-bold text-[#004582] tracking-tight">{s.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/cara-pesan">
              <Button variant="light" size="md" icon={ArrowRight} iconPosition="right">
                Baca Panduan Lengkap Pemesanan
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Profil Perusahaan / Mengapa Kalebox */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 text-left">
            <Badge variant="primary" size="md">Tentang Kalebox</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#004582] tracking-tight leading-tight">
              Mendukung Pertumbuhan Bisnis Kuliner & Kreatif Indonesia
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
              Kalebox didirikan untuk memberikan kemudahan bagi pelaku UMKM hingga brand skala besar dalam memiliki kemasan premium berstandar industri tanpa kerumitan proses pemesanan.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#004582]">Standar Food Grade Teruji</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Kertas greaseproof, kraft food grade, dan ivory bersertifikasi bebas migrasi kimia berbahaya.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#FDF2F8] text-[#DE0E86] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#004582]">Dukungan Desain & Layout Siap Cetak</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Tim desainer in-house membantu penyesuaian die-cut, garis potong, dan bleed agar hasil cetak presisi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-full bg-[#F0F6FB] text-[#004582] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#004582]">Ketepatan Waktu Produksi</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Manajemen jadwal cetak berbasis sistem terintegrasi menjamin pesanan selesai sesuai komitmen.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <Card padding="p-8 sm:p-10" className="bg-[#004582] text-white space-y-6 text-left shadow-xl border-0">
              <div className="space-y-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/15 text-pink-300 font-bold text-xs uppercase tracking-wider">
                  Visi Perusahaan
                </span>
                <h3 className="text-lg sm:text-xl font-bold leading-snug text-white tracking-tight">
                  Menjadi pionir manufaktur kemasan ramah lingkungan dan terdepan dalam inovasi cetak kustom di Indonesia.
                </h3>
              </div>

              <div className="space-y-3 pt-3 border-t border-white/15">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-pink-300 font-bold text-xs uppercase tracking-wider">
                  Misi Utama
                </span>
                <ul className="text-xs sm:text-sm text-white/90 space-y-2.5 font-medium leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <span>Menyediakan kemasan berkualitas tinggi dengan standar ketat food-grade.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <span>Memberikan layanan desain responsif dan transparan tanpa proses berbelit.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-white/15 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      3
                    </span>
                    <span>Membantu UMKM memiliki kemasan berkelas dengan minimal order fleksibel.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Link to="/katalog">
                  <Button variant="primary" size="lg" className="w-full shadow-lg">
                    Mulai Pesan Kemasan Sekarang
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#004582] to-[#003362] rounded-[32px] p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 text-left">
          <div className="space-y-3 max-w-xl">
            <Badge variant="primary" size="md">Konsultasi Gratis</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Punya Ukuran Kemasan Khusus atau Butuh Mockup Sampel?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 font-medium leading-relaxed">
              Hubungi tim teknis cetak Kalebox untuk mendiskusikan gramatur kertas, jenis pond, dan simulasi biaya tanpa biaya tersembunyi.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0">
            <a
              href="https://wa.me/6281234567890?text=Halo%20Kalebox%2C%20saya%20ingin%20konsultasi%20pembuatan%20kemasan%20box"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="lg" icon={PhoneCall}>
                WhatsApp Konsultasi
              </Button>
            </a>
            <Link to="/katalog">
              <Button variant="light" size="lg">
                Pilih Model Box
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
