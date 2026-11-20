import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Skeleton } from '../../components/common/Skeleton';
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Sparkles,
  Scissors,
  Calculator,
} from 'lucide-react';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState('');
  const [materials, setMaterials] = useState([]);
  const [finishings, setFinishings] = useState([]);
  const [cuttings, setCuttings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Calculator state
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedFinishing, setSelectedFinishing] = useState('');
  const [selectedCutting, setSelectedCutting] = useState('');
  const [quantity, setQuantity] = useState(500);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, matRes, finRes, cutRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get('/materials'),
          api.get('/finishings'),
          api.get('/cuttings'),
        ]);

        if (prodRes.data?.status === 'success') {
          const prodData = prodRes.data.data;
          setProduct(prodData);
          setQuantity(prodData.min_order || 500);

          const primaryImg = prodData.images?.find((img) => img.is_primary)?.image_path || prodData.images?.[0]?.image_path;
          setActiveImage(primaryImg || '/storage/products/sample_lunch_box.webp');
        }

        if (matRes.data?.status === 'success') {
          setMaterials(matRes.data.data || []);
          if (matRes.data.data?.length > 0) {
            setSelectedMaterial(matRes.data.data[0].id);
          }
        }
        if (finRes.data?.status === 'success') {
          setFinishings(finRes.data.data || []);
        }
        if (cutRes.data?.status === 'success') {
          setCuttings(cutRes.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Price Calculation Logic
  const calculatePrice = () => {
    if (!product) return { unitPrice: 0, totalPrice: 0 };
    let base = Number(product.base_price) || 0;

    const currentMat = materials.find((m) => m.id === Number(selectedMaterial));
    if (currentMat && currentMat.price_per_unit) {
      base += Number(currentMat.price_per_unit);
    }

    const currentFin = finishings.find((f) => f.id === Number(selectedFinishing));
    if (currentFin && currentFin.extra_price) {
      base += Number(currentFin.extra_price);
    }

    const currentCut = cuttings.find((c) => c.id === Number(selectedCutting));
    if (currentCut && currentCut.extra_price) {
      base += Number(currentCut.extra_price);
    }

    // Volume discount rule: if qty >= 1000, 5% off; if >= 3000, 10% off
    let discount = 0;
    if (quantity >= 3000) discount = 0.10;
    else if (quantity >= 1000) discount = 0.05;

    const unitPrice = Math.round(base * (1 - discount));
    const totalPrice = unitPrice * (quantity || 0);

    return { unitPrice, totalPrice, discountPercent: discount * 100 };
  };

  const { unitPrice, totalPrice, discountPercent } = calculatePrice();

  const handleOrderRedirect = () => {
    const params = new URLSearchParams({
      produk_id: product.id,
      material_id: selectedMaterial,
      finishing_id: selectedFinishing,
      cutting_id: selectedCutting,
      jumlah: quantity,
    });
    navigate(`/pesan?${params.toString()}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <Skeleton height="h-8" width="w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 space-y-4">
            <Skeleton height="h-96" rounded="rounded-[32px]" />
          </div>
          <div className="lg:col-span-6 space-y-4">
            <Skeleton height="h-10" width="w-3/4" />
            <Skeleton height="h-6" width="w-1/2" />
            <Skeleton height="h-40" rounded="rounded-[24px]" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#004582]">Produk Tidak Ditemukan</h2>
        <p className="text-sm text-slate-500">Kemasan yang Anda cari mungkin telah diarsipkan atau belum aktif.</p>
        <Link to="/katalog">
          <Button variant="primary">Kembali ke Katalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 text-left">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          to="/katalog"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#004582] hover:text-[#DE0E86] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog Box
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Gallery / Images (Left) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white p-4 rounded-[32px] shadow-card">
            <div className="aspect-square w-full rounded-[24px] overflow-hidden bg-slate-50">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800&auto=format&fit=crop';
                }}
              />
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.image_path)}
                  className={`w-20 h-20 rounded-[18px] overflow-hidden bg-white p-1 shadow-sm transition-all flex-shrink-0 ${
                    activeImage === img.image_path ? 'ring-2 ring-[#DE0E86]' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_path} alt="Thumb" className="w-full h-full object-cover rounded-[14px]" />
                </button>
              ))}
            </div>
          )}

          {/* Product Badges & Guarantees */}
          <Card padding="p-6" className="space-y-3 bg-[#F0F6FB]">
            <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider">
              Jaminan Standar Percetakan Kalebox
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Bahan Food Grade Aman</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Pond & Lipatan Presisi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Simulasi Layout Digital</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Pengepakan Berlapis Anti Rusak</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Product Specs & Interactive Calculator (Right) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                {product.category?.name || 'Kemasan'}
              </Badge>
              <Badge variant="secondary" size="sm">
                Min. Order {product.min_order} pcs
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight">
              {product.name}
            </h1>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Dimensions info */}
          <div className="bg-white p-5 rounded-[24px] shadow-card grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Panjang</p>
              <p className="text-base font-extrabold text-[#004582]">{product.default_length_cm || '-'} cm</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Lebar</p>
              <p className="text-base font-extrabold text-[#004582]">{product.default_width_cm || '-'} cm</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase">Tinggi</p>
              <p className="text-base font-extrabold text-[#004582]">{product.default_height_cm || '-'} cm</p>
            </div>
          </div>

          {/* Interactive Calculator Form */}
          <Card padding="p-6 md:p-8" className="space-y-6">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <Calculator className="w-5 h-5 text-[#DE0E86]" />
              <h3 className="text-base font-extrabold text-[#004582] tracking-tight">
                Simulasi Spesifikasi & Estimasi Biaya
              </h3>
            </div>

            <div className="space-y-4">
              {/* Material selection */}
              <Select
                label="Pilihan Kertas / Bahan"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.grammage} gsm) - {m.is_food_grade ? 'Food Grade' : 'Standard'}
                  </option>
                ))}
              </Select>

              {/* Finishing selection */}
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

              {/* Cutting selection */}
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

              {/* Quantity */}
              <div>
                <Input
                  label={`Jumlah Pesanan (Minimal ${product.min_order} pcs)`}
                  type="number"
                  min={product.min_order}
                  step={50}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  helperText={
                    discountPercent > 0
                      ? `Diskon kuantitas ${discountPercent}% diterapkan otomatis!`
                      : 'Pesan 1.000+ untuk diskon 5%, atau 3.000+ untuk diskon 10%.'
                  }
                />
              </div>
            </div>

            {/* Price Calculation Output Box */}
            <div className="bg-[#F0F6FB] p-5 rounded-[24px] space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                <span>Estimasi Harga Satuan:</span>
                <span className="font-bold text-[#004582] text-sm">
                  Rp {unitPrice.toLocaleString('id-ID')} /pcs
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                <span>Total Jumlah Pesanan:</span>
                <span className="font-bold text-[#004582]">{quantity} pcs</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-[#004582] uppercase">Total Estimasi Cetak:</span>
                <span className="text-xl sm:text-2xl font-extrabold text-[#DE0E86]">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleOrderRedirect}
              icon={ShoppingBag}
            >
              Lanjutkan Pemesanan Box Ini
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
