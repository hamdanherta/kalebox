import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';
import { openPdfDocument } from '../../utils/pdfDownloader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  Clock,
  Camera,
  MapPin,
  CheckCircle2,
  FileDown,
  Calendar,
  Users2,
  AlertTriangle,
  History,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

export const AttendancePage = () => {
  const { user, role } = useAuth();
  const { addToast } = useToast();

  const isSupervisor = ['owner', 'manager'].includes(role);
  const [activeTab, setActiveTab] = useState(isSupervisor ? 'daily' : 'my_history');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [dailyAttendances, setDailyAttendances] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Photo viewer modal
  const [viewPhoto, setViewPhoto] = useState(null);

  // Manual / Edit Attendance Modal
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [attendanceForm, setAttendanceForm] = useState({
    employee_id: '',
    date: new Date().toISOString().substring(0, 10),
    status: 'Hadir',
    check_in_time: '08:00',
    check_out_time: '17:00',
    is_late: false,
    notes: '',
  });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDailyAttendances = async () => {
    if (!isSupervisor && activeTab === 'daily') {
      setActiveTab('my_history');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get(`/attendance/all?date=${selectedDate}`);
      if (res.data?.status === 'success' || res.data?.data) {
        setDailyAttendances(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load daily attendance', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyHistory = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/attendance/history');
      if (res.data?.status === 'success' || res.data?.data) {
        setMyHistory(res.data.data?.data || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load my attendance history', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    if (!isSupervisor) return;
    try {
      const res = await api.get('/employees?per_page=100');
      if (res.data?.data) {
        setEmployees(res.data.data?.data || res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load employees list', err);
    }
  };

  useEffect(() => {
    fetchEmployeesList();
  }, [role]);

  useEffect(() => {
    if (activeTab === 'daily' && isSupervisor) {
      fetchDailyAttendances();
    } else {
      fetchMyHistory();
    }
  }, [activeTab, selectedDate]);

  const handleOpenCreateModal = () => {
    setEditingAttendance(null);
    setAttendanceForm({
      employee_id: employees[0]?.id || '',
      date: selectedDate,
      status: 'Hadir',
      check_in_time: '08:00',
      check_out_time: '17:00',
      is_late: false,
      notes: '',
    });
    setAttendanceModalOpen(true);
  };

  const handleOpenEditModal = (att) => {
    setEditingAttendance(att);
    setAttendanceForm({
      employee_id: att.employee_id,
      date: att.date ? att.date.substring(0, 10) : selectedDate,
      status: att.status || 'Hadir',
      check_in_time: att.check_in_time ? att.check_in_time.substring(0, 5) : '08:00',
      check_out_time: att.check_out_time ? att.check_out_time.substring(0, 5) : '',
      is_late: Boolean(att.is_late),
      notes: att.notes || '',
    });
    setAttendanceModalOpen(true);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    try {
      if (editingAttendance) {
        await api.put(`/attendance/${editingAttendance.id}`, attendanceForm);
        addToast('Data presensi berhasil diperbarui', 'success');
      } else {
        await api.post('/attendance/manual', attendanceForm);
        addToast('Presensi karyawan berhasil dicatat', 'success');
      }
      setAttendanceModalOpen(false);
      fetchDailyAttendances();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan data presensi', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/attendance/${deleteDialog.id}`);
      addToast('Data presensi berhasil dihapus', 'success');
      setDeleteDialog({ isOpen: false, id: null, name: '' });
      fetchDailyAttendances();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menghapus data presensi', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="secondary" size="md">Presensi & Disiplin</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Data Presensi Karyawan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Verifikasi kehadiran berbasis kamera selfie dan geofence GPS presisi radius 10 meter.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isSupervisor && activeTab === 'daily' && (
            <>
              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={handleOpenCreateModal}
              >
                Catat Presensi Manual
              </Button>

              <Button
                variant="light"
                size="md"
                icon={FileDown}
                onClick={() => {
                  openPdfDocument(`/attendance/daily-pdf?date=${selectedDate}`, `presensi_harian_${selectedDate}`);
                }}
              >
                Download PDF Harian
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs & Date filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="bg-[#F0F6FB] p-1.5 rounded-[20px] inline-flex items-center gap-1">
          {isSupervisor && (
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-5 py-2.5 rounded-[16px] text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-white text-[#DE0E86] shadow-sm'
                  : 'text-[#004582] hover:text-[#DE0E86]'
              }`}
            >
              Presensi Seluruh Karyawan
            </button>
          )}
          <button
            onClick={() => setActiveTab('my_history')}
            className={`px-5 py-2.5 rounded-[16px] text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'my_history'
                ? 'bg-white text-[#DE0E86] shadow-sm'
                : 'text-[#004582] hover:text-[#DE0E86]'
            }`}
          >
            Riwayat Presensi Saya
          </button>
        </div>

        {activeTab === 'daily' && isSupervisor && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#004582]">Pilih Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white px-4 py-2 rounded-[16px] text-xs font-bold text-[#004582] shadow-sm outline-none border border-slate-200"
            />
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton height="h-20" rounded="rounded-[32px]" />
          <Skeleton height="h-20" rounded="rounded-[32px]" />
        </div>
      ) : activeTab === 'daily' && isSupervisor ? (
        <Card padding="p-6 md:p-8" className="space-y-4">
          {dailyAttendances.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Belum Ada Presensi Hari Ini"
              description={`Belum ada catatan presensi karyawan untuk tanggal ${selectedDate}.`}
              actionLabel="Catat Presensi Manual"
              onAction={handleOpenCreateModal}
            />
          ) : (
            <Table
              headers={[
                { label: 'Foto Selfie', className: 'w-16 text-center' },
                { label: 'Nama Karyawan', className: 'min-w-[180px] text-left' },
                { label: 'Jabatan & Divisi', className: 'text-left' },
                { label: 'Jam Masuk', className: 'text-center' },
                { label: 'Jam Pulang', className: 'text-center' },
                { label: 'Jarak GPS', className: 'text-center' },
                { label: 'Status', className: 'w-24 text-center' },
                { label: 'Catatan', className: 'text-left' },
                { label: 'Aksi', className: 'w-24 text-right' },
              ]}
            >
              {dailyAttendances.map((att) => (
                <tr key={att.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-3 px-4 text-center whitespace-nowrap align-middle">
                    {(att.check_in_photo || att.photo_in) ? (
                      <button
                        onClick={() => setViewPhoto(getImageUrl(att.check_in_photo || att.photo_in))}
                        className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 hover:ring-2 hover:ring-[#DE0E86] hover:scale-105 transition-all cursor-pointer shadow-sm relative group bg-slate-100 inline-block align-middle"
                        title="Klik untuk memperbesar foto selfie"
                      >
                        <img
                          src={getImageUrl(att.check_in_photo || att.photo_in)}
                          alt="Foto Masuk"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center text-slate-400">
                          <Camera className="w-4 h-4" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto" title="Belum ada foto">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-bold text-xs text-[#004582] whitespace-nowrap align-middle">
                    {att.employee?.name || '-'}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap align-middle">
                    <p className="font-semibold text-[#004582]">{att.employee?.position?.name || '-'}</p>
                    <p className="text-[11px] text-slate-400">{att.employee?.division?.name || '-'}</p>
                  </td>
                  <td className="py-3 px-4 font-bold font-mono text-xs text-[#004582] text-center whitespace-nowrap align-middle">
                    {att.check_in_time ? att.check_in_time.substring(0, 5) : '-'}
                  </td>
                  <td className="py-3 px-4 font-bold font-mono text-xs text-[#004582] text-center whitespace-nowrap align-middle">
                    {att.check_out_time ? att.check_out_time.substring(0, 5) : '-'}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-600 text-center whitespace-nowrap align-middle">
                    {(att.distance_meter ?? att.distance_meters) !== null && (att.distance_meter ?? att.distance_meters) !== undefined
                      ? `${Math.round(Number(att.distance_meter ?? att.distance_meters))} m`
                      : '-'}
                  </td>
                  <td className="py-3 px-4 text-center whitespace-nowrap align-middle">
                    <Badge
                      variant={
                        att.is_late
                          ? 'warning'
                          : att.status === 'Masuk' || att.status === 'Hadir'
                          ? 'success'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {att.is_late ? 'Terlambat' : att.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-500 max-w-xs truncate align-middle">
                    {att.notes || '-'}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap align-middle">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(att)}
                        className="p-1.5 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all cursor-pointer shadow-sm"
                        title="Edit Status Presensi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            id: att.id,
                            name: `Presensi ${att.employee?.name || 'Karyawan'} (${att.date})`,
                          })
                        }
                        className="p-1.5 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer shadow-sm"
                        title="Hapus Presensi"
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
      ) : (
        /* My Attendance History */
        <Card padding="p-6 md:p-8" className="space-y-4">
          {myHistory.length === 0 ? (
            <EmptyState
              icon={History}
              title="Belum Ada Riwayat Presensi"
              description="Anda belum memiliki catatan presensi masuk atau pulang."
            />
          ) : (
            <Table
              headers={['Tanggal', 'Jam Masuk', 'Jam Pulang', 'Jarak GPS', 'Status', 'Foto']}
            >
              {myHistory.map((item) => (
                <tr key={item.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#004582]">
                    {new Date(item.date).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-700">
                    {item.check_in_time ? item.check_in_time.substring(0, 5) : '-'}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-700">
                    {item.check_out_time ? item.check_out_time.substring(0, 5) : '-'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500 font-mono">
                    ±{Math.round(Number(item.distance_meter ?? item.distance_meters ?? 0))} meter
                  </td>
                  <td className="py-4 px-6">
                    <Badge
                      variant={item.is_late ? 'warning' : 'success'}
                      size="sm"
                    >
                      {item.is_late ? 'Terlambat' : item.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    {(item.check_in_photo || item.photo_in) ? (
                      <button
                        onClick={() => setViewPhoto(getImageUrl(item.check_in_photo || item.photo_in))}
                        className="text-xs text-[#DE0E86] font-bold hover:underline cursor-pointer flex items-center gap-1.5"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Lihat Foto</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {/* Manual / Edit Attendance Modal */}
      <Modal
        isOpen={attendanceModalOpen}
        onClose={() => setAttendanceModalOpen(false)}
        title={editingAttendance ? 'Edit Status Presensi Karyawan' : 'Catat Presensi Manual'}
        subtitle="Kelola status kehadiran, jam kedatangan/pulang, dan catatan verifikasi"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveAttendance} className="space-y-4 text-left">
          {!editingAttendance && (
            <Select
              label="Pilih Karyawan"
              required
              value={attendanceForm.employee_id}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, employee_id: e.target.value })}
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
              label="Tanggal"
              type="date"
              required
              value={attendanceForm.date}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
            />
            <Select
              label="Status Kehadiran"
              required
              value={attendanceForm.status}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
            >
              <option value="Hadir">Hadir (Tepat Waktu)</option>
              <option value="Masuk">Masuk</option>
              <option value="Terlambat">Terlambat</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
              <option value="Cuti">Cuti</option>
              <option value="Tidak Masuk">Tidak Masuk (Alpha)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jam Masuk"
              type="time"
              value={attendanceForm.check_in_time}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, check_in_time: e.target.value })}
            />
            <Input
              label="Jam Pulang"
              type="time"
              value={attendanceForm.check_out_time}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, check_out_time: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_late"
              checked={attendanceForm.is_late}
              onChange={(e) => setAttendanceForm({ ...attendanceForm, is_late: e.target.checked })}
              className="w-4 h-4 rounded text-[#DE0E86] focus:ring-[#DE0E86] border-slate-300 cursor-pointer"
            />
            <label htmlFor="is_late" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
              Tandai sebagai Terlambat
            </label>
          </div>

          <Input
            label="Catatan / Keterangan (Opsional)"
            placeholder="Misal: Izin membawa surat dokter / Disposisi tugas luar"
            value={attendanceForm.notes}
            onChange={(e) => setAttendanceForm({ ...attendanceForm, notes: e.target.value })}
          />

          <Button type="submit" variant="primary" className="w-full">
            {editingAttendance ? 'Perbarui Data Presensi' : 'Simpan Presensi Manual'}
          </Button>
        </form>
      </Modal>

      {/* Photo Viewer Modal */}
      {viewPhoto && (
        <Modal
          isOpen={!!viewPhoto}
          onClose={() => setViewPhoto(null)}
          title="Foto Presensi Selfie"
          subtitle="Verifikasi kehadiran wajah di area kantor"
          maxWidth="max-w-sm"
        >
          <div className="space-y-4">
            <div className="aspect-square rounded-[24px] overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
              <img src={getImageUrl(viewPhoto)} alt="Selfie" className="w-full h-full object-cover" />
            </div>
            <Button variant="light" className="w-full" onClick={() => setViewPhoto(null)}>
              Tutup
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Presensi"
        message={`Apakah Anda yakin ingin menghapus catatan presensi "${deleteDialog.name}"? Data yang dihapus tidak dapat dipulihkan.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AttendancePage;
