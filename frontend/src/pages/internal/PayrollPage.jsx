import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Table, Pagination } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { openPdfDocument } from '../../utils/pdfDownloader';
import {
  CreditCard,
  FileDown,
  Plus,
  CheckCircle2,
  DollarSign,
  Calendar,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Lock,
} from 'lucide-react';

export const PayrollPage = () => {
  const { role } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [payrolls, setPayrolls] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Aux data
  const [employees, setEmployees] = useState([]);
  const [bonuses, setBonuses] = useState([]);

  // Filters
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  // Generate batch modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateMonth, setGenerateMonth] = useState(new Date().getMonth() + 1);
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [isGenerating, setIsGenerating] = useState(false);

  // Edit / Manual Payroll modal
  const [payrollModalOpen, setPayrollModalOpen] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);
  const [payrollForm, setPayrollForm] = useState({
    employee_id: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
    basic_salary_total: 3000000,
    days_present: 25,
    overtime_total: 0,
    late_penalty_total: 0,
    bonus_id: '',
    bonus_amount: 0,
    status: 'Draft',
  });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const isExecutive = ['owner', 'manager'].includes(role);

  const fetchAuxData = async () => {
    if (!isExecutive) return;
    try {
      const [empRes, bonRes] = await Promise.all([
        api.get('/employees?per_page=100'),
        api.get('/bonuses'),
      ]);
      if (empRes.data?.data) setEmployees(empRes.data.data?.data || empRes.data.data || []);
      if (bonRes.data?.data) setBonuses(bonRes.data.data || []);
    } catch (err) {
      console.error('Failed to load auxiliary data', err);
    }
  };

  useEffect(() => {
    fetchAuxData();
  }, [role]);

  const fetchPayrolls = async (page = 1) => {
    if (!isExecutive) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      let url = `/payrolls?page=${page}`;
      if (filterMonth) url += `&month=${filterMonth}`;
      if (filterYear) url += `&year=${filterYear}`;

      const res = await api.get(url);
      if (res.data?.success || res.data?.status === 'success') {
        const d = res.data.data;
        const list = d?.data || d?.payrolls || (Array.isArray(d) ? d : []);
        setPayrolls(list);
        setMeta({
          current_page: d?.current_page || 1,
          last_page: d?.last_page || 1,
        });
      }
    } catch (err) {
      console.error('Failed to load payrolls', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls(1);
  }, [filterMonth, filterYear]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await api.post('/payrolls/generate', {
        month: Number(generateMonth),
        year: Number(generateYear),
      });

      if (res.data?.success || res.data?.status === 'success') {
        addToast(res.data.message || 'Perhitungan payroll bulanan berhasil dibuat!', 'success');
        setGenerateModalOpen(false);
        setFilterMonth(generateMonth);
        setFilterYear(generateYear);
        fetchPayrolls(1);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghitung payroll', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await api.put(`/payrolls/${id}/status`, { status });
      if (res.data?.success || res.data?.status === 'success') {
        addToast(`Status penggajian berhasil diubah menjadi ${status}`, 'success');
        fetchPayrolls(meta.current_page);
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengubah status payroll', 'error');
    }
  };

  const handleOpenEditModal = (p) => {
    setEditingPayroll(p);
    setPayrollForm({
      employee_id: p.employee_id,
      period_month: p.period_month || filterMonth,
      period_year: p.period_year || filterYear,
      basic_salary_total: Number(p.basic_salary_total || p.basic_salary || 0),
      days_present: Number(p.days_present || 25),
      overtime_total: Number(p.overtime_total || p.overtime_pay || 0),
      late_penalty_total: Number(p.late_penalty_total || p.late_deduction || 0),
      bonus_id: p.bonus_id || '',
      bonus_amount: Number(p.bonus_amount || 0),
      status: p.status || 'Draft',
    });
    setPayrollModalOpen(true);
  };

  const handleOpenCreateModal = () => {
    setEditingPayroll(null);
    setPayrollForm({
      employee_id: employees[0]?.id || '',
      period_month: filterMonth,
      period_year: filterYear,
      basic_salary_total: 3000000,
      days_present: 25,
      overtime_total: 0,
      late_penalty_total: 0,
      bonus_id: '',
      bonus_amount: 0,
      status: 'Draft',
    });
    setPayrollModalOpen(true);
  };

  const handleSavePayroll = async (e) => {
    e.preventDefault();
    try {
      if (editingPayroll) {
        await api.put(`/payrolls/${editingPayroll.id}`, payrollForm);
        addToast('Data penggajian karyawan berhasil diperbarui', 'success');
      } else {
        await api.post('/payrolls', payrollForm);
        addToast('Slip gaji karyawan baru berhasil ditambahkan', 'success');
      }
      setPayrollModalOpen(false);
      fetchPayrolls(meta.current_page);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan data penggajian', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/payrolls/${deleteDialog.id}`);
      addToast('Data slip gaji berhasil dihapus', 'success');
      setDeleteDialog({ isOpen: false, id: null, name: '' });
      fetchPayrolls(meta.current_page);
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghapus slip gaji', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const calculatedNet = Math.max(
    0,
    Number(payrollForm.basic_salary_total || 0) -
      Number(payrollForm.late_penalty_total || 0) +
      Number(payrollForm.overtime_total || 0) +
      Number(payrollForm.bonus_amount || 0)
  );

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const totalPayrollAmount = payrolls.reduce((acc, p) => acc + Number(p.net_salary || 0), 0);
  const totalPaidCount = payrolls.filter((p) => (p.status || '').toLowerCase() === 'dibayar').length;
  const totalDraftCount = payrolls.filter((p) => (p.status || '').toLowerCase() === 'draft').length;
  const totalFinalCount = payrolls.filter((p) => (p.status || '').toLowerCase() === 'final').length;

  if (!isExecutive) {
    return (
      <div className="py-12 text-left">
        <Card padding="p-8 md:p-12" className="text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#004582]">Akses Terbatas (Khusus Owner & Manajer)</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Modul Penggajian (Payroll) bersifat rahasia dan hanya dapat diakses oleh Owner dan Manajer Operasional.
          </p>
          <Button variant="secondary" size="md" onClick={() => navigate('/internal/dasbor')}>
            Kembali ke Dasbor
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Kompensasi & Penggajian</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Penggajian Karyawan (Payroll)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kalkulasi otomatis dan penyesuaian gaji pokok, lembur, bonus insentif, dan potongan denda keterlambatan presensi.
          </p>
        </div>

        {isExecutive && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="light"
              size="md"
              icon={Plus}
              onClick={handleOpenCreateModal}
            >
              Tambah Slip Manual
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={RefreshCw}
              onClick={() => setGenerateModalOpen(true)}
            >
              Hitung Payroll Bulanan
            </Button>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <Card padding="p-4" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#004582]">
            <Filter className="w-4 h-4 text-[#DE0E86]" />
            <span>Filter Periode:</span>
          </div>

          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold rounded-[16px] bg-[#F0F6FB] text-[#004582] border-0 focus:ring-2 focus:ring-[#004582] cursor-pointer"
          >
            {monthNames.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold rounded-[16px] bg-[#F0F6FB] text-[#004582] border-0 focus:ring-2 focus:ring-[#004582] cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Total Data: <span className="text-[#004582] font-bold">{payrolls.length} Karyawan</span>
        </div>
      </Card>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="p-5" className="flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-[18px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Beban Payroll</p>
            <h3 className="text-lg font-black text-[#004582] font-mono mt-0.5">
              Rp {totalPayrollAmount.toLocaleString('id-ID')}
            </h3>
          </div>
        </Card>

        <Card padding="p-5" className="flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-[18px] bg-sky-50 text-[#004582] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-[#DE0E86]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Realisasi Pembayaran</p>
            <h3 className="text-lg font-black text-[#004582] font-mono mt-0.5">
              {totalPaidCount} <span className="text-xs font-semibold text-slate-400">/ {payrolls.length} Karyawan</span>
            </h3>
          </div>
        </Card>

        <Card padding="p-5" className="flex items-center gap-4 bg-white">
          <div className="w-12 h-12 rounded-[18px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status Draft & Final</p>
            <h3 className="text-lg font-black text-[#004582] font-mono mt-0.5">
              {totalDraftCount} Draft <span className="text-xs font-normal text-slate-400">·</span> {totalFinalCount} Final
            </h3>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card padding="p-6 md:p-8" className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton height="h-16" rounded="rounded-[20px]" />
            <Skeleton height="h-16" rounded="rounded-[20px]" />
            <Skeleton height="h-16" rounded="rounded-[20px]" />
          </div>
        ) : payrolls.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Belum Ada Data Penggajian"
            description={`Tidak ada data slip gaji untuk periode ${monthNames[filterMonth - 1]} ${filterYear}. Klik tombol 'Hitung Payroll Bulanan' untuk mengkalkulasi otomatis presensi seluruh karyawan.`}
            actionLabel={isExecutive ? "Hitung Payroll Sekarang" : undefined}
            onAction={isExecutive ? () => setGenerateModalOpen(true) : undefined}
          />
        ) : (
          <>
            <Table
              headers={[
                { label: 'Karyawan', className: 'min-w-[220px] text-left' },
                { label: 'Periode', className: 'w-28 text-left' },
                { label: 'Kehadiran', className: 'w-40 text-left' },
                { label: 'Gaji Pokok', className: 'w-32 text-right' },
                { label: 'Tunjangan & Bonus', className: 'min-w-[160px] text-left' },
                { label: 'Potongan Denda', className: 'w-32 text-right' },
                { label: 'Gaji Bersih', className: 'w-36 text-right' },
                { label: 'Status', className: 'w-24 text-center' },
                { label: 'Aksi', className: 'w-44 text-right' },
              ]}
            >
              {payrolls.map((p) => {
                const isPaid = (p.status || '').toLowerCase() === 'dibayar';
                const isFinal = (p.status || '').toLowerCase() === 'final';
                const basic = Number(p.basic_salary_total || p.basic_salary || 0);
                const overtime = Number(p.overtime_total || p.overtime_pay || 0);
                const bonus = Number(p.bonus_amount || 0);
                const late = Number(p.late_penalty_total || p.late_deduction || 0);
                const net = Number(p.net_salary || 0);
                const daysPresent = Number(p.days_present ?? 0);
                const attendancePct = Math.min(100, Math.max(0, Math.round((daysPresent / 25) * 100)));

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/70 transition-colors duration-150 border-b border-slate-100 last:border-0"
                  >
                    {/* 1. Karyawan */}
                    <td className="py-4 px-5 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#004582] to-[#003362] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {(p.employee?.name || 'K').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-800 leading-tight truncate">
                            {p.employee?.name || '-'}
                          </h4>
                          <p className="text-xs text-slate-400 font-normal leading-tight truncate mt-0.5">
                            {p.employee?.position?.name || p.employee?.position?.division?.name || 'Staff'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* 2. Periode */}
                    <td className="py-4 px-5 whitespace-nowrap align-middle">
                      <span className="text-xs font-semibold text-slate-600 font-mono">
                        {monthNames[(p.period_month || p.month) - 1]?.slice(0, 3)} {p.period_year || p.year}
                      </span>
                    </td>

                    {/* 3. Kehadiran (Mini Progress Bar) */}
                    <td className="py-4 px-5 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden shrink-0">
                          <div
                            className="bg-[#004582] h-full rounded-full transition-all duration-300"
                            style={{ width: `${attendancePct}%` }}
                          />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-700 font-mono">
                            {daysPresent} Hari
                          </span>
                          {Number(p.times_late) > 0 && (
                            <span className="block text-[10px] text-rose-500 font-semibold font-mono">
                              {p.times_late}x telat
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 4. Gaji Pokok */}
                    <td className="py-4 px-5 text-right whitespace-nowrap align-middle font-mono text-xs font-semibold text-slate-700">
                      Rp {basic.toLocaleString('id-ID')}
                    </td>

                    {/* 5. Tunjangan & Lembur (Pill Badges) */}
                    <td className="py-4 px-5 whitespace-nowrap align-middle">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {bonus > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-pink-50 text-[#DE0E86] border border-pink-100/60 font-mono">
                            +{bonus.toLocaleString('id-ID')}
                          </span>
                        )}
                        {overtime > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#004582] border border-sky-100/60 font-mono">
                            +{overtime.toLocaleString('id-ID')}
                          </span>
                        )}
                        {overtime === 0 && bonus === 0 && (
                          <span className="text-slate-300 font-mono text-xs">-</span>
                        )}
                      </div>
                    </td>

                    {/* 6. Potongan Denda */}
                    <td className="py-4 px-5 text-right whitespace-nowrap align-middle">
                      {late > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-100/60 font-mono">
                          -Rp {late.toLocaleString('id-ID')}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* 7. Gaji Bersih */}
                    <td className="py-4 px-5 text-right whitespace-nowrap align-middle">
                      <span className="font-mono text-sm font-extrabold text-[#004582]">
                        Rp {net.toLocaleString('id-ID')}
                      </span>
                    </td>

                    {/* 8. Status (Pill) */}
                    <td className="py-4 px-5 text-center whitespace-nowrap align-middle">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : isFinal
                            ? 'bg-blue-50 text-[#004582] border border-blue-200/60'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        {p.status || 'Draft'}
                      </span>
                    </td>

                    {/* 9. Aksi */}
                    <td className="py-4 px-5 text-right whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        <button
                          onClick={() => {
                            openPdfDocument(
                              `/payrolls/${p.id}/slip-pdf`,
                              `slip_gaji_${(p.employee?.name || 'karyawan').replace(/\s+/g, '_')}_${p.period_month}_${p.period_year}`
                            );
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-[#004582] hover:bg-[#F0F6FB] transition-all cursor-pointer"
                          title="Unduh Slip Gaji PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>

                        {isExecutive && (
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-2 rounded-xl text-slate-400 hover:text-[#DE0E86] hover:bg-pink-50 transition-all cursor-pointer"
                            title="Edit Komponen Gaji"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {isExecutive && !isFinal && !isPaid && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'Final')}
                            className="px-2.5 py-1 rounded-full bg-sky-50 text-[#004582] text-xs font-bold hover:bg-[#004582] hover:text-white transition-all cursor-pointer border border-sky-100"
                            title="Kunci status slip gaji menjadi Final"
                          >
                            Finalkan
                          </button>
                        )}

                        {isExecutive && isFinal && !isPaid && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'Dibayar')}
                            className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all cursor-pointer border border-emerald-100"
                            title="Tandai gaji sudah dibayarkan"
                          >
                            Bayar
                          </button>
                        )}

                        {isExecutive && (
                          <button
                            onClick={() =>
                              setDeleteDialog({
                                isOpen: true,
                                id: p.id,
                                name: `Slip Gaji ${p.employee?.name || 'Karyawan'} (${p.period_month}/${p.period_year})`,
                              })
                            }
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Hapus Slip Gaji"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>

            <Pagination
              currentPage={meta.current_page}
              lastPage={meta.last_page}
              totalItems={payrolls.length}
              onPageChange={fetchPayrolls}
              onPageChange={(p) => fetchPayrolls(p)}
            />
          </>
        )}
      </Card>

      {/* Modal 1: Generate Batch Payroll */}
      <Modal
        isOpen={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        title="Kalkulasi Payroll Bulanan"
        subtitle="Sistem akan mengkalkulasi presensi harian, lembur, dan bonus seluruh karyawan secara otomatis."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleGenerate} className="space-y-4 text-left">
          <Select
            label="Bulan Penggajian"
            required
            value={generateMonth}
            onChange={(e) => setGenerateMonth(Number(e.target.value))}
          >
            {monthNames.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </Select>

          <Input
            label="Tahun"
            type="number"
            required
            value={generateYear}
            onChange={(e) => setGenerateYear(Number(e.target.value))}
          />

          <div className="bg-[#F0F6FB] p-3.5 rounded-[20px] text-xs text-slate-600 leading-relaxed">
            Perhitungan mencakup denda keterlambatan (Rp 25.000 per keterlambatan) serta upah lembur resmi sesuai absensi bulan terpilih.
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isGenerating}
          >
            Mulai Perhitungan Sekarang
          </Button>
        </form>
      </Modal>

      {/* Modal 2: Edit / Tambah Slip Gaji Manual */}
      <Modal
        isOpen={payrollModalOpen}
        onClose={() => setPayrollModalOpen(false)}
        title={editingPayroll ? 'Edit Rincian Penggajian Karyawan' : 'Tambah Slip Gaji Manual'}
        subtitle="Sesuaikan gaji pokok, hari masuk, lembur, denda, dan bonus insentif"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSavePayroll} className="space-y-4 text-left">
          {!editingPayroll && (
            <Select
              label="Pilih Karyawan"
              required
              value={payrollForm.employee_id}
              onChange={(e) => setPayrollForm({ ...payrollForm, employee_id: e.target.value })}
            >
              <option value="">Pilih Karyawan...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.position?.name || 'Staff'})
                </option>
              ))}
            </Select>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Gaji Pokok Total (Rp)"
              type="number"
              required
              min={0}
              value={payrollForm.basic_salary_total}
              onChange={(e) => setPayrollForm({ ...payrollForm, basic_salary_total: e.target.value })}
            />
            <Input
              label="Hari Masuk Kerja"
              type="number"
              required
              min={0}
              max={31}
              value={payrollForm.days_present}
              onChange={(e) => setPayrollForm({ ...payrollForm, days_present: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Upah Lembur (Rp)"
              type="number"
              min={0}
              value={payrollForm.overtime_total}
              onChange={(e) => setPayrollForm({ ...payrollForm, overtime_total: e.target.value })}
            />
            <Input
              label="Potongan / Denda (Rp)"
              type="number"
              min={0}
              value={payrollForm.late_penalty_total}
              onChange={(e) => setPayrollForm({ ...payrollForm, late_penalty_total: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Pilih Master Bonus (Opsional)"
              value={payrollForm.bonus_id}
              onChange={(e) => {
                const bId = e.target.value;
                const selectedB = bonuses.find((b) => String(b.id) === String(bId));
                setPayrollForm({
                  ...payrollForm,
                  bonus_id: bId,
                  bonus_amount: selectedB ? selectedB.amount : payrollForm.bonus_amount,
                });
              }}
            >
              <option value="">Tanpa Bonus Master</option>
              {bonuses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (Rp {Number(b.amount).toLocaleString('id-ID')})
                </option>
              ))}
            </Select>

            <Input
              label="Nominal Bonus (Rp)"
              type="number"
              min={0}
              value={payrollForm.bonus_amount}
              onChange={(e) => setPayrollForm({ ...payrollForm, bonus_amount: e.target.value })}
            />
          </div>

          <Select
            label="Status Penggajian"
            required
            value={payrollForm.status}
            onChange={(e) => setPayrollForm({ ...payrollForm, status: e.target.value })}
          >
            <option value="Draft">Draft (Belum Difinalkan)</option>
            <option value="Final">Final (Siap Dibayar)</option>
            <option value="Dibayar">Dibayar (Lunas)</option>
          </Select>

          {/* Realtime Calculation Summary */}
          <div className="p-4 bg-[#F0F6FB] rounded-[20px] space-y-2 border border-slate-200">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Gaji Pokok:</span>
              <span className="font-bold text-[#004582]">Rp {Number(payrollForm.basic_salary_total || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-700">
              <span>+ Lembur:</span>
              <span className="font-bold">+Rp {Number(payrollForm.overtime_total || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-xs text-[#DE0E86]">
              <span>+ Bonus:</span>
              <span className="font-bold">+Rp {Number(payrollForm.bonus_amount || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-xs text-rose-600">
              <span>- Potongan Denda:</span>
              <span className="font-bold">-Rp {Number(payrollForm.late_penalty_total || 0).toLocaleString('id-ID')}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-[#004582]">
              <span>Estimasi Gaji Bersih (Net):</span>
              <span className="text-[#DE0E86] text-base">Rp {calculatedNet.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full">
            {editingPayroll ? 'Simpan Perubahan Gaji' : 'Tambah Slip Gaji Baru'}
          </Button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Slip Gaji"
        message={`Apakah Anda yakin ingin menghapus "${deleteDialog.name}"? Data yang dihapus tidak dapat dipulihkan.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PayrollPage;
