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
import { Table, Pagination } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  FileText,
  Search,
  ExternalLink,
} from 'lucide-react';

export const FinancePage = () => {
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [filterType, setFilterType] = useState(''); // '' or 'income' or 'expense'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Record modal
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: 'income',
    category: 'Penjualan Cetak Box',
    amount: '',
    transaction_date: new Date().toISOString().substring(0, 10),
    description: '',
  });
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, number: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/finance/summary');
      if (res.data?.status === 'success') {
        setSummary(res.data.data);
      }
    } catch {
      // quiet
    }
  };

  const fetchTransactions = async (page = 1) => {
    setIsLoading(true);
    try {
      let url = `/finance?page=${page}&per_page=20`;
      if (filterType) url += `&type=${filterType}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await api.get(url);
      if (res.data?.status === 'success') {
        const d = res.data.data;
        setTransactions(d.data || []);
        setMeta({ current_page: d.current_page || 1, last_page: d.last_page || 1 });
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchTransactions();
  }, [filterType, searchQuery]);

  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('category', form.category);
      formData.append('amount', form.amount);
      formData.append('transaction_date', form.transaction_date);
      formData.append('description', form.description);
      if (proofFile) formData.append('proof_file', proofFile);

      const res = await api.post('/finance', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.status === 'success') {
        addToast('Transaksi keuangan berhasil dicatat!', 'success');
        setRecordModalOpen(false);
        setProofFile(null);
        fetchSummary();
        fetchTransactions();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan transaksi', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/finance/${deleteDialog.id}`);
      addToast('Transaksi berhasil dihapus dari pembukuan', 'success');
      setDeleteDialog({ isOpen: false, id: null, number: '' });
      fetchSummary();
      fetchTransactions(meta.current_page);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghapus transaksi', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = role === 'owner';

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Arus Kas & Pembukuan</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Keuangan & Kas Operasional
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Pencatatan pendapatan percetakan kemasan dan pengeluaran bahan baku produksi.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={Plus}
          onClick={() => setRecordModalOpen(true)}
        >
          Catat Transaksi Kas
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card padding="p-6" className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Total Pemasukan</span>
              <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              Rp {Number(summary.total_income || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500">Bulan ini: +Rp {Number(summary.this_month_income || 0).toLocaleString('id-ID')}</p>
          </Card>

          <Card padding="p-6" className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Total Pengeluaran</span>
              <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-rose-700">
              Rp {Number(summary.total_expense || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500">Bulan ini: -Rp {Number(summary.this_month_expense || 0).toLocaleString('id-ID')}</p>
          </Card>

          <Card padding="p-6" className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase">
              <span>Laba Bersih Kas</span>
              <div className="p-2 rounded-full bg-[#F0F6FB] text-[#004582]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#004582]">
              Rp {Number(summary.net_profit || 0).toLocaleString('id-ID')}
            </p>
            <p className="text-[11px] text-slate-500">Bulan ini: Rp {Number(summary.this_month_profit || 0).toLocaleString('id-ID')}</p>
          </Card>
        </div>
      )}

      {/* Filter and Search Bar */}
      <Card padding="p-5" className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari transaksi atau nomor bukti..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>

        <div className="bg-[#F0F6FB] p-1 rounded-[16px] flex items-center gap-1 text-xs font-bold">
          <button
            onClick={() => setFilterType('')}
            className={`px-4 py-2 rounded-[12px] transition-all ${
              filterType === '' ? 'bg-white text-[#DE0E86] shadow-sm' : 'text-[#004582]'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`px-4 py-2 rounded-[12px] transition-all ${
              filterType === 'income' ? 'bg-white text-emerald-700 shadow-sm' : 'text-[#004582]'
            }`}
          >
            Pemasukan
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`px-4 py-2 rounded-[12px] transition-all ${
              filterType === 'expense' ? 'bg-white text-rose-700 shadow-sm' : 'text-[#004582]'
            }`}
          >
            Pengeluaran
          </button>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card padding="p-6 md:p-8" className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton height="h-16" rounded="rounded-[20px]" />
            <Skeleton height="h-16" rounded="rounded-[20px]" />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="Belum Ada Transaksi"
            description="Tidak ada catatan transaksi keuangan yang cocok dengan filter."
          />
        ) : (
          <>
            <Table
              headers={[
                'No. Transaksi',
                'Tanggal',
                'Tipe',
                'Kategori',
                'Keterangan',
                'Jumlah',
                'Bukti',
                ...(isOwner ? ['Aksi'] : []),
              ]}
            >
              {transactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-[#004582] text-xs">
                    {trx.transaction_number}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                    {new Date(trx.transaction_date).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={trx.type === 'income' ? 'success' : 'danger'} size="sm">
                      {trx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-xs font-semibold text-[#004582]">
                    {trx.category}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate">
                    {trx.description}
                  </td>
                  <td className={`py-4 px-6 font-extrabold text-sm ${
                    trx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {trx.type === 'income' ? '+' : '-'}Rp {Number(trx.amount).toLocaleString('id-ID')}
                  </td>
                  <td className="py-4 px-6">
                    {trx.proof_file ? (
                      <a href={trx.proof_file} target="_blank" rel="noreferrer" className="text-xs text-[#DE0E86] font-bold underline inline-flex items-center gap-1">
                        Lampiran <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  {isOwner && (
                    <td className="py-4 px-6">
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            id: trx.id,
                            number: trx.transaction_number,
                          })
                        }
                        className="p-1.5 rounded-[10px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all"
                        title="Hapus Transaksi (Owner)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </Table>

            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              onPageChange={(p) => fetchTransactions(p)}
            />
          </>
        )}
      </Card>

      {/* Record Transaction Modal */}
      <Modal
        isOpen={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Catat Transaksi Keuangan"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveTransaction} className="space-y-4 text-left">
          <Select
            label="Jenis Transaksi"
            required
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="income">Pemasukan Kas</option>
            <option value="expense">Pengeluaran Kas</option>
          </Select>

          <Input
            label="Kategori Transaksi"
            required
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Contoh: Pembelian Kertas Ivory, Biaya Listrik..."
          />

          <Input
            label="Nominal (Rp)"
            type="number"
            required
            min={1}
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <Input
            label="Tanggal Transaksi"
            type="date"
            required
            value={form.transaction_date}
            onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
          />

          <Textarea
            label="Keterangan Rinci"
            required
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
              Upload Bukti Nota / Kuitansi (Opsional)
            </label>
            <input
              type="file"
              onChange={(e) => setProofFile(e.target.files[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-[12px] file:border-0 file:text-xs file:font-bold file:bg-[#F0F6FB] file:text-[#004582] cursor-pointer"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isSubmitting}
          >
            Simpan Transaksi Kas
          </Button>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, number: '' })}
        onConfirm={handleDelete}
        title="Hapus Transaksi Kas?"
        message={`Apakah Anda yakin ingin menghapus catatan transaksi ${deleteDialog.number}? Tindakan ini eksklusif untuk Owner.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default FinancePage;
