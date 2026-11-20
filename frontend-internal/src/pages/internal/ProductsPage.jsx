import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  Package,
  Layers,
  Sparkles,
  Scissors,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

export const ProductsPage = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'categories', 'materials', 'finishings', 'cuttings'
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [finishings, setFinishings] = useState([]);
  const [cuttings, setCuttings] = useState([]);

  // Modal states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    description: '',
    default_length_cm: '',
    default_width_cm: '',
    default_height_cm: '',
    min_order: 500,
    base_price: '',
    is_active: true,
  });
  const [productImages, setProductImages] = useState([]);

  // Generic Master item modal (category, material, finishing, cutting)
  const [masterModalOpen, setMasterModalOpen] = useState(false);
  const [editingMaster, setEditingMaster] = useState(null);
  const [masterForm, setMasterForm] = useState({
    name: '',
    description: '',
    grammage: '',
    is_food_grade: true,
    price_per_unit: '',
    extra_price: '',
  });

  // Delete Confirmation
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: '',
    id: null,
    name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, matRes, finRes, cutRes] = await Promise.all([
        api.get('/products?per_page=100'),
        api.get('/product-categories'),
        api.get('/materials'),
        api.get('/finishings'),
        api.get('/cuttings'),
      ]);

      if (prodRes.data?.status === 'success') setProducts(prodRes.data.data?.data || []);
      if (catRes.data?.status === 'success') setCategories(catRes.data.data || []);
      if (matRes.data?.status === 'success') setMaterials(matRes.data.data || []);
      if (finRes.data?.status === 'success') setFinishings(finRes.data.data || []);
      if (cutRes.data?.status === 'success') setCuttings(cutRes.data.data || []);
    } catch (err) {
      console.error('Failed to load products data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Product CRUD
  const handleOpenProductModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        name: prod.name,
        category_id: prod.category_id,
        description: prod.description || '',
        default_length_cm: prod.default_length_cm || '',
        default_width_cm: prod.default_width_cm || '',
        default_height_cm: prod.default_height_cm || '',
        min_order: prod.min_order,
        base_price: prod.base_price,
        is_active: prod.is_active,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        category_id: categories[0]?.id || '',
        description: '',
        default_length_cm: '',
        default_width_cm: '',
        default_height_cm: '',
        min_order: 500,
        base_price: '',
        is_active: true,
      });
    }
    setProductImages([]);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(productForm).forEach((key) => {
        formData.append(key, productForm[key]);
      });

      if (productImages.length > 0) {
        Array.from(productImages).forEach((file) => {
          formData.append('images[]', file);
        });
      }

      if (editingProduct) {
        formData.append('_method', 'PUT');
        await api.post(`/products/${editingProduct.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addToast('Produk kemasan berhasil diperbarui', 'success');
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        addToast('Produk kemasan baru berhasil ditambahkan', 'success');
      }

      setProductModalOpen(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan produk', 'error');
    }
  };

  // Master Items CRUD
  const handleOpenMasterModal = (item = null) => {
    setEditingMaster(item);
    if (item) {
      setMasterForm({
        name: item.name || '',
        description: item.description || '',
        grammage: item.grammage || '',
        is_food_grade: item.is_food_grade ?? true,
        price_per_unit: item.price_per_unit || '',
        extra_price: item.extra_price || '',
      });
    } else {
      setMasterForm({
        name: '',
        description: '',
        grammage: '',
        is_food_grade: true,
        price_per_unit: '',
        extra_price: '',
      });
    }
    setMasterModalOpen(true);
  };

  const handleSaveMaster = async (e) => {
    e.preventDefault();
    try {
      const endpointMap = {
        categories: '/product-categories',
        materials: '/materials',
        finishings: '/finishings',
        cuttings: '/cuttings',
      };
      const endpoint = endpointMap[activeTab];

      if (editingMaster) {
        await api.put(`${endpoint}/${editingMaster.id}`, masterForm);
        addToast('Data berhasil diperbarui', 'success');
      } else {
        await api.post(endpoint, masterForm);
        addToast('Data baru berhasil ditambahkan', 'success');
      }

      setMasterModalOpen(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan data', 'error');
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const endpointMap = {
        products: '/products',
        categories: '/product-categories',
        materials: '/materials',
        finishings: '/finishings',
        cuttings: '/cuttings',
      };
      await api.delete(`${endpointMap[deleteDialog.type]}/${deleteDialog.id}`);
      addToast('Data berhasil dihapus', 'success');
      setDeleteDialog({ isOpen: false, type: '', id: null, name: '' });
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghapus data', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Katalog & Spesifikasi</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Master Produk & Material Box
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola model box, kategori, kertas food grade, laminasi finishing, dan pisau pond potong.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => {
            if (activeTab === 'products') handleOpenProductModal();
            else handleOpenMasterModal();
          }}
        >
          Tambah {activeTab === 'products' ? 'Produk Box' : 'Item Baru'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-[#F0F6FB] p-1.5 rounded-[22px] inline-flex items-center gap-1 overflow-x-auto max-w-full">
        {[
          { key: 'products', label: 'Model Box', icon: Package },
          { key: 'categories', label: 'Kategori', icon: Layers },
          { key: 'materials', label: 'Bahan Kertas', icon: Layers },
          { key: 'finishings', label: 'Finishing & Laminasi', icon: Layers },
          { key: 'cuttings', label: 'Pond & Cutting', icon: Scissors },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[16px] text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-white text-[#DE0E86] shadow-sm'
                  : 'text-[#004582] hover:text-[#DE0E86]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      <Card padding="p-6 md:p-8" className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton height="h-16" rounded="rounded-[20px]" />
            <Skeleton height="h-16" rounded="rounded-[20px]" />
          </div>
        ) : activeTab === 'products' ? (
          /* Products Table */
          <Table
            headers={[
              'Gambar',
              'Nama Produk',
              'Kategori',
              'Dimensi (P x L x T)',
              'Min. Order',
              'Harga Dasar',
              'Aksi',
            ]}
          >
            {products.map((prod) => {
              const primaryImg = prod.images?.find((img) => img.is_primary)?.image_path || prod.images?.[0]?.image_path;
              return (
                <tr key={prod.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="w-12 h-12 rounded-[14px] overflow-hidden bg-slate-100 flex items-center justify-center">
                      {primaryImg ? (
                        <img src={primaryImg} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-bold text-[#004582]">{prod.name}</td>
                  <td className="py-4 px-6">
                    <Badge variant="secondary" size="sm">{prod.category?.name || '-'}</Badge>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                    {prod.default_length_cm} x {prod.default_width_cm} x {prod.default_height_cm} cm
                  </td>
                  <td className="py-4 px-6 font-bold text-[#004582]">{prod.min_order} pcs</td>
                  <td className="py-4 px-6 font-extrabold text-[#DE0E86]">
                    Rp {Number(prod.base_price).toLocaleString('id-ID')}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenProductModal(prod)}
                        className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            type: 'products',
                            id: prod.id,
                            name: prod.name,
                          })
                        }
                        className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : activeTab === 'categories' ? (
          /* Categories Table */
          <Table headers={['Nama Kategori', 'Slug', 'Deskripsi', 'Aksi']}>
            {categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                <td className="py-4 px-6 font-bold text-[#004582]">{cat.name}</td>
                <td className="py-4 px-6 font-mono text-xs text-slate-500">{cat.slug}</td>
                <td className="py-4 px-6 text-xs text-slate-600">{cat.description || '-'}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenMasterModal(cat)}
                      className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          type: 'categories',
                          id: cat.id,
                          name: cat.name,
                        })
                      }
                      className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : activeTab === 'materials' ? (
          /* Materials Table */
          <Table headers={['Nama Kertas', 'Gramatur', 'Food Grade', 'Tambahan Harga /pcs', 'Aksi']}>
            {materials.map((mat) => (
              <tr key={mat.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                <td className="py-4 px-6 font-bold text-[#004582]">{mat.name}</td>
                <td className="py-4 px-6 text-xs font-semibold text-slate-600">{mat.grammage} gsm</td>
                <td className="py-4 px-6">
                  <Badge variant={mat.is_food_grade ? 'success' : 'secondary'} size="sm">
                    {mat.is_food_grade ? 'Ya, Food Grade' : 'Standard'}
                  </Badge>
                </td>
                <td className="py-4 px-6 font-bold text-[#DE0E86]">
                  +Rp {Number(mat.price_per_unit || 0).toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenMasterModal(mat)}
                      className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          type: 'materials',
                          id: mat.id,
                          name: mat.name,
                        })
                      }
                      className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : activeTab === 'finishings' ? (
          /* Finishings Table */
          <Table headers={['Nama Finishing', 'Biaya Tambahan /pcs', 'Deskripsi', 'Aksi']}>
            {finishings.map((fin) => (
              <tr key={fin.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                <td className="py-4 px-6 font-bold text-[#004582]">{fin.name}</td>
                <td className="py-4 px-6 font-bold text-[#DE0E86]">
                  +Rp {Number(fin.extra_price || 0).toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-6 text-xs text-slate-600">{fin.description || '-'}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenMasterModal(fin)}
                      className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          type: 'finishings',
                          id: fin.id,
                          name: fin.name,
                        })
                      }
                      className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          /* Cuttings Table */
          <Table headers={['Nama Cutting / Pond', 'Biaya Tambahan /pcs', 'Deskripsi', 'Aksi']}>
            {cuttings.map((cut) => (
              <tr key={cut.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                <td className="py-4 px-6 font-bold text-[#004582]">{cut.name}</td>
                <td className="py-4 px-6 font-bold text-[#DE0E86]">
                  +Rp {Number(cut.extra_price || 0).toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-6 text-xs text-slate-600">{cut.description || '-'}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenMasterModal(cut)}
                      className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() =>
                        setDeleteDialog({
                          isOpen: true,
                          type: 'cuttings',
                          id: cut.id,
                          name: cut.name,
                        })
                      }
                      className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {/* Product Add/Edit Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? 'Edit Produk Kemasan' : 'Tambah Produk Kemasan Baru'}
        subtitle="Formulir spesifikasi teknis dan gambar box"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Produk Box"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
            />
            <Select
              label="Kategori"
              required
              value={productForm.category_id}
              onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Deskripsi Produk"
            rows={2}
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
          />

          <div className="grid grid-cols-3 gap-3 bg-[#F0F6FB] p-3 rounded-[18px]">
            <Input
              label="P Default (cm)"
              type="number"
              step="0.1"
              value={productForm.default_length_cm}
              onChange={(e) => setProductForm({ ...productForm, default_length_cm: e.target.value })}
            />
            <Input
              label="L Default (cm)"
              type="number"
              step="0.1"
              value={productForm.default_width_cm}
              onChange={(e) => setProductForm({ ...productForm, default_width_cm: e.target.value })}
            />
            <Input
              label="T Default (cm)"
              type="number"
              step="0.1"
              value={productForm.default_height_cm}
              onChange={(e) => setProductForm({ ...productForm, default_height_cm: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Minimal Order (pcs)"
              type="number"
              required
              min={1}
              value={productForm.min_order}
              onChange={(e) => setProductForm({ ...productForm, min_order: Number(e.target.value) })}
            />
            <Input
              label="Harga Dasar /pcs (Rp)"
              type="number"
              required
              min={0}
              value={productForm.base_price}
              onChange={(e) => setProductForm({ ...productForm, base_price: Number(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
              Upload Foto Produk Box (WebP / JPG / PNG)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setProductImages(e.target.files)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-[14px] file:border-0 file:text-xs file:font-bold file:bg-[#F0F6FB] file:text-[#004582] cursor-pointer"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full">
            Simpan Produk Box
          </Button>
        </form>
      </Modal>

      {/* Master Add/Edit Modal */}
      <Modal
        isOpen={masterModalOpen}
        onClose={() => setMasterModalOpen(false)}
        title={editingMaster ? `Edit ${activeTab}` : `Tambah ${activeTab} Baru`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveMaster} className="space-y-4 text-left">
          <Input
            label="Nama Item"
            required
            value={masterForm.name}
            onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })}
          />

          {activeTab === 'materials' && (
            <>
              <Input
                label="Gramatur Kertas (gsm)"
                type="number"
                value={masterForm.grammage}
                onChange={(e) => setMasterForm({ ...masterForm, grammage: e.target.value })}
              />
              <div className="flex items-center gap-2 p-3 bg-[#F0F6FB] rounded-[16px]">
                <input
                  type="checkbox"
                  id="food-grade-check"
                  checked={masterForm.is_food_grade}
                  onChange={(e) => setMasterForm({ ...masterForm, is_food_grade: e.target.checked })}
                />
                <label htmlFor="food-grade-check" className="text-xs font-bold text-[#004582] cursor-pointer">
                  Bahan Bersertifikasi Food Grade
                </label>
              </div>
              <Input
                label="Tambahan Harga per Pcs (Rp)"
                type="number"
                value={masterForm.price_per_unit}
                onChange={(e) => setMasterForm({ ...masterForm, price_per_unit: e.target.value })}
              />
            </>
          )}

          {(activeTab === 'finishings' || activeTab === 'cuttings') && (
            <Input
              label="Biaya Tambahan per Pcs (Rp)"
              type="number"
              value={masterForm.extra_price}
              onChange={(e) => setMasterForm({ ...masterForm, extra_price: e.target.value })}
            />
          )}

          <Textarea
            label="Deskripsi / Catatan"
            rows={2}
            value={masterForm.description}
            onChange={(e) => setMasterForm({ ...masterForm, description: e.target.value })}
          />

          <Button type="submit" variant="primary" className="w-full">
            Simpan Item
          </Button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: '', id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Hapus Data Ini?"
        message={`Apakah Anda yakin ingin menghapus "${deleteDialog.name}"? Tindakan ini tidak dapat dibatalkan.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ProductsPage;
