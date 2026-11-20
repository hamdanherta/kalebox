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
import { Table } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import { CalendarDays, Clock, Plus, CheckCircle2, XCircle, FileText, ExternalLink } from 'lucide-react';

export const LeavesPage = () => {
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const userRole = (role || user?.role?.slug || user?.role?.name || '').toLowerCase();
  const isSupervisor = ['owner', 'manager'].includes(userRole);

  const [activeTab, setActiveTab] = useState('leaves'); // 'leaves' or 'overtimes'
  const [subTab, setSubTab] = useState(isSupervisor ? 'all' : 'my'); // 'all' (only for manager/owner) or 'my'
  const [leaves, setLeaves] = useState([]);
  const [overtimes, setOvertimes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync subTab if role changes
  useEffect(() => {
    if (!isSupervisor && subTab !== 'my') {
      setSubTab('my');
    }
  }, [isSupervisor]);

  // Modals
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    type: 'Izin',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [leaveAttachment, setLeaveAttachment] = useState(null);

  const [overtimeModalOpen, setOvertimeModalOpen] = useState(false);
  const [overtimeForm, setOvertimeForm] = useState({
    date: new Date().toISOString().substring(0, 10),
    start_time: '17:00',
    end_time: '20:00',
    notes: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'leaves') {
        const endpoint = (isSupervisor && subTab === 'all') ? '/leaves' : '/leaves/my';
        const res = await api.get(endpoint);
        if (res.data?.status === 'success' || res.data?.success) {
          setLeaves(res.data.data?.data || res.data.data || []);
        }
      } else {
        const endpoint = (isSupervisor && subTab === 'all') ? '/overtimes' : '/overtimes/my';
        const res = await api.get(endpoint);
        if (res.data?.status === 'success' || res.data?.success) {
          setOvertimes(res.data.data?.data || res.data.data || []);
        }
      }
    } catch (err) {
      console.error('Failed to load leaves/overtimes', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, subTab]);

  const handleCreateLeave = async (e) => {
    e.preventDefault();
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) {
      addToast('Mohon lengkapi semua kolom wajib.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', leaveForm.type);
      formData.append('start_date', leaveForm.start_date);
      formData.append('end_date', leaveForm.end_date);
      formData.append('reason', leaveForm.reason);
      if (leaveAttachment) {
        formData.append('attachment', leaveAttachment);
      }

      const res = await api.post('/leaves', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      addToast(res.data?.message || 'Pengajuan cuti/izin berhasil dikirim ke manajemen', 'success');
      setLeaveModalOpen(false);
      setLeaveForm({
        type: 'Izin',
        start_date: '',
        end_date: '',
        reason: '',
      });
      setLeaveAttachment(null);
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Gagal mengajukan permohonan cuti / izin.';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateOvertime = async (e) => {
    e.preventDefault();
    if (!overtimeForm.date || !overtimeForm.start_time || !overtimeForm.end_time) {
      addToast('Mohon lengkapi tanggal dan jam lembur.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/overtimes', overtimeForm);
      addToast(res.data?.message || 'Pengajuan lembur berhasil dikirim', 'success');
      setOvertimeModalOpen(false);
      setOvertimeForm({
        date: new Date().toISOString().substring(0, 10),
        start_time: '17:00',
        end_time: '20:00',
        notes: '',
      });
      fetchData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Gagal mengajukan lembur.';
      addToast(errMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (type, id, status) => {
    if (!isSupervisor) {
      addToast('Akses ditolak: Hanya Owner dan Manager yang berhak menyetujui atau menolak permohonan.', 'error');
      return;
    }
    try {
      const endpoint = type === 'leave' ? `/leaves/${id}/status` : `/overtimes/${id}/status`;
      const res = await api.put(endpoint, { status });
      const statusLabel = (status === 'disetujui' || status === 'approved') ? 'disetujui' : 'ditolak';
      addToast(res.data?.message || `Pengajuan berhasil ${statusLabel}`, 'success');
      fetchData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memperbarui status pengajuan', 'error');
    }
  };

  const getFileUrl = (path, url) => {
    if (url) return url;
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Personalia & Presensi</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Pengajuan Cuti, Izin & Lembur
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Pengajuan dispensasi kerja dan pencatatan kompensasi lembur karyawan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'leaves' ? (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setLeaveModalOpen(true)}
              className="shadow-sm hover:shadow transition-all"
            >
              Ajukan Cuti / Izin
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => setOvertimeModalOpen(true)}
              className="shadow-sm hover:shadow transition-all"
            >
              Ajukan Lembur
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-[#F0F6FB] p-1.5 rounded-[22px] inline-flex items-center gap-1 border border-slate-100">
          <button
            onClick={() => setActiveTab('leaves')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[16px] text-xs font-bold transition-all ${
              activeTab === 'leaves' ? 'bg-white text-[#DE0E86] shadow-sm' : 'text-[#004582] hover:text-[#DE0E86]'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Cuti & Dispensasi</span>
          </button>
          <button
            onClick={() => setActiveTab('overtimes')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-[16px] text-xs font-bold transition-all ${
              activeTab === 'overtimes' ? 'bg-white text-[#DE0E86] shadow-sm' : 'text-[#004582] hover:text-[#DE0E86]'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Lembur Kerja</span>
          </button>
        </div>

        {isSupervisor && (
          <div className="bg-[#F0F6FB] p-1 rounded-[16px] inline-flex items-center gap-1 text-xs font-bold border border-slate-100">
            <button
              onClick={() => setSubTab('all')}
              className={`px-4 py-2 rounded-[12px] transition-all ${
                subTab === 'all' ? 'bg-white text-[#004582] shadow-sm font-extrabold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Semua Pengajuan
            </button>
            <button
              onClick={() => setSubTab('my')}
              className={`px-4 py-2 rounded-[12px] transition-all ${
                subTab === 'my' ? 'bg-white text-[#004582] shadow-sm font-extrabold' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Pengajuan Saya
            </button>
          </div>
        )}
      </div>

      {/* Content Card */}
      <Card padding="p-6 md:p-8" className="space-y-4 border border-slate-100 shadow-sm">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton height="h-16" rounded="rounded-[20px]" />
            <Skeleton height="h-16" rounded="rounded-[20px]" />
            <Skeleton height="h-16" rounded="rounded-[20px]" />
          </div>
        ) : activeTab === 'leaves' ? (
          /* Leaves Table */
          leaves.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Belum Ada Pengajuan Cuti / Izin"
              description="Tidak ada data permohonan cuti, sakit, atau izin yang tercatat saat ini."
            />
          ) : (
            <Table
              headers={[
                'Karyawan',
                'Jenis',
                'Tanggal Mulai',
                'Tanggal Selesai',
                'Alasan',
                'Lampiran',
                'Status',
                ...(isSupervisor && subTab === 'all' ? ['Aksi Persetujuan'] : []),
              ]}
            >
              {leaves.map((l) => {
                const statusStr = (l.status || '').toLowerCase();
                const isApproved = statusStr === 'approved' || statusStr === 'disetujui';
                const isRejected = statusStr === 'rejected' || statusStr === 'ditolak';
                const isPending = !isApproved && !isRejected;

                const fileUrl = getFileUrl(l.attachment_path, l.attachment_url);

                return (
                  <tr key={l.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#004582]">
                      <div>{l.employee?.name || user?.name}</div>
                      {l.employee?.position?.name && (
                        <div className="text-[11px] font-normal text-slate-400">{l.employee.position.name}</div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        l.type === 'Sakit' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        l.type === 'Cuti' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {l.type}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-slate-700">
                      {new Date(l.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-slate-700">
                      {new Date(l.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="py-4 px-6">
                      {fileUrl ? (
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#DE0E86] font-bold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Lampiran</span>
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Menunggu'}
                      </Badge>
                    </td>
                    {isSupervisor && subTab === 'all' && (
                      <td className="py-4 px-6">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus('leave', l.id, 'disetujui')}
                              className="p-1.5 rounded-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Setujui Permohonan"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus('leave', l.id, 'ditolak')}
                              className="p-1.5 rounded-[10px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              title="Tolak Permohonan"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Selesai</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </Table>
          )
        ) : (
          /* Overtimes Table */
          overtimes.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Belum Ada Pengajuan Lembur"
              description="Tidak ada data pencatatan lembur karyawan saat ini."
            />
          ) : (
            <Table
              headers={[
                'Karyawan',
                'Tanggal',
                'Jam Lembur',
                'Durasi Jam',
                'Keterangan Tugas',
                'Status',
                ...(isSupervisor && subTab === 'all' ? ['Aksi Persetujuan'] : []),
              ]}
            >
              {overtimes.map((ov) => {
                const statusStr = (ov.status || '').toLowerCase();
                const isApproved = statusStr === 'approved' || statusStr === 'disetujui';
                const isRejected = statusStr === 'rejected' || statusStr === 'ditolak';
                const isPending = !isApproved && !isRejected;

                return (
                  <tr key={ov.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-[#004582]">
                      <div>{ov.employee?.name || user?.name}</div>
                      {ov.employee?.position?.name && (
                        <div className="text-[11px] font-normal text-slate-400">{ov.employee.position.name}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-xs font-medium text-slate-700">
                      {new Date(ov.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-6 text-xs font-mono font-semibold text-slate-700">
                      {ov.start_time?.substring(0, 5)} - {ov.end_time?.substring(0, 5)}
                    </td>
                    <td className="py-4 px-6 font-bold text-[#DE0E86]">
                      {ov.duration_hours || ov.hours || 0} Jam
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600 max-w-xs truncate" title={ov.notes}>
                      {ov.notes || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <Badge
                        variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}
                        size="sm"
                      >
                        {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Menunggu'}
                      </Badge>
                    </td>
                    {isSupervisor && subTab === 'all' && (
                      <td className="py-4 px-6">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateStatus('overtime', ov.id, 'disetujui')}
                              className="p-1.5 rounded-[10px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                              title="Setujui Lembur"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus('overtime', ov.id, 'ditolak')}
                              className="p-1.5 rounded-[10px] bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                              title="Tolak Lembur"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Selesai</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </Table>
          )
        )}
      </Card>

      {/* Leave Request Modal */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Formulir Pengajuan Cuti / Izin"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateLeave} className="space-y-4 text-left">
          <Select
            label="Jenis Dispensasi"
            required
            value={leaveForm.type}
            onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
          >
            <option value="Izin">Izin Kepentingan Mendesak</option>
            <option value="Sakit">Sakit (Wajib Lampirkan Surat Dokter)</option>
            <option value="Cuti">Cuti Tahunan</option>
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Tanggal Mulai"
              type="date"
              required
              value={leaveForm.start_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
            />
            <Input
              label="Tanggal Selesai"
              type="date"
              required
              value={leaveForm.end_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
            />
          </div>

          <Textarea
            label="Alasan Pengajuan"
            required
            rows={3}
            placeholder="Jelaskan alasan pengajuan izin/cuti Anda secara jelas..."
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
          />

          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase mb-1">
              Lampiran Surat / Bukti (Opsional)
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => setLeaveAttachment(e.target.files[0] || null)}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-[12px] file:border-0 file:text-xs file:font-bold file:bg-[#F0F6FB] file:text-[#004582] cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">Format didukung: JPG, PNG, WEBP, PDF (Maks. 10MB)</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full shadow-md"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mengirim Permohonan...' : 'Kirim Permohonan Cuti'}
          </Button>
        </form>
      </Modal>

      {/* Overtime Request Modal */}
      <Modal
        isOpen={overtimeModalOpen}
        onClose={() => setOvertimeModalOpen(false)}
        title="Formulir Pengajuan Lembur"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateOvertime} className="space-y-4 text-left">
          <Input
            label="Tanggal Lembur"
            type="date"
            required
            value={overtimeForm.date}
            onChange={(e) => setOvertimeForm({ ...overtimeForm, date: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Jam Mulai"
              type="time"
              required
              value={overtimeForm.start_time}
              onChange={(e) => setOvertimeForm({ ...overtimeForm, start_time: e.target.value })}
            />
            <Input
              label="Jam Selesai"
              type="time"
              required
              value={overtimeForm.end_time}
              onChange={(e) => setOvertimeForm({ ...overtimeForm, end_time: e.target.value })}
            />
          </div>

          <Textarea
            label="Keterangan Pekerjaan Lembur"
            required
            rows={3}
            value={overtimeForm.notes}
            onChange={(e) => setOvertimeForm({ ...overtimeForm, notes: e.target.value })}
            placeholder="Tuliskan nomor pesanan atau tugas produksi yang diselesaikan..."
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full shadow-md"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Lembur'}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default LeavesPage;
