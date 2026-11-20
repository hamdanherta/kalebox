import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import {
  Layers,
  QrCode,
  Palette,
  Printer,
  PackageCheck,
  Truck,
  ArrowRight,
  HelpCircle,
  PhoneCall,
} from 'lucide-react';

export const HowToOrderPage = () => {
  const steps = [
    {
      num: '01',
      title: 'Tentukan Spesifikasi Kemasan',
      desc: 'Pilih model box yang sesuai dengan produk Anda (lunch box, snack box, corrugated box, dll). Tentukan ukuran kustom (P x L x T cm), bahan baku kertas food-grade, serta jenis laminasi glossy atau doff.',
      icon: Layers,
    },
    {
      num: '02',
      title: 'Kalkulasi & Pembayaran QRIS',
      desc: 'Sistem Kalebox menghitung biaya secara otomatis dan transparan. Lakukan pembayaran instan menggunakan QRIS resmi Kalebox yang dilengkapi countdown timer 5 menit dan unggah bukti transfer.',
      icon: QrCode,
    },
    {
      num: '03',
      title: 'Verifikasi & Pengolahan Desain',
      desc: 'Admin memverifikasi pembayaran Anda, lalu desainer kami menyiapkan layout siap cetak (termasuk garis pond bleed & lipatan). Anda dapat meninjau desain secara digital di halaman Lacak Pesanan.',
      icon: Palette,
    },
    {
      num: '04',
      title: 'Persetujuan (ACC) Desain Klien',
      desc: 'Jika desain sudah sesuai, Anda cukup mengklik tombol "ACC Desain". Jika ada yang perlu diperbaiki, Anda dapat menuliskan catatan revisi tanpa perlu repot.',
      icon: PackageCheck,
    },
    {
      num: '05',
      title: 'Produksi Cetak & Finishing',
      desc: 'Pesanan masuk antrean mesin cetak offset berkualitas tinggi, proses laminasi, pembuatan pisau pond die-cut, dan pengeleman presisi oleh tim produksi berpengalaman.',
      icon: Printer,
    },
    {
      num: '06',
      title: 'Quality Check & Pengiriman',
      desc: 'Setiap batch melewati uji ketahanan dan kerapian. Kemasan dibungkus rapat dengan plastik dan kardus pelindung sebelum dikirimkan ke lokasi Anda.',
      icon: Truck,
    },
  ];

  const faqs = [
    {
      q: 'Berapa minimal order di Kalebox?',
      a: 'Minimal order tergantung jenis produk, mulai dari 500 pcs untuk box makanan standar hingga 1.000 pcs untuk corrugated mailer box.',
    },
    {
      q: 'Apakah kertas yang digunakan aman untuk makanan?',
      a: 'Ya, seluruh varian kertas food-grade kami telah bersertifikat aman kontak langsung dengan makanan (bebas migrasi zat berbahaya dan tahan minyak/panas).',
    },
    {
      q: 'Berapa lama proses pengerjaan pesanan?',
      a: 'Proses produksi memakan waktu sekitar 7–14 hari kerja setelah desain disetujui (ACC), tergantung jumlah kuantiti dan antrean produksi.',
    },
    {
      q: 'Apakah bisa cetak sampel sebelum produksi massal?',
      a: 'Bisa! Anda dapat berkonsultasi dengan tim kami melalui WhatsApp untuk pemesanan sampel dummy atau proofing warna cetak.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 text-left">
      <div className="space-y-3 text-center max-w-2xl mx-auto">
        <Badge variant="secondary" size="md">Panduan Lengkap</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#004582] tracking-tight">
          Cara Memesan Kemasan di Kalebox
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Panduan langkah demi langkah memesan box custom dari konsultasi awal hingga barang siap dikirim ke tempat usaha Anda.
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        {steps.map((stg) => {
          const Icon = stg.icon;
          return (
            <Card key={stg.num} padding="p-6 md:p-8" className="flex flex-col sm:flex-row items-start gap-6">
              <div className="w-14 h-14 rounded-[20px] bg-[#FDF2F8] text-[#DE0E86] flex items-center justify-center font-mono font-extrabold text-xl flex-shrink-0">
                {stg.num}
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-[#004582] flex items-center gap-2">
                  <span>{stg.title}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                  {stg.desc}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="space-y-6 pt-6">
        <div className="text-center space-y-2">
          <Badge variant="primary" size="sm">Tanya Jawab</Badge>
          <h2 className="text-2xl font-extrabold text-[#004582]">Pertanyaan Yang Sering Diajukan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqs.map((faq, i) => (
            <Card key={i} padding="p-6" className="space-y-2 bg-white">
              <h4 className="text-sm font-bold text-[#004582] flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-[#DE0E86] flex-shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h4>
              <p className="text-xs text-slate-600 font-medium pl-6 leading-relaxed">
                {faq.a}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <Card padding="p-8 sm:p-10" className="bg-[#004582] text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-left">
          <h3 className="text-xl font-bold">Siap Mengupgrade Kemasan Produk Anda?</h3>
          <p className="text-xs text-white/80 font-medium">
            Pilih model kemasan sekarang atau hubungi tim customer relation kami untuk konsultasi.
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Link to="/katalog">
            <Button variant="primary" size="md">
              Pilih Model Box
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default HowToOrderPage;
