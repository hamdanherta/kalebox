import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { Search, SlidersHorizontal, ArrowRight, Package } from 'lucide-react';

export const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('kategori') || '');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/product-categories');
        if (res.data?.status === 'success') {
          setCategories(res.data.data || []);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let url = '/products?per_page=50';
        if (selectedCategory) {
          url += `&category=${selectedCategory}`;
        }
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        const res = await api.get(url);
        if (res.data?.status === 'success') {
          let list = res.data.data?.data || [];

          // Client-side sort
          if (sortBy === 'price_asc') {
            list.sort((a, b) => Number(a.base_price) - Number(b.base_price));
          } else if (sortBy === 'price_desc') {
            list.sort((a, b) => Number(b.base_price) - Number(a.base_price));
          } else if (sortBy === 'name_asc') {
            list.sort((a, b) => a.name.localeCompare(b.name));
          } else if (sortBy === 'min_order') {
            list.sort((a, b) => a.min_order - b.min_order);
          }

          setProducts(list);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
  }, [selectedCategory, searchQuery, sortBy]);

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    if (slug) {
      setSearchParams({ kategori: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 text-left">
      {/* Page Header */}
      <div className="space-y-3">
        <Badge variant="secondary" size="md">Katalog Kemasan</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#004582] tracking-tight">
          Pilihan Model Box & Kemasan Cetak Custom
        </h1>
        <p className="text-sm text-slate-500 font-medium max-w-2xl">
          Seluruh produk dapat dikustomisasi ukuran, material kertas, jenis laminasi, dan cetak desain full-color sesuai identitas merek Anda.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-6 rounded-[32px] shadow-card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <Input
              placeholder="Cari model kemasan (contoh: lunch box, burger, corrugated)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="md:col-span-4">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              options={[
                { value: 'popular', label: 'Urutkan: Terpopuler' },
                { value: 'price_asc', label: 'Harga: Terendah ke Tertinggi' },
                { value: 'price_desc', label: 'Harga: Tertinggi ke Terendah' },
                { value: 'min_order', label: 'Minimal Order Terendah' },
                { value: 'name_asc', label: 'Nama: A - Z' },
              ]}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => handleCategorySelect('')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 select-none flex-shrink-0 ${
              selectedCategory === ''
                ? 'bg-[#004582] text-white shadow-md shadow-[#004582]/20'
                : 'bg-[#F0F6FB] text-[#004582] hover:bg-[#E2EDF7]'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 select-none flex-shrink-0 ${
                selectedCategory === cat.slug
                  ? 'bg-[#DE0E86] text-white shadow-md shadow-[#DE0E86]/20'
                  : 'bg-[#F0F6FB] text-[#004582] hover:bg-[#E2EDF7]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-[32px] p-6 shadow-card space-y-4">
              <Skeleton height="h-52" rounded="rounded-[24px]" />
              <Skeleton height="h-6" width="w-3/4" />
              <Skeleton height="h-4" width="w-full" />
              <div className="pt-2 flex justify-between">
                <Skeleton height="h-6" width="w-24" />
                <Skeleton height="h-9" width="w-28" rounded="rounded-[18px]" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Tidak Ada Produk Ditemukan"
          description="Coba ubah kata kunci pencarian atau pilih kategori lain untuk menemukan model box yang Anda butuhkan."
          actionText="Reset Pencarian"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('');
            setSearchParams({});
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((prod) => {
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

                <div className="pt-5">
                  <Link to={`/katalog/${prod.id}`}>
                    <Button variant="primary" size="sm" className="w-full" icon={ArrowRight} iconPosition="right">
                      Detail & Pesan Custom
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
