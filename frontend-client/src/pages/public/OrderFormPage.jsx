import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  ShoppingBag,
  Clock,
  QrCode,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Layers,
} from 'lucide-react';

export const OrderFormPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [finishings, setFinishings] = useState([]);
  const [cuttings, setCuttings] = useState([]);
  const [activeQris, setActiveQris] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  const [selectedProduct, setSelectedProduct] = useState(searchParams.get('produk_id') || '');
  const [selectedMaterial, setSelectedMaterial] = useState(searchParams.get('material_id') || '');
  const [selectedFinishing, setSelectedFinishing] = useState(searchParams.get('finishing_id') || '');
  const [selectedCutting, setSelectedCutting] = useState(searchParams.get('cutting_id') || '');
  const [customLength, setCustomLength] = useState('');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [quantity, setQuantity] = useState(Number(searchParams.get('jumlah')) || 500);
  const [designNotes, setDesignNotes] = useState('');
  const [designFile, setDesignFile] = useState(null);

  // Payment Modal State
  const [qrisModalOpen, setQrisModalOpen] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, matRes, finRes, cutRes, qrisRes] = await Promise.all([
          api.get('/products?per_page=100'),
          api.get('/materials'),
          api.get('/finishings'),
          api.get('/cuttings'),
          api.get('/qris/active'),
        ]);

        if (prodRes.data?.status === 'success') {
          const list = prodRes.data.data?.data || [];
          setProducts(list);
          if (!selectedProduct && list.length > 0) {
            setSelectedProduct(list[0].id);
            setCustomLength(list[0].default_length_cm || '');
            setCustomWidth(list[0].default_width_cm || '');
            setCustomHeight(list[0].default_height_cm || '');
            setQuantity(list[0].min_order || 500);
          } else if (selectedProduct) {
            const p = list.find((item) => item.id === Number(selectedProduct));
            if (p) {
              setCustomLength(p.default_length_cm || '');
              setCustomWidth(p.default_width_cm || '');
              setCustomHeight(p.default_height_cm || '');
              if (!searchParams.get('jumlah')) setQuantity(p.min_order || 500);
            }
          }
        }

        if (matRes.data?.status === 'success') {
          setMaterials(matRes.data.data || []);
          if (!selectedMaterial && matRes.data.data?.length > 0) {
            setSelectedMaterial(matRes.data.data[0].id);
          }
        }
        if (finRes.data?.status === 'success') setFinishings(finRes.data.data || []);
        if (cutRes.data?.status === 'success') setCuttings(cutRes.data.data || []);
        if (qrisRes.data?.status === 'success') setActiveQris(qrisRes.data.data);
      } catch (err) {
        console.error('Failed to load order form data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update default specs when product changes
  const handleProductChange = (prodId) => {
    setSelectedProduct(prodId);
    const p = products.find((item) => item.id === Number(prodId));
    if (p) {
      setCustomLength(p.default_length_cm || '');
      setCustomWidth(p.default_width_cm || '');
      setCustomHeight(p.default_height_cm || '');
      if (quantity < p.min_order) {
        setQuantity(p.min_order);
      }
    }
  };

  // Price Calculation
  const currentProd = products.find((p) => p.id === Number(selectedProduct));
  const currentMat = materials.find((m) => m.id === Number(selectedMaterial));
  const currentFin = finishings.find((f) => f.id === Number(selectedFinishing));
  const currentCut = cuttings.find((c) => c.id === Number(selectedCutting));

  const basePrice = Number(currentProd?.base_price || 0);
  const matExtra = Number(currentMat?.price_per_unit || 0);
  const finExtra = Number(currentFin?.extra_price || 0);
  const cutExtra = Number(currentCut?.extra_price || 0);

  let discount = 0;
  if (quantity >= 3000) discount = 0.10;
  else if (quantity >= 1000) discount = 0.05;

  const unitPrice = Math.round((basePrice + matExtra + finExtra + cutExtra) * (1 - discount));
  const subtotal = unitPrice * (quantity || 0);
  const shippingFee = 0; // Calculated on packaging
  const grandTotal = subtotal + shippingFee;

  // Countdown timer for QRIS modal
  useEffect(() => {
    let timer;
    if (qrisModalOpen && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [qrisModalOpen, timeLeft]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!currentProd) {
      addToast('Silakan pilih produk kemasan terlebih dahulu', 'warning');
      return;
    }
    if (quantity < (currentProd.min_order || 1)) {
      addToast(`Jumlah pesanan minimal adalah ${currentProd.min_order} pcs`, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('client_name', clientName);
      formData.append('client_phone', clientPhone);
      formData.append('client_email', clientEmail);
      formData.append('company_name', companyName || '');
      formData.append('shipping_address', shippingAddress);

      formData.append('product_id', selectedProduct);
      formData.append('material_id', selectedMaterial || '');
      formData.append('finishing_id', selectedFinishing || '');
      formData.append('cutting_id', selectedCutting || '');
      formData.append('custom_length_cm', customLength || currentProd.default_length_cm);
      formData.append('custom_width_cm', customWidth || currentProd.default_width_cm);
      formData.append('custom_height_cm', customHeight || currentProd.default_height_cm);
      formData.append('quantity', quantity);
      formData.append('design_notes', designNotes || '');

      if (designFile) {
        formData.append('design_file', designFile);
      }

      const res = await api.post('/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success') {
        const orderData = res.data.data;
        setCreatedOrder(orderData);
        setTimeLeft(300); // 5 minutes
        setQrisModalOpen(true);
        addToast('Pesanan berhasil dibuat! Silakan selesaikan pembayaran.', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal membuat pesanan. Periksa formulir Anda.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadPaymentProof = async () => {
    if (!paymentProofFile) {
      addToast('Pilih file bukti transfer pembayaran terlebih dahulu', 'warning');
      return;
    }
    if (!createdOrder?.tracking_token) return;

    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('payment_proof', paymentProofFile);

      const res = await api.post(`/orders/track/${createdOrder.tracking_token}/payment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success') {
        addToast('Bukti pembayaran berhasil diunggah! Tim akan segera memverifikasi.', 'success');
        setQrisModalOpen(false);
        navigate(`/pesanan/${createdOrder.tracking_token}`);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran', 'error');
    } finally {
      setIsUploadingProof(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <div className="space-y-2">
        <Badge variant="secondary" size="md">Formulir Pemesanan</Badge>
        <h1 className="text-3xl font-extrabold text-[#004582] tracking-tight">
          Pesan Kemasan Custom Kalebox
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Lengkapi detail spesifikasi kemasan dan informasi pengiriman Anda untuk memulai proses produksi cetak.
        </p>
      </div>

      <form onSubmit={handleOrderSubmit} className="space-y-8">
        {/* Section 1: Data Pemesan */}
        <Card padding="p-6 md:p-8" className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <User className="w-5 h-5 text-[#DE0E86]" />
            <h2 className="text-lg font-bold text-[#004582]">1. Informasi Pemesan & Pengiriman</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap"
              required
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Contoh: Rahmat Hidayat"
              icon={User}
            />
            <Input
              label="Nomor WhatsApp"
              required
              type="tel"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Contoh: 08123456789"
              icon={Phone}
              helperText="Pastikan nomor aktif untuk konfirmasi desain via WhatsApp"
            />
            <Input
              label="Alamat Email"
              required
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="Contoh: nama@usaha.com"
              icon={Mail}
            />
            <Input
              label="Nama Brand / Usaha"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Contoh: Kopi Nusantara (opsional)"
              icon={Building}
            />
          </div>

          <Textarea
            label="Alamat Lengkap Pengiriman"
            required
            rows={3}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Tuliskan nama jalan, RT/RW, nomor ruko/rumah, kelurahan, kecamatan, kota, dan kode pos..."
          />
        </Card>

        {/* Section 2: Spesifikasi Box */}
        <Card padding="p-6 md:p-8" className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Layers className="w-5 h-5 text-[#DE0E86]" />
            <h2 className="text-lg font-bold text-[#004582]">2. Spesifikasi Produk & Kemasan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Pilih Model Kemasan"
              required
              value={selectedProduct}
              onChange={(e) => handleProductChange(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Min. {p.min_order} pcs)
                </option>
              ))}
            </Select>

            <Select
              label="Pilihan Kertas / Bahan Baku"
              required
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.grammage} gsm) - {m.is_food_grade ? 'Food Grade' : 'Standard'}
                </option>
              ))}
            </Select>

            <Select
              label="Laminasi & Finishing"
              value={selectedFinishing}
              onChange={(e) => setSelectedFinishing(e.target.value)}
              placeholder="Tanpa Finishing Khusus"
            >
              {finishings.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} {f.extra_price > 0 ? `(+Rp ${Number(f.extra_price).toLocaleString('id-ID')}/pcs)` : ''}
                </option>
              ))}
            </Select>

            <Select
              label="Metode Pond & Potong"
              value={selectedCutting}
              onChange={(e) => setSelectedCutting(e.target.value)}
              placeholder="Standar Die-Cut"
            >
              {cuttings.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.extra_price > 0 ? `(+Rp ${Number(c.extra_price).toLocaleString('id-ID')}/pcs)` : ''}
                </option>
              ))}
            </Select>
          </div>

          {/* Custom Dimensions */}
          <div className="bg-[#F0F6FB] p-5 rounded-[24px] space-y-3">
            <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider">
              Dimensi Kemasan (Panjang x Lebar x Tinggi dlm Centimeter)
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Panjang (cm)"
                type="number"
                step="0.1"
                required
                value={customLength}
                onChange={(e) => setCustomLength(e.target.value)}
              />
              <Input
                label="Lebar (cm)"
                type="number"
                step="0.1"
                required
                value={customWidth}
                onChange={(e) => setCustomWidth(e.target.value)}
              />
              <Input
                label="Tinggi (cm)"
                type="number"
                step="0.1"
                required
                value={customHeight}
                onChange={(e) => setCustomHeight(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={`Jumlah Pesanan Box (Minimal ${currentProd?.min_order || 1} pcs)`}
              type="number"
              required
              min={currentProd?.min_order || 1}
              step={50}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              helperText={
                discount > 0
                  ? `Diskon kuantitas ${discount * 100}% otomatis aktif!`
                  : 'Pesan minimal 1.000 pcs untuk potongan diskon.'
              }
            />

            <div>
              <label className="block text-xs font-bold text-[#004582] uppercase tracking-wide mb-1.5">
                Upload File Logo / Referensi Desain
              </label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.ai,.psd,.zip"
                onChange={(e) => setDesignFile(e.target.files[0] || null)}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-[16px] file:border-0 file:text-xs file:font-bold file:bg-[#F0F6FB] file:text-[#004582] hover:file:bg-[#DE0E86] hover:file:text-white file:transition-all cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Format: PDF, AI, PSD, PNG transparan, atau ZIP. Maks 25 MB.
              </p>
            </div>
          </div>

          <Textarea
            label="Catatan Khusus Desain / Instruksi Cetak"
            rows={3}
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            placeholder="Tuliskan warna dominan, penempatan logo, teks tagline, atau petunjuk khusus layout..."
          />
        </Card>

        {/* Section 3: Ringkasan Biaya & Submit */}
        <Card padding="p-6 md:p-8" className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <FileText className="w-5 h-5 text-[#DE0E86]" />
            <h2 className="text-lg font-bold text-[#004582]">3. Ringkasan & Total Pembayaran</h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm font-medium text-slate-600">
            <div className="flex justify-between">
              <span>Produk Kemasan:</span>
              <span className="font-bold text-[#004582]">{currentProd?.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Bahan Kertas:</span>
              <span className="font-bold text-[#004582]">{currentMat?.name || 'Standard'}</span>
            </div>
            <div className="flex justify-between">
              <span>Laminasi / Finishing:</span>
              <span className="font-bold text-[#004582]">{currentFin?.name || 'Tanpa Finishing'}</span>
            </div>
            <div className="flex justify-between">
              <span>Jumlah Pesanan:</span>
              <span className="font-bold text-[#004582]">{quantity} pcs</span>
            </div>
            <div className="flex justify-between">
              <span>Estimasi Harga Satuan:</span>
              <span className="font-bold text-[#004582]">Rp {unitPrice.toLocaleString('id-ID')} /pcs</span>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-base sm:text-lg">
              <span className="font-extrabold text-[#004582]">Total Pembayaran:</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#DE0E86]">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
            icon={QrCode}
          >
            Buat Pesanan & Bayar QRIS Instan
          </Button>
        </Card>
      </form>

      {/* QRIS Payment Modal */}
      <Modal
        isOpen={qrisModalOpen}
        onClose={() => setQrisModalOpen(false)}
        title="Pembayaran QRIS Kalebox"
        subtitle={`Nomor Pesanan: ${createdOrder?.order_number || '-'}`}
        maxWidth="max-w-md"
      >
        <div className="space-y-5 text-center">
          {/* 5-minute countdown alert */}
          <div className="bg-amber-50 text-amber-900 p-3 rounded-[20px] text-xs font-bold flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>Selesaikan pembayaran dalam {formatTimer(timeLeft)}</span>
          </div>

          {/* Amount */}
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase">Total Tagihan</p>
            <p className="text-3xl font-extrabold text-[#DE0E86] mt-0.5">
              Rp {Number(createdOrder?.total_amount || grandTotal).toLocaleString('id-ID')}
            </p>
          </div>

          {/* QRIS Image */}
          <div className="bg-white p-4 rounded-[24px] shadow-sm inline-block border border-slate-100 mx-auto">
            <img
              src={activeQris?.qr_image || '/storage/qris/sample_qris.webp'}
              alt="QRIS Kalebox"
              className="w-60 h-60 object-contain mx-auto"
              onError={(e) => {
                e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KALEBOX_PAYMENT_SAMPLE';
              }}
            />
            <p className="text-[11px] font-bold text-[#004582] mt-2 uppercase tracking-wide">
              {activeQris?.account_name || 'KALEBOX PERCETAKAN MANDIRI'}
            </p>
          </div>

          {/* Proof upload section */}
          <div className="bg-[#F0F6FB] p-4 rounded-[24px] text-left space-y-2">
            <label className="block text-xs font-bold text-[#004582] uppercase">
              Upload Bukti Transfer (Screenshot/Foto)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setPaymentProofFile(e.target.files[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-[14px] file:border-0 file:text-xs file:font-bold file:bg-[#004582] file:text-white cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="primary"
              className="w-full"
              isLoading={isUploadingProof}
              disabled={!paymentProofFile}
              onClick={handleUploadPaymentProof}
              icon={Upload}
            >
              Saya Sudah Bayar (Kirim Bukti)
            </Button>
            <Button
              variant="light"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setQrisModalOpen(false);
                navigate(`/pesanan/${createdOrder.tracking_token}`);
              }}
            >
              Unggah Bukti Nanti di Halaman Lacak
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OrderFormPage;
