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
  Users2,
  Truck,
  QrCode,
  UserCheck,
  Plus,
  CheckCircle2,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Building2,
  Check,
} from 'lucide-react';

export const PartnersPage = () => {
  const { role } = useAuth();
  const isExecutive = ['owner', 'manager'].includes(role);
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState(isExecutive ? 'vendors' : 'clients');
  const [vendors, setVendors] = useState([]);
  const [clients, setClients] = useState([]);
  const [qrisList, setQrisList] = useState([]);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Vendor Modal State
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    print_type: '',
  });

  // Client Modal State
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientForm, setClientForm] = useState({
    name: '',
    phone: '',
    email: '',
    client_type: 'Baru',
    is_member: false,
    notes: '',
  });

  // QRIS Modal State
  const [qrisModalOpen, setQrisModalOpen] = useState(false);
  const [qrisForm, setQrisForm] = useState({
    account_name: 'KALEBOX PERCETAKAN MANDIRI',
    is_active: true,
  });
  const [qrisImageFile, setQrisImageFile] = useState(null);

  // Confirm Delete Dialog
  const [deleteDialog, setDeleteDialog] = useState({
    isOpen: false,
    type: '', // 'vendor', 'client', 'qris'
    id: null,
    title: '',
    message: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAll = async () => {
    setIsLoading(true);
    try {
      const promises = [
        api.get('/clients'),
        api.get('/members'),
      ];
      if (isExecutive) {
        promises.push(api.get('/vendors'), api.get('/qris'));
      }
      const results = await Promise.all(promises);
      const cRes = results[0];
      const mRes = results[1];
      if (cRes.data?.status === 'success' || cRes.data?.success) {
        setClients(cRes.data.data?.data || cRes.data.data || []);
      }
      if (mRes.data?.status === 'success' || mRes.data?.success) {
        setMembers(mRes.data.data?.data || mRes.data.data || []);
      }

      if (isExecutive && results.length >= 4) {
        const vRes = results[2];
        const qRes = results[3];
        if (vRes.data?.status === 'success' || vRes.data?.success) {
          setVendors(vRes.data.data?.data || vRes.data.data || []);
        }
        if (qRes.data?.status === 'success' || qRes.data?.success) {
          setQrisList(qRes.data.data?.data || qRes.data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load partners', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // --- Vendor Handlers ---
  const handleOpenVendorModal = (vendor = null) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorForm({
        name: vendor.name || '',
        phone: vendor.phone || '',
        email: vendor.email || '',
        address: vendor.address || '',
        print_type: vendor.print_type || '',
      });
    } else {
      setEditingVendor(null);
      setVendorForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        print_type: '',
      });
    }
    setVendorModalOpen(true);
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await api.put(`/vendors/${editingVendor.id}`, vendorForm);
        addToast('Data vendor berhasil diperbarui!', 'success');
      } else {
        await api.post('/vendors', vendorForm);
        addToast('Vendor baru berhasil ditambahkan!', 'success');
      }
      setVendorModalOpen(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan data vendor', 'error');
    }
  };

  // --- Client Handlers ---
  const handleOpenClientModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setClientForm({
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        client_type: client.client_type || 'Baru',
        is_member: !!client.is_member,
        notes: client.notes || '',
      });
    } else {
      setEditingClient(null);
      setClientForm({
        name: '',
        phone: '',
        email: '',
        client_type: 'Baru',
        is_member: false,
        notes: '',
      });
    }
    setClientModalOpen(true);
  };

  const handleSaveClient = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await api.put(`/clients/${editingClient.id}`, clientForm);
        addToast('Data klien berhasil diperbarui!', 'success');
      } else {
        await api.post('/clients', clientForm);
        addToast('Data klien berhasil ditambahkan!', 'success');
      }
      setClientModalOpen(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan data klien', 'error');
    }
  };

  // --- QRIS Handlers ---
  const handleSaveQris = async (e) => {
    e.preventDefault();
    if (!qrisImageFile) {
      addToast('Wajib mengunggah gambar QRIS', 'warning');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('account_name', qrisForm.account_name);
      formData.append('is_active', qrisForm.is_active ? 1 : 0);
      formData.append('qr_image', qrisImageFile);

      await api.post('/qris', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      addToast('Pengaturan QRIS berhasil diperbarui!', 'success');
      setQrisModalOpen(false);
      setQrisImageFile(null);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memperbarui QRIS', 'error');
    }
  };

  const handleSetActiveQris = async (qrisId) => {
    try {
      await api.put(`/qris/${qrisId}/active`);
      addToast('QRIS aktif berhasil diperbarui!', 'success');
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengaktifkan QRIS', 'error');
    }
  };

  // --- Delete Handlers ---
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteDialog.type === 'vendor') {
        await api.delete(`/vendors/${deleteDialog.id}`);
        addToast('Vendor berhasil dihapus!', 'success');
      } else if (deleteDialog.type === 'client') {
        await api.delete(`/clients/${deleteDialog.id}`);
        addToast('Data klien berhasil dihapus!', 'success');
      } else if (deleteDialog.type === 'qris') {
        await api.delete(`/qris/${deleteDialog.id}`);
        addToast('Data QRIS berhasil dihapus!', 'success');
      }
      setDeleteDialog({ isOpen: false, type: '', id: null, title: '', message: '' });
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghapus data', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          <Skeleton height="h-16" rounded="rounded-[20px]" />
          <Skeleton height="h-16" rounded="rounded-[20px]" />
          <Skeleton height="h-16" rounded="rounded-[20px]" />
        </div>
      );
    }

    if (activeTab === 'vendors') {
      if (vendors.length === 0) {
        return (
          <EmptyState
            icon={Truck}
            title="Belum Ada Vendor Cetak"
            description="Daftarkan vendor rekanan percetakan luar atau supplier kertas untuk pesanan skala besar."
            actionLabel={isExecutive ? 'Tambah Vendor Baru' : undefined}
            onAction={isExecutive ? () => handleOpenVendorModal() : undefined}
          />
        );
      }
      return (
        <Table headers={['Kode & Nama Vendor', 'Kontak', 'Email', 'Alamat', 'Jenis Cetak', 'Aksi']}>
          {vendors.map((v) => (
            <tr key={v.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
              <td className="py-4 px-6">
                <div className="font-bold text-[#004582] text-sm">{v.name}</div>
                <div className="text-[11px] font-semibold text-slate-400">{v.vendor_code || '-'}</div>
              </td>
              <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                {v.phone ? (
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-[#004582]" />
                    {v.phone}
                  </span>
                ) : '-'}
              </td>
              <td className="py-4 px-6 text-xs text-slate-600">
                {v.email ? (
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {v.email}
                  </span>
                ) : '-'}
              </td>
              <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">{v.address || '-'}</td>
              <td className="py-4 px-6 text-xs">
                <span className="inline-block px-2.5 py-1 bg-[#F0F6FB] rounded-full text-[#004582] font-semibold">
                  {v.print_type || 'Umum'}
                </span>
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenVendorModal(v)}
                    className="p-1.5 text-[#004582] hover:bg-[#F0F6FB] rounded-[10px] transition-colors"
                    title="Edit Vendor"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteDialog({
                      isOpen: true,
                      type: 'vendor',
                      id: v.id,
                      title: 'Hapus Vendor Rekanan',
                      message: `Apakah Anda yakin ingin menghapus data vendor "${v.name}"? Data ini tidak dapat dikembalikan.`,
                    })}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-[10px] transition-colors"
                    title="Hapus Vendor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      );
    }

    if (activeTab === 'clients') {
      if (clients.length === 0) {
        return (
          <EmptyState
            icon={Users2}
            title="Belum Ada Data Klien"
            description="Data klien akan otomatis tersimpan dari formulir pesanan website atau dicatat manual."
            actionLabel="Tambah Klien Manual"
            onAction={() => handleOpenClientModal()}
          />
        );
      }
      return (
        <Table headers={['Kode & Nama Klien', 'WhatsApp', 'Email', 'Tipe / Member', 'Catatan / Alamat', 'Pesanan', 'Aksi']}>
          {clients.map((c) => (
            <tr key={c.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
              <td className="py-4 px-6">
                <div className="font-bold text-[#004582] text-sm">{c.name}</div>
                <div className="text-[11px] font-semibold text-slate-400">{c.client_code || '-'}</div>
              </td>
              <td className="py-4 px-6 text-xs font-semibold text-[#DE0E86]">
                <a
                  href={`https://wa.me/${c.phone?.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {c.phone}
                </a>
              </td>
              <td className="py-4 px-6 text-xs text-slate-600">{c.email || '-'}</td>
              <td className="py-4 px-6 text-xs">
                <div className="flex items-center gap-1.5">
                  <Badge variant={c.client_type === 'Baru' ? 'secondary' : 'primary'} size="sm">
                    {c.client_type || 'Baru'}
                  </Badge>
                  {c.is_member && (
                    <Badge variant="success" size="sm">Member</Badge>
                  )}
                </div>
              </td>
              <td className="py-4 px-6 text-xs text-slate-500 max-w-xs truncate">{c.notes || c.address || '-'}</td>
              <td className="py-4 px-6 text-xs font-bold text-[#004582]">
                {c.orders_count !== undefined ? `${c.orders_count}x Order` : '-'}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenClientModal(c)}
                    className="p-1.5 text-[#004582] hover:bg-[#F0F6FB] rounded-[10px] transition-colors"
                    title="Edit Klien"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteDialog({
                      isOpen: true,
                      type: 'client',
                      id: c.id,
                      title: 'Hapus Data Klien',
                      message: `Apakah Anda yakin ingin menghapus data klien "${c.name}"?`,
                    })}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-[10px] transition-colors"
                    title="Hapus Klien"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      );
    }

    if (activeTab === 'qris') {
      if (qrisList.length === 0) {
        return (
          <EmptyState
            icon={QrCode}
            title="Belum Ada QRIS Toko"
            description="Unggah barcode QRIS toko Anda agar pelanggan dapat membayar langsung melalui tracking link."
            actionLabel={isExecutive ? 'Upload QRIS Baru' : undefined}
            onAction={isExecutive ? () => setQrisModalOpen(true) : undefined}
          />
        );
      }
      return (
        <Table headers={['Preview QRIS', 'Nama Akun / Merchant', 'Status Pemakaian', 'Dibuat Pada', 'Aksi']}>
          {qrisList.map((q) => (
            <tr key={q.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
              <td className="py-4 px-6">
                <div className="w-20 h-20 rounded-[14px] overflow-hidden bg-white p-1.5 shadow-sm border border-slate-100">
                  <img src={q.qr_image} alt="QRIS" className="w-full h-full object-contain" />
                </div>
              </td>
              <td className="py-4 px-6 font-bold text-[#004582] text-sm">{q.account_name}</td>
              <td className="py-4 px-6">
                <Badge variant={q.is_active ? 'success' : 'secondary'} size="sm">
                  {q.is_active ? 'Aktif Digunakan di Nota & Website' : 'Nonaktif'}
                </Badge>
              </td>
              <td className="py-4 px-6 text-xs text-slate-500">
                {new Date(q.created_at).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                  {!q.is_active && (
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Check}
                      onClick={() => handleSetActiveQris(q.id)}
                    >
                      Jadikan Aktif
                    </Button>
                  )}
                  <button
                    onClick={() => setDeleteDialog({
                      isOpen: true,
                      type: 'qris',
                      id: q.id,
                      title: 'Hapus Rekening QRIS',
                      message: `Apakah Anda yakin ingin menghapus QRIS "${q.account_name}"?`,
                    })}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-[10px] transition-colors"
                    title="Hapus QRIS"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      );
    }

    // Members Tab
    if (members.length === 0) {
      return (
        <EmptyState
          icon={UserCheck}
          title="Belum Ada Member Terdaftar"
          description="Pelanggan yang membuat akun di website dengan kode diskon khusus akan muncul di sini."
        />
      );
    }
    return (
      <Table headers={['Nama Member', 'Email', 'WhatsApp', 'Nama Usaha', 'Diskon Khusus', 'Bergabung']}>
        {members.map((m) => (
          <tr key={m.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
            <td className="py-4 px-6 font-bold text-[#004582]">{m.user?.name || '-'}</td>
            <td className="py-4 px-6 text-xs text-slate-600">{m.user?.email || '-'}</td>
            <td className="py-4 px-6 text-xs font-semibold text-[#DE0E86]">{m.user?.phone || '-'}</td>
            <td className="py-4 px-6 text-xs font-bold text-[#004582]">{m.company_name || '-'}</td>
            <td className="py-4 px-6 text-xs">
              <span className="inline-block px-2.5 py-1 bg-pink-50 text-[#DE0E86] font-bold rounded-full">
                {m.discount_percent ? `${m.discount_percent}%` : '0%'}
              </span>
            </td>
            <td className="py-4 px-6 text-xs text-slate-500">
              {new Date(m.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </td>
          </tr>
        ))}
      </Table>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Relasi Bisnis</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Kemitraan, Klien & Akun QRIS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola data vendor cetak, mitra supplier, pelanggan usaha, rekening QRIS toko, dan member terdaftar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'vendors' && isExecutive && (
            <Button variant="primary" size="md" icon={Plus} onClick={() => handleOpenVendorModal()}>
              Tambah Vendor
            </Button>
          )}
          {activeTab === 'clients' && (
            <Button variant="primary" size="md" icon={Plus} onClick={() => handleOpenClientModal()}>
              Tambah Klien Baru
            </Button>
          )}
          {activeTab === 'qris' && isExecutive && (
            <Button variant="primary" size="md" icon={Plus} onClick={() => setQrisModalOpen(true)}>
              Upload QRIS Baru
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#F0F6FB] p-1.5 rounded-[22px] inline-flex items-center gap-1 overflow-x-auto max-w-full">
        {[
          ...(isExecutive ? [{ key: 'vendors', label: 'Vendor & Supplier', icon: Truck }] : []),
          { key: 'clients', label: 'Data Klien Pemesan', icon: Users2 },
          ...(isExecutive ? [{ key: 'qris', label: 'Pengaturan QRIS', icon: QrCode }] : []),
          { key: 'members', label: 'Member Terdaftar', icon: UserCheck },
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

      {/* Card Content */}
      <Card padding="p-6 md:p-8" className="space-y-4">
        {renderTabContent()}
      </Card>

      {/* Vendor Modal (Tambah & Edit) */}
      <Modal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        title={editingVendor ? 'Edit Vendor Supplier' : 'Tambah Vendor Supplier Baru'}
        subtitle="Kelola mitra percetakan luar atau penyedia kertas"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveVendor} className="space-y-4 text-left">
          <Input
            label="Nama Vendor / Perusahaan"
            required
            value={vendorForm.name}
            onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
            placeholder="Contoh: PT Kertas Nusantara Prima"
          />
          <Input
            label="Nomor Telepon / WhatsApp Sales"
            value={vendorForm.phone}
            onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
            placeholder="Contoh: 08123456789"
          />
          <Input
            label="Email Vendor"
            type="email"
            value={vendorForm.email}
            onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
            placeholder="Contoh: vendor@kertas.com"
          />
          <Input
            label="Jenis Cetak / Layanan Unggulan"
            value={vendorForm.print_type}
            onChange={(e) => setVendorForm({ ...vendorForm, print_type: e.target.value })}
            placeholder="Contoh: Offset Cetak 4 Warna, Sablon, Foil Emas"
          />
          <Textarea
            label="Alamat Gudang / Kantor"
            rows={2}
            value={vendorForm.address}
            onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
            placeholder="Alamat lengkap lokasi pengiriman vendor..."
          />
          <Button type="submit" variant="primary" className="w-full">
            {editingVendor ? 'Perbarui Data Vendor' : 'Simpan Vendor Baru'}
          </Button>
        </form>
      </Modal>

      {/* Client Modal (Tambah & Edit) */}
      <Modal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        title={editingClient ? 'Edit Data Klien' : 'Tambah Data Klien Baru'}
        subtitle="Kelola profil pelanggan pemesan packaging"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveClient} className="space-y-4 text-left">
          <Input
            label="Nama Lengkap Klien"
            required
            value={clientForm.name}
            onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
            placeholder="Contoh: Hendra Wijaya"
          />
          <Input
            label="Nomor WhatsApp"
            required
            value={clientForm.phone}
            onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
            placeholder="Contoh: 081298765432"
          />
          <Input
            label="Email (Opsional)"
            type="email"
            value={clientForm.email}
            onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
            placeholder="Contoh: hendra@gmail.com"
          />
          <Select
            label="Status Klien"
            value={clientForm.client_type}
            onChange={(e) => setClientForm({ ...clientForm, client_type: e.target.value })}
          >
            <option value="Baru">Klien Baru</option>
            <option value="Lama">Klien Tetap / Repeat Order</option>
          </Select>
          <div className="flex items-center gap-2 p-3 bg-[#F0F6FB] rounded-[16px]">
            <input
              type="checkbox"
              id="is-member-checkbox"
              checked={clientForm.is_member}
              onChange={(e) => setClientForm({ ...clientForm, is_member: e.target.checked })}
              className="w-4 h-4 text-[#DE0E86] rounded focus:ring-[#DE0E86]"
            />
            <label htmlFor="is-member-checkbox" className="text-xs font-bold text-[#004582] cursor-pointer">
              Tandai sebagai Member Prioritas
            </label>
          </div>
          <Textarea
            label="Catatan Tambahan / Alamat Usaha"
            rows={2}
            value={clientForm.notes}
            onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
            placeholder="Misal: Pemilik Brand Sambal Nyai, alamat ruko..."
          />
          <Button type="submit" variant="primary" className="w-full">
            {editingClient ? 'Perbarui Data Klien' : 'Simpan Klien Baru'}
          </Button>
        </form>
      </Modal>

      {/* QRIS Modal */}
      <Modal
        isOpen={qrisModalOpen}
        onClose={() => setQrisModalOpen(false)}
        title="Upload Gambar QRIS Baru"
        subtitle="Barcode pembayaran untuk invoice dan tracking publik"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveQris} className="space-y-4 text-left">
          <Input
            label="Nama Merchant / Akun QRIS"
            required
            value={qrisForm.account_name}
            onChange={(e) => setQrisForm({ ...qrisForm, account_name: e.target.value })}
            placeholder="Contoh: KALEBOX PERCETAKAN MANDIRI"
          />
          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
              File Gambar QRIS (WebP / JPG / PNG) <span className="text-[#DE0E86]">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setQrisImageFile(e.target.files[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-[12px] file:border-0 file:text-xs file:font-bold file:bg-[#004582] file:text-white cursor-pointer"
            />
          </div>
          <Button type="submit" variant="primary" className="w-full">
            Simpan & Aktifkan QRIS
          </Button>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        title={deleteDialog.title}
        message={deleteDialog.message}
        confirmText="Hapus Permanen"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialog({ isOpen: false, type: '', id: null, title: '', message: '' })}
      />
    </div>
  );
};

export default PartnersPage;
