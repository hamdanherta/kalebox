import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import { Skeleton } from '../../components/common/Skeleton';
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Users2,
  Printer,
  DollarSign,
  ArrowRight,
  CalendarDays,
  UserCheck,
  ChevronRight,
  FileText,
  AlertCircle,
  Calendar,
  Briefcase,
  CheckCheck,
  Layers,
  Play,
  Send,
  ExternalLink,
  Link as LinkIcon,
  Copy,
  MessageCircle,
  Share2,
  RotateCcw,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, role } = useAuth();
  const { addToast } = useToast();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('all');

  // Submit Link & Ajukan Modal State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [activeTaskToSubmit, setActiveTaskToSubmit] = useState(null);
  const [submitLink, setSubmitLink] = useState('');
  const [submitCaption, setSubmitCaption] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [actionLoadingTaskId, setActionLoadingTaskId] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      if (res.data?.success || res.data?.status === 'success') {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton height="h-20" rounded="rounded-[32px]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} height="h-32" rounded="rounded-[32px]" />
          ))}
        </div>
        <Skeleton height="h-72" rounded="rounded-[32px]" />
      </div>
    );
  }

  const isExecutive = ['owner', 'manager'].includes(role);
  const isAdmin = role === 'admin';
  const isDesign = role === 'design';
  const isStaff = role === 'staff';

  const myAttendance = stats?.my_attendance_today;
  const myLeaves = stats?.my_recent_leaves || [];
  const myOvertimes = stats?.my_recent_overtimes || [];
  const myMonthSummary = stats?.my_monthly_summary;
  const pendingApprovals = stats?.pending_approvals;
  const myAssignedTasks = stats?.my_assigned_tasks || [];

  const contentTasksCount = myAssignedTasks.filter((t) => t.task_type === 'content').length;
  const orderTasksCount = myAssignedTasks.filter((t) => t.task_type.startsWith('order')).length;
  const approvalTasksCount = myAssignedTasks.filter((t) => t.task_type.startsWith('approval')).length;

  const filteredTasks = myAssignedTasks.filter((task) => {
    if (taskCategoryFilter === 'all') return true;
    if (taskCategoryFilter === 'content') return task.task_type === 'content';
    if (taskCategoryFilter === 'order') return task.task_type.startsWith('order');
    if (taskCategoryFilter === 'approval') return task.task_type.startsWith('approval');
    return true;
  });

  const getTaskStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('revisi')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
          Revisi
        </span>
      );
    }
    if (s.includes('ok') || s.includes('siap') || s.includes('selesai') || s.includes('disetujui')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
          {status}
        </span>
      );
    }
    if (s.includes('proses') || s.includes('cetak')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 text-sky-800 border border-sky-200">
          {status}
        </span>
      );
    }
    if (s.includes('menunggu') || s.includes('antri') || s.includes('masuk')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
          {status}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  const handleStartWork = async (task) => {
    setActionLoadingTaskId(task.id);
    try {
      if (task.task_type === 'content') {
        const res = await api.put(`/contents/${task.source_id}/advance-status`, {
          status: 'Konten Di Proses',
          notes: 'Mulai dikerjakan oleh ' + (user?.name || 'PIC'),
        });
        if (res.data?.success || res.data?.status === 'success') {
          addToast('Pekerjaan konten dimulai! Status diubah menjadi Sedang Di Proses.', 'success');
        }
      } else if (task.task_type === 'order_design') {
        const res = await api.put(`/orders/${task.source_id}/status`, {
          status: 'Pesanan Diproses',
          notes: 'Desainer mulai mengerjakan layout desain pesanan',
        });
        if (res.data?.success || res.data?.status === 'success') {
          addToast('Pesanan masuk tahap pengerjaan desain (Diproses)!', 'success');
        }
      } else if (task.task_type === 'order_production') {
        const res = await api.put(`/orders/${task.source_id}/status`, {
          status: 'Pesanan Sedang Dicetak',
          notes: 'Tim produksi mulai mencetak box kemasan',
        });
        if (res.data?.success || res.data?.status === 'success') {
          addToast('Pesanan resmi naik cetak (Sedang Dicetak)!', 'success');
        }
      }
      fetchDashboard();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memulai pekerjaan', 'error');
    } finally {
      setActionLoadingTaskId(null);
    }
  };

  const handleOpenSubmitModal = (task) => {
    setActiveTaskToSubmit(task);
    setSubmitLink('');
    setSubmitCaption('');
    setSubmitNotes('');
    setSubmitModalOpen(true);
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!activeTaskToSubmit) return;
    if (!submitLink.trim()) {
      addToast('Tautan link hasil karya wajib diisi.', 'error');
      return;
    }

    setIsSubmittingTask(true);
    try {
      if (activeTaskToSubmit.task_type === 'content') {
        const res = await api.put(`/contents/${activeTaskToSubmit.source_id}/advance-status`, {
          status: 'Konten Ok',
          result_url: submitLink.trim(),
          caption: submitCaption.trim(),
          notes: submitNotes.trim() || 'Hasil konten diajukan untuk peninjauan.',
        });
        if (res.data?.success || res.data?.status === 'success') {
          addToast('Hasil konten promosi berhasil diajukan untuk ditinjau / ACC!', 'success');
          setSubmitModalOpen(false);
          fetchDashboard();
        }
      } else if (activeTaskToSubmit.task_type === 'order_design') {
        const res = await api.post(`/orders/${activeTaskToSubmit.source_id}/submit-design`, {
          link: submitLink.trim(),
          notes: submitNotes.trim() || 'Hasil desain diajukan ke Admin.',
        });
        if (res.data?.success || res.data?.status === 'success') {
          addToast('Tautan desain pesanan berhasil diajukan ke Admin!', 'success');
          setSubmitModalOpen(false);
          fetchDashboard();
        }
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengajukan hasil karya', 'error');
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleAdvancePipeline = async (task, nextStatus, notes) => {
    setActionLoadingTaskId(task.id);
    try {
      if (task.task_type === 'content') {
        const res = await api.put(`/contents/${task.source_id}/advance-status`, {
          status: nextStatus,
          notes: notes,
        });
        if (res.data?.success || res.data?.status === 'success') {
          addToast(`Alur konten diperbarui: ${nextStatus}!`, 'success');
        }
      } else if (task.task_type.startsWith('order')) {
        const res = await api.put(`/orders/${task.source_id}/status`, {
          status: nextStatus,
          notes: notes,
        });
        if (res.data?.success || res.data?.status === 'success') {
          addToast(`Status pesanan diperbarui: ${nextStatus}!`, 'success');
        }
      }
      fetchDashboard();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memajukan alur', 'error');
    } finally {
      setActionLoadingTaskId(null);
    }
  };

  return (
    <div className="space-y-8 text-left">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#004582] to-[#003362] text-white p-6 sm:p-8 rounded-[32px] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <Badge variant="primary" size="sm" className="font-bold tracking-wider">
            PANEL OPERASIONAL
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-white/80 font-medium">
            Hari ini {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/internal/cuti-lembur">
            <Button variant="light" size="md" icon={CalendarDays}>
              Ajukan Cuti / Izin
            </Button>
          </Link>
          <Link to="/internal/pesanan">
            <Button variant="primary" size="md" icon={ShoppingBag}>
              Lihat Pesanan
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXECUTIVE PENDING APPROVAL ALERT (KHUSUS OWNER & MANAGER)                 */}
      {/* ========================================================================= */}
      {isExecutive && pendingApprovals && (pendingApprovals.leaves_count > 0 || pendingApprovals.overtimes_count > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 p-5 rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-[#004582] text-sm sm:text-base">
                Antrean Persetujuan Pimpinan Menunggu Tindakan
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Ada <strong className="text-amber-700 font-bold">{pendingApprovals.leaves_count || 0} pengajuan cuti/izin/sakit</strong> dan <strong className="text-amber-700 font-bold">{pendingApprovals.overtimes_count || 0} pengajuan lembur</strong> yang menunggu persetujuan Anda.
              </p>
            </div>
          </div>
          <Link to="/internal/cuti-lembur">
            <Button variant="primary" size="sm" icon={ArrowRight} className="shadow-sm">
              Tinjau & Setujui
            </Button>
          </Link>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STATUS KEHADIRAN & PERMOHONAN DISPENSASI ANDA (UNTUK SETIAP INDIVIDU)     */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#DE0E86]" />
            <h2 className="text-base sm:text-lg font-extrabold text-[#004582] tracking-tight">
              Status Presensi & Pengajuan Pribadi Anda
            </h2>
          </div>
          <Link to="/internal/cuti-lembur" className="text-xs font-bold text-[#DE0E86] hover:underline flex items-center gap-1">
            <span>Kelola Cuti & Lembur</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KARTU 1: PRESENSI HARI INI & REKAP BULAN INI */}
          <Card padding="p-6" className="space-y-4 border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Presensi Hari Ini</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>

              {/* Status Badge Hari Ini */}
              <div>
                {myAttendance?.status === 'Masuk' ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sudah Absen Masuk ({myAttendance.check_in_time?.substring(0, 5)} WIB)</span>
                    </span>
                    {myAttendance.is_late && (
                      <p className="text-[11px] text-amber-700 font-semibold pl-1">
                        Terlambat {myAttendance.late_duration_minutes} menit dari jam kerja
                      </p>
                    )}
                  </div>
                ) : myAttendance?.active_leave ? (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                      <CalendarDays className="w-3.5 h-3.5 text-sky-600" />
                      <span>Sedang {myAttendance.active_leave.type} Disetujui</span>
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium pl-1">
                      {myAttendance.active_leave.reason} ({new Date(myAttendance.active_leave.start_date).toLocaleDateString('id-ID')} s/d {new Date(myAttendance.active_leave.end_date).toLocaleDateString('id-ID')})
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Belum Absen Masuk Hari Ini</span>
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Silakan lakukan absensi kamera selfie sebelum batas toleransi jam kerja.
                    </p>
                  </div>
                )}
              </div>

              {/* Status Jam Pulang */}
              {myAttendance?.has_checked_in && (
                <div className="pt-2 border-t border-slate-100/80 text-xs">
                  <span className="text-slate-500 font-medium">Absen Pulang: </span>
                  {myAttendance.has_checked_out ? (
                    <strong className="text-emerald-700 font-bold">{myAttendance.check_out_time?.substring(0, 5)} WIB</strong>
                  ) : (
                    <span className="text-amber-600 font-semibold italic">Belum Absen Pulang</span>
                  )}
                </div>
              )}
            </div>

            {/* Rekap Kehadiran Bulan Berjalan */}
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">Rekap Kehadiran Bulan Ini</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-[14px] bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-800">Hadir</p>
                  <p className="text-lg font-extrabold text-emerald-700">{myMonthSummary?.hadir || 0} Hari</p>
                </div>
                <div className="p-2.5 rounded-[14px] bg-amber-50 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-800">Terlambat</p>
                  <p className="text-lg font-extrabold text-amber-700">{myMonthSummary?.terlambat || 0}x</p>
                </div>
                <div className="p-2.5 rounded-[14px] bg-sky-50 border border-sky-100">
                  <p className="text-[10px] font-bold text-sky-800">Izin/Cuti</p>
                  <p className="text-lg font-extrabold text-sky-700">{myMonthSummary?.dispensasi || 0} Hari</p>
                </div>
              </div>
            </div>
          </Card>

          {/* KARTU 2: STATUS PENGAJUAN CUTI / IZIN / SAKIT TERBARU */}
          <Card padding="p-6" className="space-y-4 border border-slate-100 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#DE0E86]" />
                <span className="text-xs font-bold text-[#004582] uppercase tracking-wider">
                  Status Pengajuan Cuti / Izin / Sakit Anda
                </span>
              </div>
              <Link to="/internal/cuti-lembur" className="text-xs font-bold text-[#DE0E86] hover:underline">
                Ajukan Cuti Baru +
              </Link>
            </div>

            {myLeaves.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Belum Ada Pengajuan Cuti / Izin</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Semua permohonan dispensasi kerja, izin sakit, atau cuti tahunan Anda beserta status persetujuan pimpinan akan tampil di sini.
                </p>
                <Link to="/internal/cuti-lembur" className="inline-block pt-1">
                  <Button variant="light" size="sm">Ajukan Cuti / Sakit Sekarang</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myLeaves.map((l) => {
                  const statusStr = (l.status || '').toLowerCase();
                  const isApproved = statusStr === 'disetujui' || statusStr === 'approved';
                  const isRejected = statusStr === 'ditolak' || statusStr === 'rejected';
                  const isPending = !isApproved && !isRejected;

                  return (
                    <div
                      key={l.id}
                      className={`p-3.5 rounded-[18px] border transition-all text-xs space-y-2 ${
                        isApproved
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : isRejected
                          ? 'bg-rose-50/50 border-rose-200'
                          : 'bg-amber-50/40 border-amber-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                            l.type === 'Sakit' ? 'bg-amber-100 text-amber-800' :
                            l.type === 'Cuti' ? 'bg-sky-100 text-sky-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {l.type}
                          </span>
                          <span className="font-bold text-[#004582]">
                            {new Date(l.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} s/d {new Date(l.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Status Badge & Approver Info */}
                        <div className="flex items-center gap-2">
                          {isApproved && (
                            <Badge variant="success" size="sm" className="font-bold">
                              Disetujui {l.approver_name ? `(${l.approver_name})` : ''}
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge variant="danger" size="sm" className="font-bold">
                              Ditolak {l.approver_name ? `(${l.approver_name})` : ''}
                            </Badge>
                          )}
                          {isPending && (
                            <Badge variant="warning" size="sm" className="font-bold">
                              Menunggu Persetujuan Pimpinan
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Reason */}
                      <p className="text-slate-600 font-medium">
                        <strong className="text-slate-700">Alasan:</strong> {l.reason}
                      </p>

                      {/* Rejection Note Warning if Rejected */}
                      {isRejected && (
                        <div className="p-2 rounded-[12px] bg-rose-100 text-rose-800 font-medium text-[11px] flex items-start gap-1.5">
                          <XCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-rose-600" />
                          <span>
                            <strong>Alasan Ditolak:</strong> {l.rejection_note || 'Pengajuan dispensasi tidak disetujui pimpinan.'}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Riwayat Pengajuan Lembur Tambahan (Jika Ada) */}
            {myOvertimes.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status Pengajuan Lembur Anda
                </span>
                <div className="space-y-1.5">
                  {myOvertimes.slice(0, 2).map((ot) => {
                    const isApproved = ot.status === 'disetujui' || ot.status === 'approved';
                    const isRejected = ot.status === 'ditolak' || ot.status === 'rejected';

                    return (
                      <div key={ot.id} className="p-2.5 rounded-[14px] bg-[#F0F6FB] flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#004582]">
                            Lembur {new Date(ot.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} ({ot.duration_hours} Jam)
                          </span>
                          <p className="text-[11px] text-slate-500">{ot.notes || 'Pekerjaan lembur'}</p>
                        </div>
                        <Badge
                          variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}
                          size="sm"
                        >
                          {isApproved ? 'Disetujui' : isRejected ? 'Ditolak' : 'Menunggu'}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DAFTAR TUGAS & TANGGUNG JAWAB AKTIF ANDA (UNTUK SETIAP PENGGUNA)          */}
      {/* ========================================================================= */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#004582] text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-extrabold text-[#004582] tracking-tight">
                  Tugas & Tanggung Jawab Aktif Anda
                </h2>
                {myAssignedTasks.length > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#DE0E86] text-white shadow-xs">
                    {myAssignedTasks.length} Tugas
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Semua Beres
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Pekerjaan yang ditugaskan kepada Anda atau menjadi tanggung jawab operasional Anda saat ini.
              </p>
            </div>
          </div>

          {/* Filter Kategori Tugas */}
          {myAssignedTasks.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setTaskCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  taskCategoryFilter === 'all'
                    ? 'bg-[#004582] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua ({myAssignedTasks.length})
              </button>
              {contentTasksCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTaskCategoryFilter('content')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    taskCategoryFilter === 'content'
                      ? 'bg-[#DE0E86] text-white shadow-sm'
                      : 'bg-pink-50 text-[#DE0E86] hover:bg-pink-100 border border-pink-100'
                  }`}
                >
                  Konten ({contentTasksCount})
                </button>
              )}
              {orderTasksCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTaskCategoryFilter('order')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    taskCategoryFilter === 'order'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'
                  }`}
                >
                  Pesanan ({orderTasksCount})
                </button>
              )}
              {approvalTasksCount > 0 && (
                <button
                  type="button"
                  onClick={() => setTaskCategoryFilter('approval')}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    taskCategoryFilter === 'approval'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100'
                  }`}
                >
                  Persetujuan ({approvalTasksCount})
                </button>
              )}
            </div>
          )}
        </div>

        {filteredTasks.length === 0 ? (
          <Card padding="p-8" className="text-center space-y-3 border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/60 rounded-[28px] shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-sm">
              <CheckCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-[#004582] tracking-tight">
                {myAssignedTasks.length === 0
                  ? 'Semua Tugas & Tanggung Jawab Telah Selesai!'
                  : 'Tidak ada tugas pada kategori filter ini'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {myAssignedTasks.length === 0
                  ? 'Tidak ada antrean tugas aktif yang membutuhkan tindakan Anda saat ini. Seluruh pekerjaan berjalan lancar!'
                  : 'Silakan pilih tombol filter "Semua" untuk melihat tugas aktif lainnya.'}
              </p>
            </div>
            {myAssignedTasks.length === 0 && (
              <div className="pt-2 flex justify-center gap-3">
                <Link to="/internal/konten">
                  <Button variant="light" size="sm">Buka Konten Promosi</Button>
                </Link>
                <Link to="/internal/pesanan">
                  <Button variant="light" size="sm">Buka Pesanan</Button>
                </Link>
              </div>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const isContent = task.task_type === 'content';
              const isHighPriority = task.is_high_priority;

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-[24px] border transition-all duration-200 p-5 flex flex-col justify-between gap-3.5 shadow-sm hover:shadow-md hover:-translate-y-0.5 group ${
                    isHighPriority
                      ? 'border-rose-300 ring-1 ring-rose-200/70'
                      : isContent
                      ? 'border-pink-200/90 hover:border-[#DE0E86]/50'
                      : 'border-slate-200/90 hover:border-[#004582]/40'
                  }`}
                >
                  {/* Top Row: Category + Platform + Priority + Status */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          task.badge_color === 'pink'
                            ? 'bg-pink-50 text-[#DE0E86] border-pink-200'
                            : task.badge_color === 'blue'
                            ? 'bg-blue-50 text-[#004582] border-blue-200'
                            : task.badge_color === 'indigo'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : task.badge_color === 'amber'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}
                      >
                        {task.category_label}
                      </span>

                      {task.platform && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700">
                          {task.platform_logo && (
                            <img
                              src={task.platform_logo}
                              alt=""
                              className="w-3.5 h-3.5 rounded object-cover flex-shrink-0"
                            />
                          )}
                          <span>{task.platform}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isHighPriority && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-extrabold uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>Prioritas Tinggi</span>
                        </span>
                      )}
                      {getTaskStatusBadge(task.status)}
                    </div>
                  </div>

                  {/* Middle Content */}
                  <div className="space-y-2">
                    <h3 className="text-base font-extrabold text-[#004582] tracking-tight group-hover:text-[#DE0E86] transition-colors">
                      {task.title}
                    </h3>

                    {task.description && (
                      <p className="text-xs text-slate-600 font-medium line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Role in Task */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs font-semibold">
                      <UserCheck className="w-3.5 h-3.5 text-[#DE0E86] flex-shrink-0" />
                      <span>
                        <strong className="text-slate-800 font-bold">Peran Anda:</strong> {task.my_role_label}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Target Date / Deadline + Action CTA */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Target: <strong className="text-slate-700 font-bold">{task.target_date}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {task.tracking_token && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/pesanan/${task.tracking_token}`);
                            addToast('Tautan pelacak pesanan klien berhasil disalin!', 'success');
                          }}
                          className="px-2.5 py-1.5 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#004582] hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          title="Salin Tautan Pelacak Klien"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Salin Link</span>
                        </button>
                      )}

                      {task.tracking_token && task.customer_phone && (
                        <a
                          href={`https://wa.me/${task.customer_phone.replace(/^0/, '62')}?text=${encodeURIComponent(
                            `Halo Kak ${task.customer_name || 'Pelanggan'}, berikut tautan pelacakan progres dan review desain kemasan box Anda di Kalebox: ${window.location.origin}/pesanan/${task.tracking_token}`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-[12px] bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1 shadow-xs"
                          title="Kirim Link ke WhatsApp Klien"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">WA Klien</span>
                        </a>
                      )}

                      <Link
                        to={task.action_url}
                        className="text-xs font-bold text-slate-500 hover:text-[#004582] px-2 py-1 transition-colors inline-flex items-center gap-1"
                        title="Buka Halaman Detail"
                      >
                        <span>Detail</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      {/* 1. TAHAP AWAL: Tombol "Mulai Kerjakan" */}
                      {(
                        (task.task_type === 'content' && (task.status === 'Ide' || task.status === 'Konten Antri')) ||
                        (task.task_type === 'order_design' && (task.status === 'Pesanan Telah Masuk' || task.status === 'Pesanan Diterima'))
                      ) && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Play}
                          onClick={() => handleStartWork(task)}
                          loading={actionLoadingTaskId === task.id}
                          className="font-bold shadow-xs bg-[#004582] hover:bg-[#003362]"
                        >
                          Mulai Kerjakan
                        </Button>
                      )}

                      {/* 2. TAHAP DI PROSES / REVISI: Tombol "Tambahkan Link & Ajukan" */}
                      {(
                        (task.task_type === 'content' && (task.status === 'Konten Di Proses' || task.status === 'Konten Sedang Revisi')) ||
                        (task.task_type === 'order_design' && (task.status === 'Pesanan Diproses' || task.status === 'Pesanan Sedang Revisi'))
                      ) && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Send}
                          onClick={() => handleOpenSubmitModal(task)}
                          className="font-bold shadow-xs bg-[#DE0E86] hover:bg-pink-700 text-white"
                        >
                          Tambahkan Link & Ajukan
                        </Button>
                      )}

                      {/* 3. TAHAP LANJUTAN: Siapkan Tayang (Konten Ok) */}
                      {task.task_type === 'content' && task.status === 'Konten Ok' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={ArrowRight}
                          onClick={() => handleAdvancePipeline(task, 'Konten Siap Tayang', 'Konten disetujui & siap tayang')}
                          loading={actionLoadingTaskId === task.id}
                          className="font-bold shadow-xs"
                        >
                          Siapkan Tayang
                        </Button>
                      )}

                      {/* 4. TAHAP LANJUTAN: Tandai Sudah Tayang */}
                      {task.task_type === 'content' && task.status === 'Konten Siap Tayang' && (
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCheck}
                          onClick={() => handleAdvancePipeline(task, 'Konten Sudah Tayang', 'Konten telah dipublikasikan ke media sosial')}
                          loading={actionLoadingTaskId === task.id}
                          className="font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Tandai Sudah Tayang
                        </Button>
                      )}

                      {/* 5. TAHAP OPERATOR CETAK: Mulai Cetak */}
                      {task.task_type === 'order_production' && task.status === 'Pesanan Diproses' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={Play}
                          onClick={() => handleStartWork(task)}
                          loading={actionLoadingTaskId === task.id}
                          className="font-bold shadow-xs bg-indigo-600 hover:bg-indigo-700"
                        >
                          Mulai Cetak
                        </Button>
                      )}

                      {/* 6. TAHAP OPERATOR CETAK: Selesai Cetak */}
                      {task.task_type === 'order_production' && task.status === 'Pesanan Sedang Dicetak' && (
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => handleAdvancePipeline(task, 'Pesanan Siap Diambil/Dikirim', 'Pesanan selesai dicetak')}
                          loading={actionLoadingTaskId === task.id}
                          className="font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Tandai Siap
                        </Button>
                      )}

                      {/* 7. TAHAP ADMIN: Kirim Link Review Desain ke Klien via WhatsApp */}
                      {task.task_type === 'order_design_share_client' && (
                        <Button
                          variant="primary"
                          size="sm"
                          icon={MessageCircle}
                          onClick={async () => {
                            try {
                              await api.put(`/orders/${task.source_id}/send-to-client`);
                              navigator.clipboard.writeText(`${window.location.origin}/pesanan/${task.tracking_token}`);
                              addToast('Tautan review desain berhasil disalin!', 'success');
                              if (task.customer_phone) {
                                const cleanPhone = task.customer_phone.replace(/^0/, '62');
                                const text = encodeURIComponent(
                                  `Halo Kak ${task.customer_name || 'Pelanggan'}, pratinjau desain pesanan kemasan Anda telah siap ditinjau! Silakan buka tautan berikut untuk memeriksa desain dan memberikan persetujuan (Oke/ACC) atau mengajukan revisian: ${window.location.origin}/pesanan/${task.tracking_token}`
                                );
                                window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
                              }
                              fetchDashboard();
                            } catch (err) {
                              addToast(err.response?.data?.message || 'Gagal mengirimkan review', 'error');
                            }
                          }}
                          className="font-bold shadow-xs bg-[#004582] text-white"
                        >
                          Kirim ke Klien (WA)
                        </Button>
                      )}

                      {/* 8. TAHAP ADMIN: Tandai Cetakan Sudah Siap */}
                      {task.task_type === 'order_mark_ready' && (
                        <Button
                          variant="success"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={async () => {
                            try {
                              await api.put(`/orders/${task.source_id}/mark-ready`);
                              addToast('Pesanan ditandai siap diambil atau dikirim! Tim produksi dinotifikasi.', 'success');
                              fetchDashboard();
                            } catch (err) {
                              addToast(err.response?.data?.message || 'Gagal mengubah status', 'error');
                            }
                          }}
                          className="font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Cetakan Sudah Siap
                        </Button>
                      )}

                      {/* 9. TAHAP PIMPINAN: Persetujuan Konten Promosi (Owner & Manager) */}
                      {task.task_type === 'content_manager_review' && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="success"
                            size="sm"
                            icon={CheckCircle2}
                            onClick={async () => {
                              try {
                                await api.put(`/contents/${task.source_id}/manager-review`, {
                                  decision: 'setuju',
                                });
                                addToast('Konten promosi berhasil disetujui (ACC) oleh Pimpinan!', 'success');
                                fetchDashboard();
                              } catch (err) {
                                addToast(err.response?.data?.message || 'Gagal menyetujui konten', 'error');
                              }
                            }}
                            className="font-bold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Setujui (ACC)
                          </Button>
                          <Link to={task.action_url}>
                            <Button variant="danger" size="sm" icon={RotateCcw} className="font-bold shadow-xs">
                              Minta Revisi
                            </Button>
                          </Link>
                        </div>
                      )}

                      {/* 10. FALLBACK ACTION (e.g. Verifikasi Admin & Tugas Lainnya) */}
                      {task.task_type !== 'content' &&
                       task.task_type !== 'order_design' &&
                       task.task_type !== 'order_production' &&
                       task.task_type !== 'order_design_share_client' &&
                       task.task_type !== 'order_mark_ready' &&
                       task.task_type !== 'content_manager_review' && (
                        <Link to={task.action_url}>
                          <Button variant="primary" size="sm" icon={ArrowRight} className="font-bold shadow-xs">
                            {task.action_label}
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. EXECUTIVE VIEW (Owner & Manager)                                       */}
      {/* ========================================================================= */}
      {isExecutive && stats && (
        <div className="space-y-8">
          {/* Revenue & Cashflow Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card padding="p-6" className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Total Pemasukan Kas</span>
                <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                Rp {Number(stats.total_revenue || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Akumulasi transaksi masuk terverifikasi</p>
            </Card>

            <Card padding="p-6" className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Total Pengeluaran Kas</span>
                <div className="p-2 rounded-full bg-rose-50 text-rose-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-rose-700">
                Rp {Number(stats.total_expenses || 0).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Bahan baku, operasional, dan gaji</p>
            </Card>

            <Card padding="p-6" className="space-y-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
                <span>Saldo Kas Bersih</span>
                <div className="p-2 rounded-full bg-[#F0F6FB] text-[#004582]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[#004582]">
                Rp {Number((stats.total_revenue || 0) - (stats.total_expenses || 0)).toLocaleString('id-ID')}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">Laba operasional saat ini</p>
            </Card>
          </div>

          {/* Orders Pipeline Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card padding="p-4" className="text-center space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Total Pesanan</p>
              <p className="text-2xl font-extrabold text-[#004582]">{stats.orders_summary?.total || 0}</p>
            </Card>
            <Card padding="p-4" className="text-center space-y-1">
              <p className="text-[11px] font-bold text-amber-600 uppercase">Menunggu</p>
              <p className="text-2xl font-extrabold text-amber-600">{stats.orders_summary?.masuk || 0}</p>
            </Card>
            <Card padding="p-4" className="text-center space-y-1">
              <p className="text-[11px] font-bold text-sky-600 uppercase">Diproses Desain</p>
              <p className="text-2xl font-extrabold text-sky-600">{stats.orders_summary?.diproses || 0}</p>
            </Card>
            <Card padding="p-4" className="text-center space-y-1">
              <p className="text-[11px] font-bold text-fuchsia-600 uppercase">Revisi</p>
              <p className="text-2xl font-extrabold text-[#DE0E86]">{stats.orders_summary?.revisi || 0}</p>
            </Card>
            <Card padding="p-4" className="text-center space-y-1">
              <p className="text-[11px] font-bold text-indigo-600 uppercase">Dicetak</p>
              <p className="text-2xl font-extrabold text-indigo-600">{stats.orders_summary?.dicetak || 0}</p>
            </Card>
            <Card padding="p-4" className="text-center space-y-1">
              <p className="text-[11px] font-bold text-emerald-600 uppercase">Siap / Selesai</p>
              <p className="text-2xl font-extrabold text-emerald-600">{stats.orders_summary?.siap || 0}</p>
            </Card>
          </div>

          {/* Priority & Deadline Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Urgent Deadline <= 12 hours */}
            <Card padding="p-6" className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Mendekati Deadline (Maks 12 Jam)</span>
                </div>
                <Badge variant="danger" size="sm">{stats.deadline_soon_orders?.length || 0}</Badge>
              </div>

              {stats.deadline_soon_orders?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Tidak ada pesanan kritis mendekati deadline</p>
              ) : (
                <div className="space-y-3">
                  {stats.deadline_soon_orders?.map((ord) => (
                    <div key={ord.id} className="p-3 rounded-[20px] bg-rose-50 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-rose-900">{ord.order_number}</p>
                        <p className="text-rose-700">{ord.product?.name} • {ord.quantity} pcs</p>
                      </div>
                      <Link to={`/internal/pesanan?id=${ord.id}`}>
                        <Button variant="danger" size="sm">Tinjau</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Attendance Summary */}
            <Card padding="p-6" className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#004582] font-bold text-sm">
                  <Users2 className="w-5 h-5 text-[#DE0E86]" />
                  <span>Presensi Seluruh Karyawan Hari Ini</span>
                </div>
                <Link to="/internal/presensi">
                  <span className="text-xs font-bold text-[#DE0E86] hover:underline">Kelola</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-emerald-50 rounded-[18px]">
                  <p className="text-[11px] font-bold text-emerald-800">Hadir Tepat</p>
                  <p className="text-xl font-extrabold text-emerald-700">
                    {(stats.attendance_today?.total_present || 0) - (stats.attendance_today?.total_late || 0)}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-[18px]">
                  <p className="text-[11px] font-bold text-amber-800">Terlambat</p>
                  <p className="text-xl font-extrabold text-amber-700">{stats.attendance_today?.total_late || 0}</p>
                </div>
                <div className="p-3 bg-sky-50 rounded-[18px]">
                  <p className="text-[11px] font-bold text-sky-800">Izin / Cuti</p>
                  <p className="text-xl font-extrabold text-sky-700">{stats.attendance_today?.total_leave || 0}</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-[18px]">
                  <p className="text-[11px] font-bold text-rose-800">Tidak Masuk</p>
                  <p className="text-xl font-extrabold text-rose-700">{stats.attendance_today?.total_absent || 0}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ADMIN VIEW                                                             */}
      {/* ========================================================================= */}
      {isAdmin && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card padding="p-6" className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Pesanan Perlu Verifikasi</p>
              <p className="text-3xl font-extrabold text-amber-600">{stats.new_orders?.length || 0}</p>
              <p className="text-[11px] text-slate-500">Cek bukti transfer pembayaran</p>
            </Card>

            <Card padding="p-6" className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Revisi Menunggu</p>
              <p className="text-3xl font-extrabold text-[#DE0E86]">{stats.pending_revisions?.length || 0}</p>
              <p className="text-[11px] text-slate-500">Catatan revisi dari pelanggan</p>
            </Card>

            <Card padding="p-6" className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Desain Siap Cetak</p>
              <p className="text-3xl font-extrabold text-indigo-600">{stats.ready_to_print?.length || 0}</p>
              <p className="text-[11px] text-slate-500">ACC klien telah selesai</p>
            </Card>

            <Card padding="p-6" className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Siap Kirim / Diambil</p>
              <p className="text-3xl font-extrabold text-emerald-600">{stats.ready_for_pickup?.length || 0}</p>
              <p className="text-[11px] text-slate-500">Produksi selesai</p>
            </Card>
          </div>

          {/* New Orders Table */}
          <Card padding="p-6" className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-[#004582]">Pesanan Baru Menunggu Verifikasi</h3>
              <Link to="/internal/pesanan">
                <span className="text-xs font-bold text-[#DE0E86] hover:underline">Kelola di Pesanan</span>
              </Link>
            </div>
            {stats.new_orders?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Semua pesanan telah terverifikasi</p>
            ) : (
              <div className="space-y-3">
                {stats.new_orders?.map((ord) => (
                  <div key={ord.id} className="p-3 bg-[#F0F6FB] rounded-[20px] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-[#004582]">{ord.order_number} • {ord.client?.name}</p>
                      <p className="text-slate-500">{ord.product?.name} • Rp {Number(ord.total_amount).toLocaleString('id-ID')}</p>
                    </div>
                    <Link to={`/internal/pesanan?id=${ord.id}`}>
                      <Button variant="primary" size="sm">Verifikasi</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DESIGNER VIEW                                                          */}
      {/* ========================================================================= */}
      {isDesign && stats && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card padding="p-6" className="space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Tugas Desain Aktif</p>
              <p className="text-3xl font-extrabold text-[#004582]">{stats.my_orders_count || 0}</p>
              <p className="text-[11px] text-slate-500">Antrean desain Anda</p>
            </Card>

            <Card padding="p-6" className="space-y-2">
              <p className="text-xs font-bold text-rose-600 uppercase">Deadline Urgent (&le;12 Jam)</p>
              <p className="text-3xl font-extrabold text-rose-600">{stats.deadline_urgent?.length || 0}</p>
              <p className="text-[11px] text-slate-500">Segera selesaikan layout</p>
            </Card>

            <Card padding="p-6" className="space-y-2">
              <p className="text-xs font-bold text-[#DE0E86] uppercase">Permintaan Revisi</p>
              <p className="text-3xl font-extrabold text-[#DE0E86]">{stats.revisions_to_do?.length || 0}</p>
              <p className="text-[11px] text-slate-500">Perlu perbaikan layout</p>
            </Card>
          </div>

          {/* Urgent Deadline Tasks */}
          {stats.deadline_urgent?.length > 0 && (
            <Card padding="p-6" className="bg-rose-50 space-y-4">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Peringatan Deadline Desain Segera Berakhir</span>
              </div>
              <div className="space-y-2">
                {stats.deadline_urgent.map((ord) => (
                  <div key={ord.id} className="p-3 bg-white rounded-[18px] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-rose-900">{ord.order_number} • {ord.product?.name}</p>
                      <p className="text-slate-500">Batas: {new Date(ord.deadline).toLocaleString('id-ID')}</p>
                    </div>
                    <Link to={`/internal/pesanan?id=${ord.id}`}>
                      <Button variant="danger" size="sm">Upload Desain</Button>
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Revisions to do */}
          <Card padding="p-6" className="space-y-4">
            <h3 className="font-bold text-[#004582] pb-2 border-b border-slate-100">
              Daftar Revisi Yang Harus Dikerjakan
            </h3>
            {stats.revisions_to_do?.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Tidak ada revisi aktif. Kerja bagus!</p>
            ) : (
              <div className="space-y-3">
                {stats.revisions_to_do?.map((ord) => (
                  <div key={ord.id} className="p-4 bg-[#F0F6FB] rounded-[20px] space-y-2 text-xs">
                    <div className="flex justify-between items-center font-bold text-[#004582]">
                      <span>{ord.order_number} ({ord.product?.name})</span>
                      <Link to={`/internal/pesanan?id=${ord.id}`}>
                        <Button variant="primary" size="sm">Tindak Lanjuti</Button>
                      </Link>
                    </div>
                    {ord.revisions?.[0] && (
                      <p className="bg-white p-3 rounded-[14px] text-slate-600">
                        <strong>Catatan Klien:</strong> {ord.revisions[0].notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PRODUCTION STAFF VIEW                                                  */}
      {/* ========================================================================= */}
      {isStaff && stats && (
        <div className="space-y-8">
          <Card padding="p-6" className="space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <Printer className="w-5 h-5 text-[#DE0E86]" />
              <h3 className="font-bold text-[#004582]">Antrean Cetak & Produksi Box Anda</h3>
            </div>

            {stats.production_tasks?.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">Belum ada tugas cetak yang ditugaskan ke Anda</p>
            ) : (
              <div className="space-y-3">
                {stats.production_tasks?.map((ord) => (
                  <div key={ord.id} className="p-4 bg-[#F0F6FB] rounded-[24px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#004582]">{ord.order_number}</span>
                        <Badge variant="primary" size="sm">{ord.status}</Badge>
                      </div>
                      <p className="font-semibold text-slate-700">{ord.product?.name} • {ord.quantity} pcs</p>
                      <p className="text-slate-500">
                        Ukuran: {ord.custom_length_cm}x{ord.custom_width_cm}x{ord.custom_height_cm} cm • Finishing: {ord.finishing?.name || 'Tanpa Finishing'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a href={`http://localhost:8000/api/orders/${ord.id}/spk-pdf`} target="_blank" rel="noreferrer">
                        <Button variant="light" size="sm">Cetak SPK</Button>
                      </a>
                      <Link to={`/internal/pesanan?id=${ord.id}`}>
                        <Button variant="primary" size="sm">Tandai Siap</Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Tambahkan Link & Ajukan Hasil Karya                                */}
      {/* ========================================================================= */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title={
          activeTaskToSubmit?.task_type === 'content'
            ? 'Ajukan Hasil Konten Promosi'
            : 'Ajukan Tautan Desain Pesanan'
        }
        subtitle={`Tugas: ${activeTaskToSubmit?.title}`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitWork} className="space-y-4 text-left">
          <div className="p-3 bg-[#F0F6FB] rounded-2xl border border-blue-100 text-xs">
            <span className="text-slate-500 font-medium">Peran Tanggung Jawab: </span>
            <strong className="text-[#004582] font-bold">{activeTaskToSubmit?.my_role_label}</strong>
          </div>

          <Input
            label="Tautan Link Hasil Desain / Karya / File"
            required
            type="url"
            value={submitLink}
            onChange={(e) => setSubmitLink(e.target.value)}
            placeholder="https://drive.google.com/... atau https://canva.com/... atau https://figma.com/..."
            helper="Lampirkan link Google Drive, Canva, Figma, atau link cloud file desain Anda."
          />

          {activeTaskToSubmit?.task_type === 'content' && (
            <Textarea
              label="Naskah / Caption Copywriting (Opsional)"
              rows={3}
              value={submitCaption}
              onChange={(e) => setSubmitCaption(e.target.value)}
              placeholder="Tuliskan naskah teks postingan, hashtag, atau instruksi tayang..."
            />
          )}

          <Textarea
            label="Catatan Tambahan / Penjelasan ke Pimpinan / Admin (Opsional)"
            rows={2}
            value={submitNotes}
            onChange={(e) => setSubmitNotes(e.target.value)}
            placeholder="Catatan mengenai layout, revisi yang telah diperbaiki, dll..."
          />

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSubmitModalOpen(false)}
              disabled={isSubmittingTask}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmittingTask}
              disabled={isSubmittingTask}
              icon={Send}
              className="shadow-sm"
            >
              Ajukan Sekarang
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DashboardPage;
