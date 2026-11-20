import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Table, Pagination } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { openPdfDocument } from '../../utils/pdfDownloader';
import {
  ShoppingBag,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Palette,
  Printer,
  PackageCheck,
  FileDown,
  ExternalLink,
  MessageCircle,
  Eye,
  UserCheck,
  Upload,
  AlertTriangle,
  Kanban,
  List,
  Copy,
  Check,
  Share2,
  Play,
  RotateCcw,
  Send,
} from 'lucide-react';

export const OrdersPage = () => {
  const [searchParams] = useSearchParams();
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [page, setPage] = useState(1);

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Share Modal state after creating order
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [newlyCreatedOrder, setNewlyCreatedOrder] = useState(null);

  // Naik Cetak (Vendor) Modal state
  const [vendors, setVendors] = useState([]);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [vendorPrintNotes, setVendorPrintNotes] = useState('');
  const [isSubmittingPrint, setIsSubmittingPrint] = useState(false);

  // Teruskan Catatan Revisi ke Desainer Modal state
  const [forwardRevisionModalOpen, setForwardRevisionModalOpen] = useState(false);
  const [forwardRevisionNotes, setForwardRevisionNotes] = useState('');
  const [isSubmittingForwardRevision, setIsSubmittingForwardRevision] = useState(false);

  const copyTrackingLink = (token) => {
    if (!token) return;
    const url = `${window.location.origin}/pesanan/${token}`;
    navigator.clipboard.writeText(url);
    addToast('Tautan pelacak pesanan berhasil disalin ke clipboard!', 'success');
  };

  // Assign Team Modal state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [designers, setDesigners] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [selectedDesignerId, setSelectedDesignerId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isHighPriority, setIsHighPriority] = useState(false);
  const [isSubmittingAssign, setIsSubmittingAssign] = useState(false);

  // Submit Design Modal state
  const [designModalOpen, setDesignModalOpen] = useState(false);
  const [designPreviewFile, setDesignPreviewFile] = useState(null);
  const [designSourceFile, setDesignSourceFile] = useState(null);
  const [designNotes, setDesignNotes] = useState('');
  const [isSubmittingDesign, setIsSubmittingDesign] = useState(false);

  // Create Manual Order Modal state
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [finishings, setFinishings] = useState([]);
  const [cuttings, setCuttings] = useState([]);
  const [newOrderForm, setNewOrderForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    company_name: '',
    shipping_address: '',
    product_id: '',
    material_id: '',
    finishing_id: '',
    cutting_id: '',
    custom_length_cm: '',
    custom_width_cm: '',
    custom_height_cm: '',
    quantity: 500,
    design_notes: '',
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      let url = `/orders?page=${page}&per_page=20`;
      if (selectedStatus) url += `&status=${encodeURIComponent(selectedStatus)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await api.get(url);
      if (res.data?.status === 'success') {
        const orderData = res.data.data;
        setOrders(orderData.data || []);
        setMeta({
          current_page: orderData.current_page || 1,
          last_page: orderData.last_page || 1,
          total: orderData.total || 0,
        });

        // Check if query param ?id=xx exists to auto open modal
        const paramId = searchParams.get('id');
        if (paramId) {
          const match = (orderData.data || []).find((o) => o.id === Number(paramId));
          if (match) {
            setSelectedOrder(match);
            setDetailModalOpen(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees?per_page=100');
      if (res.data?.status === 'success') {
        const emps = res.data.data?.data || res.data.data || [];
        setDesigners(emps.filter((e) => e.role?.name === 'Desain' || e.user?.role?.name === 'Desain'));
        setStaffs(emps.filter((e) => e.role?.name === 'Staff' || e.user?.role?.name === 'Staff'));
      }
    } catch {
      // quiet
    }
  };

  const fetchMasters = async () => {
    try {
      const [prodRes, matRes, finRes, cutRes, venRes] = await Promise.all([
        api.get('/products?per_page=100'),
        api.get('/materials'),
        api.get('/finishings'),
        api.get('/cuttings'),
        api.get('/vendors'),
      ]);
      if (prodRes.data?.status === 'success') setProducts(prodRes.data.data?.data || []);
      if (matRes.data?.status === 'success') setMaterials(matRes.data.data || []);
      if (finRes.data?.status === 'success') setFinishings(finRes.data.data || []);
      if (cutRes.data?.status === 'success') setCuttings(cutRes.data.data || []);
      if (venRes.data?.status === 'success' || venRes.data?.data) {
        setVendors(venRes.data.data?.data || venRes.data.data || []);
      }
    } catch {
      // quiet
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchEmployees();
    fetchMasters();
  }, [page, selectedStatus, searchQuery]);

  const handleVerifyPayment = async (orderId) => {
    try {
      const res = await api.put(`/orders/${orderId}/verify-payment`);
      if (res.data?.status === 'success') {
        addToast('Pembayaran berhasil diverifikasi!', 'success');
        fetchOrders();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(res.data.data);
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memverifikasi pembayaran', 'error');
    }
  };

  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSubmittingAssign(true);
    try {
      const res = await api.put(`/orders/${selectedOrder.id}/assign`, {
        designer_id: selectedDesignerId || null,
        staff_id: selectedStaffId || null,
        deadline: deadline || null,
        is_high_priority: isHighPriority,
      });

      if (res.data?.status === 'success') {
        addToast('Penugasan tim berhasil disimpan!', 'success');
        setAssignModalOpen(false);
        fetchOrders();
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menugaskan tim', 'error');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Desainer Mulai Kerjakan Pesanan (Langkah 3)
  const handleStartWork = async (orderId) => {
    try {
      const res = await api.put(`/orders/${orderId}/start-work`);
      addToast(res.data?.message || 'Pesanan resmi masuk tahap pengerjaan desain!', 'success');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memulai pengerjaan desain', 'error');
    }
  };

  const handleSubmitDesign = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!designPreviewFile) {
      addToast('Wajib mengunggah file gambar pratinjau desain', 'warning');
      return;
    }

    setIsSubmittingDesign(true);
    try {
      const formData = new FormData();
      formData.append('preview_image', designPreviewFile);
      if (designSourceFile) formData.append('source_file', designSourceFile);
      formData.append('notes', designNotes);

      const res = await api.post(`/orders/${selectedOrder.id}/submit-design`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success') {
        addToast('Desain berhasil diunggah untuk peninjauan Admin!', 'success');
        setDesignModalOpen(false);
        setDesignPreviewFile(null);
        setDesignSourceFile(null);
        setDesignNotes('');
        fetchOrders();
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengunggah desain', 'error');
    } finally {
      setIsSubmittingDesign(false);
    }
  };

  // Admin buka modal Naik Cetak (Langkah 12)
  const handleOpenSendToPrint = (order) => {
    setSelectedOrder(order);
    setSelectedVendorId(order.vendor_id || (vendors.length > 0 ? vendors[0].id : ''));
    setVendorPrintNotes('');
    setVendorModalOpen(true);
  };

  const handleConfirmSendToPrint = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!selectedVendorId) {
      addToast('Pilih salah satu vendor percetakan.', 'error');
      return;
    }
    setIsSubmittingPrint(true);
    try {
      const res = await api.put(`/orders/${selectedOrder.id}/send-to-print`, {
        vendor_id: selectedVendorId,
        notes: vendorPrintNotes,
      });
      addToast(res.data?.message || 'Pesanan berhasil dinaikkan cetak ke vendor! Email spesifikasi terkirim.', 'success');
      setVendorModalOpen(false);
      fetchOrders();
      if (selectedOrder?.id) {
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menaikkan cetak ke vendor', 'error');
    } finally {
      setIsSubmittingPrint(false);
    }
  };

  // Admin buka modal Teruskan Catatan Revisi ke Desainer (Langkah 8)
  const handleOpenForwardRevision = (order) => {
    setSelectedOrder(order);
    setForwardRevisionNotes('');
    setForwardRevisionModalOpen(true);
  };

  const handleConfirmForwardRevision = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setIsSubmittingForwardRevision(true);
    try {
      const res = await api.put(`/orders/${selectedOrder.id}/forward-revision`, {
        notes: forwardRevisionNotes,
      });
      addToast(res.data?.message || 'Catatan revisi berhasil diteruskan ke Desainer bertugas!', 'success');
      setForwardRevisionModalOpen(false);
      fetchOrders();
      if (selectedOrder?.id) {
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal meneruskan revisi ke desainer', 'error');
    } finally {
      setIsSubmittingForwardRevision(false);
    }
  };

  // Admin bagikan link review desain ke klien via WhatsApp (Langkah 5 & 10)
  const handleSendDesignToClient = async (order) => {
    try {
      const res = await api.put(`/orders/${order.id}/send-to-client`);
      copyTrackingLink(order.tracking_token);
      addToast(res.data?.message || 'Tautan review desain berhasil disiapkan dan disalin!', 'success');
      fetchOrders();
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(res.data.data);
      }
      const clientPhone = order.client?.phone || order.customer_phone;
      if (clientPhone) {
        const cleanPhone = clientPhone.replace(/^0/, '62');
        const text = encodeURIComponent(
          `Halo Kak ${order.client?.name || order.customer_name}, pratinjau desain pesanan kemasan #${order.order_number} Anda telah siap ditinjau! Silakan buka tautan berikut untuk memeriksa desain dan memberikan persetujuan (Oke/ACC) atau mengajukan revisian: ${window.location.origin}/pesanan/${order.tracking_token}`
        );
        window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyiapkan pengiriman review ke klien', 'error');
    }
  };

  // Cetakan Sudah Siap (Langkah 13 & 14)
  const handleMarkReady = async (orderId) => {
    try {
      const res = await api.put(`/orders/${orderId}/mark-ready`);
      addToast(res.data?.message || 'Pesanan ditandai siap diambil atau dikirim! Tim Staff Produksi telah dinotifikasi.', 'success');
      fetchOrders();
      if (selectedOrder?.id === orderId) setSelectedOrder(res.data.data);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengubah status', 'error');
    }
  };

  const handleCreateInternalOrder = async (e) => {
    e.preventDefault();
    setIsCreatingOrder(true);
    try {
      const res = await api.post('/orders/internal', newOrderForm);
      if (res.data?.status === 'success' || res.data?.success) {
        addToast('Pesanan baru berhasil dicatat!', 'success');
        const created = res.data.data?.order || res.data.data;
        setNewlyCreatedOrder(created);
        setCreateOrderModalOpen(false);
        setShareModalOpen(true);
        setNewOrderForm({
          client_name: '',
          client_phone: '',
          client_email: '',
          company_name: '',
          shipping_address: '',
          product_id: '',
          material_id: '',
          finishing_id: '',
          cutting_id: '',
          custom_length_cm: '',
          custom_width_cm: '',
          custom_height_cm: '',
          quantity: 500,
          design_notes: '',
        });
        fetchOrders();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal membuat pesanan', 'error');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const orderStatuses = [
    { key: '', label: 'Semua Status' },
    { key: 'Pesanan Telah Masuk', label: 'Pesanan Masuk' },
    { key: 'Pesanan Diterima', label: 'Diterima' },
    { key: 'Pesanan Diproses', label: 'Proses Desain' },
    { key: 'Pesanan Sedang Revisi', label: 'Revisi' },
    { key: 'Pesanan Sedang Dicetak', label: 'Dicetak' },
    { key: 'Pesanan Siap Diambil/Dikirim', label: 'Siap' },
  ];

  return (
    <div className="space-y-6 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Operasional Produksi</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Manajemen Pesanan Kemasan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Pantau alur dari verifikasi pembayaran, penugasan desainer, ACC pratinjau, cetak offset, hingga pengiriman.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="bg-[#F0F6FB] p-1 rounded-[16px] flex items-center">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-[12px] transition-all ${
                viewMode === 'list' ? 'bg-white text-[#DE0E86] shadow-sm' : 'text-slate-400'
              }`}
              title="Tampilan Tabel"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-[12px] transition-all ${
                viewMode === 'kanban' ? 'bg-white text-[#DE0E86] shadow-sm' : 'text-slate-400'
              }`}
              title="Tampilan Kanban Board"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>

          {['owner', 'manager', 'admin'].includes(role) && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateOrderModalOpen(true)}
              icon={Plus}
            >
              Catat Pesanan Manual
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="p-5" className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Cari nomor pesanan, klien, atau produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>

          {/* Status pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            {orderStatuses.map((stg) => (
              <button
                key={stg.key}
                onClick={() => setSelectedStatus(stg.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  selectedStatus === stg.key
                    ? 'bg-[#004582] text-white shadow-sm'
                    : 'bg-[#F0F6FB] text-[#004582] hover:bg-[#E2EDF7]'
                }`}
              >
                {stg.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main View: List or Kanban */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton height="h-20" rounded="rounded-[32px]" />
          <Skeleton height="h-20" rounded="rounded-[32px]" />
          <Skeleton height="h-20" rounded="rounded-[32px]" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Tidak Ada Pesanan Ditemukan"
          description="Belum ada pesanan yang sesuai dengan kriteria filter atau pencarian Anda."
        />
      ) : viewMode === 'list' ? (
        <Card padding="p-6 md:p-8" className="space-y-4">
          <Table
            headers={[
              'No. Pesanan',
              'Nama Klien / Brand',
              'Produk & Spek',
              'Jumlah',
              'Total Biaya',
              'Status',
              'Desainer / Staff',
              'Aksi',
            ]}
          >
            {orders.map((ord) => (
              <tr key={ord.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                <td className="py-4 px-6 font-bold text-[#004582]">
                  <div>
                    <span>{ord.order_number}</span>
                    {ord.is_high_priority && (
                      <span className="block text-[10px] font-extrabold text-rose-600 uppercase">Prioritas</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <p className="font-bold text-[#004582]">{ord.client?.name || '-'}</p>
                  <p className="text-[11px] text-slate-400">{ord.client?.company_name || ord.client?.phone}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="font-bold text-[#004582]">{ord.product?.name || '-'}</p>
                  <p className="text-[11px] text-slate-500">
                    {ord.custom_length_cm}x{ord.custom_width_cm}x{ord.custom_height_cm} cm
                  </p>
                </td>
                <td className="py-4 px-6 font-bold text-[#004582]">{ord.quantity} pcs</td>
                <td className="py-4 px-6 font-extrabold text-[#DE0E86]">
                  Rp {Number(ord.total_amount).toLocaleString('id-ID')}
                </td>
                <td className="py-4 px-6">
                  <Badge
                    variant={
                      ord.status === 'Pesanan Siap Diambil/Dikirim'
                        ? 'success'
                        : ord.status === 'Pesanan Sedang Revisi'
                        ? 'primary'
                        : ord.status === 'Pesanan Telah Masuk'
                        ? 'warning'
                        : 'secondary'
                    }
                    size="sm"
                  >
                    {ord.status}
                  </Badge>
                </td>
                <td className="py-4 px-6 text-xs text-slate-500">
                  <p>Desain: <span className="font-semibold text-[#004582]">{ord.designer?.name || '-'}</span></p>
                  <p>Staff: <span className="font-semibold text-[#004582]">{ord.staff?.name || '-'}</span></p>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedOrder(ord);
                        setDetailModalOpen(true);
                      }}
                      className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all font-bold text-xs inline-flex items-center gap-1"
                      title="Lihat Detail Pesanan"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>

                    {/* Desainer: Mulai Kerjakan */}
                    {ord.status === 'Pesanan Diterima' && (role === 'design' || ['owner', 'manager', 'admin'].includes(role)) && (
                      <button
                        onClick={() => handleStartWork(ord.id)}
                        className="p-2 rounded-[12px] bg-blue-50 text-[#004582] hover:bg-[#004582] hover:text-white transition-all font-bold text-xs inline-flex items-center gap-1"
                        title="Mulai Kerjakan Desain"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Mulai</span>
                      </button>
                    )}

                    {/* Desainer: Ajukan Desain */}
                    {(ord.status === 'Pesanan Diproses' || ord.status === 'Pesanan Sedang Revisi') && (role === 'design' || ['owner', 'manager', 'admin'].includes(role)) && (
                      <button
                        onClick={() => {
                          setSelectedOrder(ord);
                          setDesignModalOpen(true);
                        }}
                        className="p-2 rounded-[12px] bg-pink-50 text-[#DE0E86] hover:bg-[#DE0E86] hover:text-white transition-all font-bold text-xs inline-flex items-center gap-1"
                        title="Upload Hasil Desain"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Desain</span>
                      </button>
                    )}

                    {/* Admin: Teruskan Revisi */}
                    {ord.status === 'Pesanan Sedang Revisi' && ['owner', 'manager', 'admin'].includes(role) && (
                      <button
                        onClick={() => handleOpenForwardRevision(ord)}
                        className="p-2 rounded-[12px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all font-bold text-xs inline-flex items-center gap-1"
                        title="Teruskan Revisi ke Desainer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Revisi</span>
                      </button>
                    )}

                    {/* Admin / Staff: Tandai Cetakan Selesai */}
                    {ord.status === 'Pesanan Sedang Dicetak' && ['owner', 'manager', 'admin', 'staff'].includes(role) && (
                      <button
                        onClick={() => handleMarkReady(ord.id)}
                        className="p-2 rounded-[12px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all font-bold text-xs inline-flex items-center gap-1"
                        title="Tandai Cetakan Selesai"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">Siap</span>
                      </button>
                    )}

                    <button
                      onClick={() => copyTrackingLink(ord.tracking_token)}
                      className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#004582] hover:text-white transition-all font-bold text-xs inline-flex items-center gap-1"
                      title="Salin Tautan Pelacak Klien"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="hidden xl:inline">Link</span>
                    </button>

                    {(ord.client?.phone || ord.customer_phone) && (
                      <a
                        href={`https://wa.me/${(ord.client?.phone || ord.customer_phone).replace(/^0/, '62')}?text=${encodeURIComponent(
                          `Halo Kak ${ord.client?.name || ord.customer_name}, pesanan kemasan box Anda (${ord.order_number}) berada pada status: ${ord.status}. Pantau progres dan review desain di tautan resmi: ${window.location.origin}/pesanan/${ord.tracking_token}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-[12px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all font-bold text-xs inline-flex items-center gap-1"
                        title="Kirim Link ke WhatsApp Klien"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="hidden xl:inline">WA</span>
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </Table>

          <Pagination
            currentPage={meta.current_page}
            lastPage={meta.last_page}
            onPageChange={(p) => setPage(p)}
          />
        </Card>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {orderStatuses.filter((s) => s.key !== '').map((stg) => {
            const columnOrders = orders.filter((o) => o.status === stg.key);
            return (
              <div key={stg.key} className="bg-[#F0F6FB]/80 p-3 rounded-[24px] space-y-3 min-w-[240px]">
                <div className="flex items-center justify-between px-2 pt-1">
                  <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wide truncate">
                    {stg.label}
                  </h4>
                  <Badge variant="secondary" size="sm">{columnOrders.length}</Badge>
                </div>

                <div className="space-y-3">
                  {columnOrders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setSelectedOrder(ord);
                        setDetailModalOpen(true);
                      }}
                      className="bg-white p-4 rounded-[20px] shadow-sm hover:shadow-card cursor-pointer transition-all duration-200 text-left space-y-2.5 border border-transparent"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-extrabold text-[#004582]">{ord.order_number}</span>
                        {ord.is_high_priority && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                            Prioritas
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-700 truncate">{ord.client?.name || ord.customer_name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{ord.product?.name} ({ord.quantity} pcs)</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <p className="text-xs font-extrabold text-[#DE0E86]">
                          Rp {Number(ord.total_amount || ord.total_price || 0).toLocaleString('id-ID')}
                        </p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyTrackingLink(ord.tracking_token);
                            }}
                            className="p-1 rounded-[8px] bg-[#F0F6FB] text-[#004582] hover:bg-[#004582] hover:text-white transition-all"
                            title="Salin Tautan Klien"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          {(ord.client?.phone || ord.customer_phone) && (
                            <a
                              href={`https://wa.me/${(ord.client?.phone || ord.customer_phone).replace(/^0/, '62')}?text=${encodeURIComponent(
                                `Halo Kak ${ord.client?.name || ord.customer_name}, berikut tautan pemantauan pesanan #${ord.order_number}: ${window.location.origin}/pesanan/${ord.tracking_token}`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded-[8px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all"
                              title="Kirim ke WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (() => {
        const activeRevision = selectedOrder.revisions?.slice().reverse().find(r => r.status === 'menunggu_admin' || r.status === 'menunggu_tindakan');
        const latestDesign = selectedOrder.designs?.slice().sort((a, b) => b.version_number - a.version_number)[0];
        const isDesignApproved = latestDesign?.status === 'disetujui' || latestDesign?.is_approved;
        const isDesignSubmittedToAdmin = latestDesign?.status === 'diajukan_ke_admin';

        return (
          <Modal
            isOpen={detailModalOpen}
            onClose={() => setDetailModalOpen(false)}
            title={`Detail Pesanan: ${selectedOrder.order_number}`}
            subtitle={`Status: ${selectedOrder.status} • Klien: ${selectedOrder.client?.name || selectedOrder.customer_name}`}
            maxWidth="max-w-3xl"
          >
            <div className="space-y-6 text-left">
              {/* Active Revision Banner */}
              {activeRevision && (
                <div className="p-4 rounded-[20px] bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" /> Permintaan Revisi Desain dari Klien
                    </span>
                    {['owner', 'manager', 'admin'].includes(role) && (
                      <Button variant="danger" size="sm" icon={Send} onClick={() => handleOpenForwardRevision(selectedOrder)}>
                        Teruskan Revisi ke Desainer
                      </Button>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-rose-900 bg-white/70 p-3 rounded-[12px] border border-rose-100">
                    "{activeRevision.revision_notes || activeRevision.notes}"
                  </p>
                </div>
              )}

              {/* Submitted Design Banner */}
              {isDesignSubmittedToAdmin && (
                <div className="p-4 rounded-[20px] bg-sky-50 border border-sky-200 text-sky-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-[#004582] flex items-center gap-1.5">
                      <Share2 className="w-4 h-4" /> Desain Versi #{latestDesign?.version_number} Siap Ditinjau Klien
                    </span>
                    {['owner', 'manager', 'admin'].includes(role) && (
                      <Button variant="primary" size="sm" icon={MessageCircle} onClick={() => handleSendDesignToClient(selectedOrder)}>
                        Kirim Link Review ke Klien (WA)
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-sky-700">
                    Desainer telah mengajukan desain terbaru. Bagikan tautan ke klien via WhatsApp agar klien dapat memberikan persetujuan (Oke/ACC) atau mengajukan catatan revisi.
                  </p>
                </div>
              )}

              {/* Approved Design Ready to Print Banner */}
              {isDesignApproved && selectedOrder.status !== 'Pesanan Sedang Dicetak' && selectedOrder.status !== 'Pesanan Siap Diambil/Dikirim' && (
                <div className="p-4 rounded-[20px] bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Desain Resmi Di-ACC Klien (Oke)
                    </span>
                    {['owner', 'manager', 'admin'].includes(role) && (
                      <Button variant="success" size="sm" icon={Printer} onClick={() => handleOpenSendToPrint(selectedOrder)}>
                        Naik Cetak (Pilih Vendor)
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-emerald-700">
                    Klien telah menyetujui hasil desain kemasan. Silakan pilih vendor percetakan offset dari data vendor untuk menaikkan pesanan ke antrean cetak dan sistem otomatis mengirim email resmi ke vendor.
                  </p>
                </div>
              )}

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-3 p-4 bg-[#F0F6FB] rounded-[24px]">
                {/* Payment verification action */}
                {selectedOrder.status === 'Pesanan Telah Masuk' && ['owner', 'manager', 'admin'].includes(role) && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleVerifyPayment(selectedOrder.id)}
                    icon={CheckCircle2}
                  >
                    Verifikasi Pembayaran
                  </Button>
                )}

                {/* Assign team action */}
                {['owner', 'manager', 'admin'].includes(role) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedDesignerId(selectedOrder.designer_id || '');
                      setSelectedStaffId(selectedOrder.staff_id || '');
                      setDeadline(selectedOrder.deadline ? selectedOrder.deadline.substring(0, 16) : '');
                      setIsHighPriority(!!selectedOrder.is_high_priority);
                      setAssignModalOpen(true);
                    }}
                    icon={UserCheck}
                  >
                    Tugaskan Tim & Deadline
                  </Button>
                )}

                {/* Designer: Mulai Kerjakan */}
                {selectedOrder.status === 'Pesanan Diterima' && (role === 'design' || ['owner', 'manager', 'admin'].includes(role)) && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStartWork(selectedOrder.id)}
                    icon={Play}
                  >
                    Mulai Kerjakan Desain
                  </Button>
                )}

                {/* Designer submit layout */}
                {['owner', 'manager', 'design', 'admin'].includes(role) && (selectedOrder.status === 'Pesanan Diproses' || selectedOrder.status === 'Pesanan Sedang Revisi') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setDesignModalOpen(true)}
                    icon={Upload}
                  >
                    Upload Desain Pratinjau
                  </Button>
                )}

                {/* Send to print */}
                {['owner', 'manager', 'admin'].includes(role) && (isDesignApproved || selectedOrder.status === 'Pesanan Diproses') && selectedOrder.status !== 'Pesanan Sedang Dicetak' && selectedOrder.status !== 'Pesanan Siap Diambil/Dikirim' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenSendToPrint(selectedOrder)}
                    icon={Printer}
                  >
                    Naik Cetak (Pilih Vendor)
                  </Button>
                )}

                {/* Mark Ready */}
                {['owner', 'manager', 'admin', 'staff'].includes(role) && selectedOrder.status === 'Pesanan Sedang Dicetak' && (
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleMarkReady(selectedOrder.id)}
                    icon={PackageCheck}
                  >
                    Cetakan Sudah Siap
                  </Button>
                )}

              {/* PDF Downloads */}
              <Button
                variant="light"
                size="sm"
                icon={FileDown}
                onClick={() => {
                  openPdfDocument(`/orders/${selectedOrder.id}/invoice-pdf`, `invoice_${selectedOrder.order_number}`);
                }}
              >
                Invoice PDF
              </Button>

              <Button
                variant="light"
                size="sm"
                icon={FileDown}
                onClick={() => {
                  openPdfDocument(`/orders/${selectedOrder.id}/spk-pdf`, `spk_${selectedOrder.order_number}`);
                }}
              >
                SPK Produksi PDF
              </Button>

              {/* Copy Tracking Link */}
              <Button
                variant="light"
                size="sm"
                icon={Copy}
                onClick={() => copyTrackingLink(selectedOrder.tracking_token)}
              >
                Salin Link Klien
              </Button>

              {/* WhatsApp Share */}
              {(selectedOrder.client?.phone || selectedOrder.customer_phone) && (
                <a
                  href={`https://wa.me/${(selectedOrder.client?.phone || selectedOrder.customer_phone).replace(/^0/, '62')}?text=${encodeURIComponent(
                    `Halo Kak ${selectedOrder.client?.name || selectedOrder.customer_name}, pesanan kemasan box Anda (${selectedOrder.order_number}) saat ini berada pada status: ${selectedOrder.status}. Pantau pratinjau desain dan progres di tautan resmi: ${window.location.origin}/pesanan/${selectedOrder.tracking_token}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="light" size="sm" icon={MessageCircle}>
                    WhatsApp Klien
                  </Button>
                </a>
              )}
            </div>

            {/* Dedicated Client Tracking & Design Review Link Banner */}
            <div className="bg-[#F0F6FB] p-5 rounded-[24px] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[12px] bg-[#004582] text-white flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider">
                      Tautan Publik Pelacak & Review Desain Klien
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Bagikan link ini ke klien untuk pemantauan progres dan persetujuan (ACC) atau pengajuan revisi desain tanpa perlu login.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => copyTrackingLink(selectedOrder.tracking_token)}
                    icon={Copy}
                  >
                    Salin Tautan
                  </Button>

                  {(selectedOrder.client?.phone || selectedOrder.customer_phone) && (
                    <a
                      href={`https://wa.me/${(selectedOrder.client?.phone || selectedOrder.customer_phone).replace(/^0/, '62')}?text=${encodeURIComponent(
                        `Halo Kak ${selectedOrder.client?.name || selectedOrder.customer_name}, berikut tautan resmi pemantauan pesanan #${selectedOrder.order_number} dan review desain Anda: ${window.location.origin}/pesanan/${selectedOrder.tracking_token}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="secondary" size="sm" icon={MessageCircle}>
                        Kirim WA
                      </Button>
                    </a>
                  )}

                  <a
                    href={`/pesanan/${selectedOrder.tracking_token}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="light" size="sm" icon={ExternalLink}>
                      Buka
                    </Button>
                  </a>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-[16px] text-xs font-mono text-[#004582] select-all break-all">
                {window.location.origin}/pesanan/{selectedOrder.tracking_token}
              </div>
            </div>

            {/* Specifications & Client Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#F0F6FB] p-5 rounded-[24px] space-y-2 text-xs">
                <h4 className="font-bold text-[#004582] uppercase tracking-wider pb-1 border-b border-slate-200">
                  Spesifikasi Kemasan
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <p><strong>Model Box:</strong> {selectedOrder.product?.name}</p>
                  <p><strong>Ukuran:</strong> {selectedOrder.custom_length_cm} x {selectedOrder.custom_width_cm} x {selectedOrder.custom_height_cm} cm</p>
                  <p><strong>Kertas:</strong> {selectedOrder.material?.name || '-'}</p>
                  <p><strong>Finishing:</strong> {selectedOrder.finishing?.name || 'Tanpa Finishing'}</p>
                  <p><strong>Cutting:</strong> {selectedOrder.cutting?.name || 'Standard'}</p>
                  <p><strong>Jumlah:</strong> {selectedOrder.quantity} pcs</p>
                  <p className="text-sm font-extrabold text-[#DE0E86] pt-1">
                    Total: Rp {Number(selectedOrder.total_amount).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="bg-[#F0F6FB] p-5 rounded-[24px] space-y-2 text-xs">
                <h4 className="font-bold text-[#004582] uppercase tracking-wider pb-1 border-b border-slate-200">
                  Data Klien & Pengiriman
                </h4>
                <div className="space-y-1.5 text-slate-700">
                  <p><strong>Nama:</strong> {selectedOrder.client?.name || selectedOrder.customer_name}</p>
                  <p><strong>WhatsApp:</strong> {selectedOrder.client?.phone || selectedOrder.customer_phone}</p>
                  <p><strong>Email:</strong> {selectedOrder.client?.email || selectedOrder.customer_email || '-'}</p>
                  <p><strong>Brand / Usaha:</strong> {selectedOrder.client?.company_name || '-'}</p>
                  <p><strong>Alamat:</strong> {selectedOrder.shipping_address || 'Ambil langsung di pabrik'}</p>
                  <p className="pt-1">
                    <strong>Pelacak Digital:</strong>{' '}
                    <a
                      href={`/pesanan/${selectedOrder.tracking_token}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#DE0E86] font-bold underline inline-flex items-center gap-1"
                    >
                      Buka Halaman Lacak Klien <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Proof Viewer (if exists) */}
            {selectedOrder.payment_proof && (
              <div className="bg-[#F0F6FB] p-5 rounded-[24px] space-y-2 text-xs">
                <h4 className="font-bold text-[#004582] uppercase tracking-wider">
                  Bukti Transfer Pembayaran Klien
                </h4>
                <div className="max-w-xs rounded-[16px] overflow-hidden bg-white p-2 shadow-sm">
                  <img
                    src={selectedOrder.payment_proof}
                    alt="Bukti Transfer"
                    className="w-full h-auto object-cover rounded-[12px]"
                  />
                </div>
              </div>
            )}

            {/* Design Previews list */}
            {selectedOrder.designs && selectedOrder.designs.length > 0 && (
              <div className="bg-[#F0F6FB] p-5 rounded-[24px] space-y-3 text-xs">
                <h4 className="font-bold text-[#004582] uppercase tracking-wider">
                  Riwayat Desain Pratinjau
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedOrder.designs.map((des) => (
                    <div key={des.id} className="bg-white p-3 rounded-[18px] space-y-2">
                      <div className="flex justify-between items-center font-bold text-[#004582]">
                        <span>Versi #{des.version}</span>
                        {des.is_approved ? (
                          <Badge variant="success" size="sm">ACC Klien</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Review</Badge>
                        )}
                      </div>
                      {des.preview_image && (
                        <div className="aspect-video w-full rounded-[14px] overflow-hidden bg-slate-50">
                          <img src={des.preview_image} alt="Preview" className="w-full h-full object-contain" />
                        </div>
                      )}
                      {des.notes && <p className="text-slate-500">{des.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      ); })()}

      {/* Assign Team Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Tugaskan Tim & Batas Waktu"
        subtitle={`Pesanan ${selectedOrder?.order_number}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAssignTeam} className="space-y-4 text-left">
          <Select
            label="Desainer Grafis"
            value={selectedDesignerId}
            onChange={(e) => setSelectedDesignerId(e.target.value)}
            placeholder="Pilih Desainer..."
          >
            {designers.map((d) => (
              <option key={d.user_id || d.id} value={d.user_id || d.id}>
                {d.name} ({d.position?.name || 'Desain'})
              </option>
            ))}
          </Select>

          <Select
            label="Staff Produksi"
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            placeholder="Pilih Staff Produksi..."
          >
            {staffs.map((s) => (
              <option key={s.user_id || s.id} value={s.user_id || s.id}>
                {s.name} ({s.position?.name || 'Produksi'})
              </option>
            ))}
          </Select>

          <Input
            label="Batas Waktu (Deadline Desain/Cetak)"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />

          <div className="flex items-center gap-3 p-3 bg-[#F0F6FB] rounded-[18px]">
            <input
              type="checkbox"
              id="high-priority-check"
              checked={isHighPriority}
              onChange={(e) => setIsHighPriority(e.target.checked)}
              className="w-4 h-4 text-[#DE0E86] rounded"
            />
            <label htmlFor="high-priority-check" className="text-xs font-bold text-[#004582] cursor-pointer">
              Tandai Sebagai Pesanan Prioritas Tinggi (Urgent)
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmittingAssign}
          >
            Simpan Penugasan
          </Button>
        </form>
      </Modal>

      {/* Upload Design Modal */}
      <Modal
        isOpen={designModalOpen}
        onClose={() => setDesignModalOpen(false)}
        title="Upload Pratinjau Desain"
        subtitle="Klien akan menerima notifikasi pratinjau ini di pelacak pesanan"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmitDesign} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
              File Gambar Pratinjau (JPG/PNG/WebP) <span className="text-[#DE0E86]">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setDesignPreviewFile(e.target.files[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-[14px] file:border-0 file:text-xs file:font-bold file:bg-[#004582] file:text-white cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
              File Mentah / Master Desain (PDF/AI/ZIP - Opsional)
            </label>
            <input
              type="file"
              accept=".pdf,.ai,.psd,.zip"
              onChange={(e) => setDesignSourceFile(e.target.files[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-[14px] file:border-0 file:text-xs file:font-bold file:bg-[#F0F6FB] file:text-[#004582] cursor-pointer"
            />
          </div>

          <Textarea
            label="Catatan untuk Klien"
            rows={3}
            value={designNotes}
            onChange={(e) => setDesignNotes(e.target.value)}
            placeholder="Jelaskan layout, mockup 3D, atau catatan warna bleed..."
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmittingDesign}
            icon={Upload}
          >
            Kirim Pratinjau ke Klien
          </Button>
        </form>
      </Modal>

      {/* Manual Order Creation Modal */}
      <Modal
        isOpen={createOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        title="Catat Pesanan Manual (Internal)"
        subtitle="Untuk pesanan walk-in, offline, atau via WhatsApp manual"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateInternalOrder} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Klien"
              required
              value={newOrderForm.client_name}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, client_name: e.target.value })}
            />
            <Input
              label="Nomor WhatsApp"
              required
              value={newOrderForm.client_phone}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, client_phone: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              required
              value={newOrderForm.client_email}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, client_email: e.target.value })}
            />
            <Input
              label="Brand / Usaha"
              value={newOrderForm.company_name}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, company_name: e.target.value })}
            />
          </div>

          <Textarea
            label="Alamat Pengiriman"
            rows={2}
            required
            value={newOrderForm.shipping_address}
            onChange={(e) => setNewOrderForm({ ...newOrderForm, shipping_address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Model Kemasan"
              required
              value={newOrderForm.product_id}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, product_id: e.target.value })}
            >
              <option value="">Pilih Produk...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>

            <Select
              label="Bahan Baku"
              value={newOrderForm.material_id}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, material_id: e.target.value })}
            >
              <option value="">Pilih Bahan...</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.grammage} gsm)</option>
              ))}
            </Select>

            <Select
              label="Finishing"
              value={newOrderForm.finishing_id}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, finishing_id: e.target.value })}
            >
              <option value="">Tanpa Finishing</option>
              {finishings.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>

            <Input
              label="Jumlah Pesanan (pcs)"
              type="number"
              required
              value={newOrderForm.quantity}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, quantity: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 bg-[#F0F6FB] p-3 rounded-[18px]">
            <Input
              label="P (cm)"
              type="number"
              step="0.1"
              value={newOrderForm.custom_length_cm}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, custom_length_cm: e.target.value })}
            />
            <Input
              label="L (cm)"
              type="number"
              step="0.1"
              value={newOrderForm.custom_width_cm}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, custom_width_cm: e.target.value })}
            />
            <Input
              label="T (cm)"
              type="number"
              step="0.1"
              value={newOrderForm.custom_height_cm}
              onChange={(e) => setNewOrderForm({ ...newOrderForm, custom_height_cm: e.target.value })}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isCreatingOrder}
          >
            Simpan Pesanan Manual
          </Button>
        </form>
      </Modal>

      {/* Share Newly Created Order Modal */}
      {newlyCreatedOrder && (
        <Modal
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          title="Pesanan Berhasil Dicatat!"
          subtitle="Tautan pelacak pesanan siap dibagikan ke klien untuk memantau status & mereview desain"
          maxWidth="max-w-lg"
        >
          <div className="space-y-5 text-left">
            <div className="p-4 bg-[#F0F6FB] rounded-[24px] space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-[#004582] text-sm">{newlyCreatedOrder.order_number}</span>
                <Badge variant="warning" size="sm">{newlyCreatedOrder.status || 'Pesanan Telah Masuk'}</Badge>
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <p><strong>Nama Klien:</strong> {newlyCreatedOrder.customer_name || newlyCreatedOrder.client?.name}</p>
                <p><strong>WhatsApp:</strong> {newlyCreatedOrder.customer_phone || newlyCreatedOrder.client?.phone || '-'}</p>
                <p><strong>Produk:</strong> {newlyCreatedOrder.product?.name || 'Box Kemasan'} ({newlyCreatedOrder.quantity} pcs)</p>
                <p className="text-sm font-extrabold text-[#DE0E86] pt-1">
                  Total: Rp {Number(newlyCreatedOrder.total_amount || newlyCreatedOrder.total_price || 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#004582] uppercase">
                Tautan Pelacak & Review Desain Klien
              </label>
              <div className="p-3 bg-slate-50 rounded-[16px] text-xs text-slate-600 break-all select-all font-mono">
                {window.location.origin}/pesanan/{newlyCreatedOrder.tracking_token}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                className="flex-1"
                icon={Copy}
                onClick={() => copyTrackingLink(newlyCreatedOrder.tracking_token)}
              >
                Salin Link Pelacak
              </Button>

              {(newlyCreatedOrder.customer_phone || newlyCreatedOrder.client?.phone) && (
                <a
                  href={`https://wa.me/${(newlyCreatedOrder.customer_phone || newlyCreatedOrder.client?.phone).replace(/^0/, '62')}?text=${encodeURIComponent(
                    `Halo Kak ${newlyCreatedOrder.customer_name || newlyCreatedOrder.client?.name}, pesanan kemasan box Anda (${newlyCreatedOrder.order_number}) telah kami catat di Kalebox Percetakan. Pantau proses pengerjaan dan review desain Anda di tautan resmi berikut: ${window.location.origin}/pesanan/${newlyCreatedOrder.tracking_token}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1"
                >
                  <Button variant="secondary" className="w-full" icon={MessageCircle}>
                    Kirim ke WhatsApp
                  </Button>
                </a>
              )}
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setShareModalOpen(false);
                  setSelectedOrder(newlyCreatedOrder);
                  setDetailModalOpen(true);
                }}
                className="text-xs font-bold text-[#004582] hover:text-[#DE0E86] transition-colors"
              >
                Buka Rincian Pesanan Ini ↗
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Naik Cetak (Pilih Vendor) Modal */}
      <Modal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        title="Naik Cetak Pesanan ke Vendor Percetakan"
        subtitle={`Pesanan #${selectedOrder?.order_number} • Qty: ${selectedOrder?.quantity} pcs`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmSendToPrint} className="space-y-4 text-left">
          <div className="p-3 bg-[#F0F6FB] rounded-[18px] text-xs space-y-1 text-slate-700">
            <p><strong>Klien:</strong> {selectedOrder?.customer_name || selectedOrder?.client?.name}</p>
            <p><strong>Spesifikasi:</strong> {selectedOrder?.product?.name} ({selectedOrder?.custom_length_cm}x{selectedOrder?.custom_width_cm}x{selectedOrder?.custom_height_cm} cm)</p>
            <p><strong>Bahan:</strong> {selectedOrder?.material?.name || '-'} • <strong>Finishing:</strong> {selectedOrder?.finishing?.name || 'Tanpa Finishing'}</p>
          </div>

          <Select
            label="Pilih Vendor Percetakan"
            required
            value={selectedVendorId}
            onChange={(e) => setSelectedVendorId(e.target.value)}
          >
            <option value="">Pilih Vendor...</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.city ? `(${v.city})` : ''}
              </option>
            ))}
          </Select>

          <Textarea
            label="Catatan Instruksi Cetak Tambahan (Opsional)"
            rows={3}
            value={vendorPrintNotes}
            onChange={(e) => setVendorPrintNotes(e.target.value)}
            placeholder="Contoh: Perhatikan ketebalan laminasi doff, deadline kirim hari Jumat sore..."
          />

          <p className="text-[11px] text-slate-500">
            Sistem otomatis mengirimkan email resmi ke vendor terpilih berisi data spesifikasi dan tautan pratinjau desain yang telah di-ACC klien.
          </p>

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold"
            isLoading={isSubmittingPrint}
            icon={Printer}
          >
            Kirim Order & Naik Cetak
          </Button>
        </form>
      </Modal>

      {/* Teruskan Catatan Revisi ke Desainer Modal */}
      <Modal
        isOpen={forwardRevisionModalOpen}
        onClose={() => setForwardRevisionModalOpen(false)}
        title="Teruskan Catatan Revisi ke Desainer"
        subtitle={`Pesanan #${selectedOrder?.order_number} • Desainer: ${selectedOrder?.designer?.name || 'PIC Desain'}`}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleConfirmForwardRevision} className="space-y-4 text-left">
          <div className="p-3 bg-rose-50 rounded-[18px] border border-rose-200 text-xs space-y-1">
            <span className="font-extrabold text-[11px] uppercase tracking-wider text-rose-700 block">
              Catatan Revisi dari Klien:
            </span>
            <p className="font-semibold text-rose-900">
              "{selectedOrder?.revisions?.slice().reverse().find(r => r.status === 'menunggu_admin' || r.status === 'menunggu_tindakan')?.revision_notes || 'Permintaan perbaikan layout dari klien.'}"
            </p>
          </div>

          <Textarea
            label="Catatan Tambahan dari Admin (Opsional)"
            rows={3}
            value={forwardRevisionNotes}
            onChange={(e) => setForwardRevisionNotes(e.target.value)}
            placeholder="Contoh: Tolong sesuaikan warna logo dan perhatikan revisi tulisan..."
          />

          <Button
            type="submit"
            variant="danger"
            className="w-full font-bold"
            isLoading={isSubmittingForwardRevision}
            icon={Send}
          >
            Teruskan ke Desainer
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default OrdersPage;
