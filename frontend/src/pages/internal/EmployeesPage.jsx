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
import { Table } from '../../components/common/Table';
import { Skeleton } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import {
  UserCheck,
  KeyRound,
  Briefcase,
  Clock,
  Gift,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Calendar,
  Lock,
} from 'lucide-react';

export const EmployeesPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isExecutive = ['owner', 'manager'].includes(role);
  const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'invitations', 'divisions', 'positions', 'schedules', 'bonuses'
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [employees, setEmployees] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [positions, setPositions] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [bonuses, setBonuses] = useState([]);

  // 1. Employee Modal State
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    phone: '',
    division_id: '',
    position_id: '',
    employee_status_id: 1,
    work_schedule_id: '',
    basic_salary: '',
    allowance: '',
  });

  // 2. Invitation Code Modal State
  const [invitationModalOpen, setInvitationModalOpen] = useState(false);
  const [invitationForm, setInvitationForm] = useState({
    role_id: 4, // default Design
    division_id: '',
    expires_at: '',
  });

  // 3. Division Modal State
  const [divisionModalOpen, setDivisionModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState(null);
  const [divisionForm, setDivisionForm] = useState({ name: '' });

  // 4. Position Modal State
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [positionForm, setPositionForm] = useState({ name: '', division_id: '' });

  // 5. Schedule Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    start_time: '08:00',
    end_time: '17:00',
    work_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    is_active: true,
  });

  // 6. Bonus Modal State
  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [editingBonus, setEditingBonus] = useState(null);
  const [bonusForm, setBonusForm] = useState({ name: '', amount: '', description: '' });

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, type: '', id: null, name: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAll = async () => {
    if (!isExecutive) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [empRes, invRes, divRes, posRes, schRes, bonRes] = await Promise.all([
        api.get('/employees?per_page=100'),
        api.get('/registration-codes'),
        api.get('/divisions'),
        api.get('/positions'),
        api.get('/work-schedules'),
        api.get('/bonuses'),
      ]);

      if (empRes.data?.data) setEmployees(empRes.data.data?.data || empRes.data.data || []);
      if (invRes.data?.data) setInvitations(invRes.data.data || []);
      if (divRes.data?.data) setDivisions(divRes.data.data || []);
      if (posRes.data?.data) setPositions(posRes.data.data || []);
      if (schRes.data?.data) setSchedules(schRes.data.data || []);
      if (bonRes.data?.data) setBonuses(bonRes.data.data || []);
    } catch (err) {
      console.error('Failed to load employee data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Handlers
  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, employeeForm);
        addToast('Data karyawan berhasil diperbarui', 'success');
      } else {
        await api.post('/employees', employeeForm);
        addToast('Karyawan baru berhasil ditambahkan', 'success');
      }
      setEmployeeModalOpen(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan data karyawan', 'error');
    }
  };

  const handleCreateInvitation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/registration-codes', invitationForm);
      if (res.data?.data) {
        addToast(`Kode undangan ${res.data.data?.code} berhasil dibuat!`, 'success');
        setInvitationModalOpen(false);
        fetchAll();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal membuat kode undangan', 'error');
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    addToast(`Kode ${code} disalin ke clipboard!`, 'info');
  };

  const handleSaveDivision = async (e) => {
    e.preventDefault();
    try {
      if (editingDivision) {
        await api.put(`/divisions/${editingDivision.id}`, divisionForm);
        addToast('Divisi berhasil diperbarui', 'success');
      } else {
        await api.post('/divisions', divisionForm);
        addToast('Divisi baru berhasil ditambahkan', 'success');
      }
      setDivisionModalOpen(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan divisi', 'error');
    }
  };

  const handleSavePosition = async (e) => {
    e.preventDefault();
    try {
      if (editingPosition) {
        await api.put(`/positions/${editingPosition.id}`, positionForm);
        addToast('Jabatan berhasil diperbarui', 'success');
      } else {
        await api.post('/positions', positionForm);
        addToast('Jabatan baru berhasil ditambahkan', 'success');
      }
      setPositionModalOpen(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan jabatan', 'error');
    }
  };

  const handleSaveSchedule = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await api.put(`/work-schedules/${editingSchedule.id}`, scheduleForm);
        addToast('Jadwal kerja berhasil diperbarui', 'success');
      } else {
        await api.post('/work-schedules', scheduleForm);
        addToast('Jadwal kerja baru berhasil ditambahkan', 'success');
      }
      setScheduleModalOpen(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan jadwal kerja', 'error');
    }
  };

  const handleSaveBonus = async (e) => {
    e.preventDefault();
    try {
      if (editingBonus) {
        await api.put(`/bonuses/${editingBonus.id}`, bonusForm);
        addToast('Master bonus berhasil diperbarui', 'success');
      } else {
        await api.post('/bonuses', bonusForm);
        addToast('Master bonus baru berhasil ditambahkan', 'success');
      }
      setBonusModalOpen(false);
      fetchAll();
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan bonus', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const endpointMap = {
        employees: '/employees',
        invitations: '/registration-codes',
        divisions: '/divisions',
        positions: '/positions',
        schedules: '/work-schedules',
        bonuses: '/bonuses',
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

  const toggleWorkDay = (day) => {
    setScheduleForm((prev) => {
      const exists = prev.work_days.includes(day);
      return {
        ...prev,
        work_days: exists ? prev.work_days.filter((d) => d !== day) : [...prev.work_days, day],
      };
    });
  };

  if (!isExecutive) {
    return (
      <div className="py-12 text-left">
        <Card padding="p-8 md:p-12" className="text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[#004582]">Akses Terbatas (Khusus Owner & Manajer)</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Modul Data Karyawan & HR hanya dapat diakses dan dikelola oleh Owner dan Manajer Operasional.
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
          <Badge variant="secondary" size="md">Manajemen SDM</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
            Data Karyawan & Struktur Tim
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Kelola profil pegawai, divisi, jabatan, jadwal shift kerja, dan master insentif/bonus.
          </p>
        </div>

        {/* Dynamic Action Button based on Active Tab */}
        <div className="flex items-center gap-3">
          {activeTab === 'employees' && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingEmployee(null);
                setEmployeeForm({
                  name: '',
                  email: '',
                  phone: '',
                  division_id: divisions[0]?.id || '',
                  position_id: positions[0]?.id || '',
                  employee_status_id: 1,
                  work_schedule_id: schedules[0]?.id || '',
                  basic_salary: 3000000,
                  allowance: 500000,
                });
                setEmployeeModalOpen(true);
              }}
            >
              Tambah Karyawan
            </Button>
          )}

          {activeTab === 'invitations' && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setInvitationForm({
                  role_id: 4,
                  division_id: divisions[0]?.id || '',
                  expires_at: '',
                });
                setInvitationModalOpen(true);
              }}
            >
              Generate Kode Undangan
            </Button>
          )}

          {activeTab === 'divisions' && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingDivision(null);
                setDivisionForm({ name: '' });
                setDivisionModalOpen(true);
              }}
            >
              Tambah Divisi
            </Button>
          )}

          {activeTab === 'positions' && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingPosition(null);
                setPositionForm({
                  name: '',
                  division_id: divisions[0]?.id || '',
                });
                setPositionModalOpen(true);
              }}
            >
              Tambah Jabatan
            </Button>
          )}

          {activeTab === 'schedules' && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingSchedule(null);
                setScheduleForm({
                  name: '',
                  start_time: '08:00',
                  end_time: '17:00',
                  work_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
                  is_active: true,
                });
                setScheduleModalOpen(true);
              }}
            >
              Tambah Jadwal Shift
            </Button>
          )}

          {activeTab === 'bonuses' && (
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => {
                setEditingBonus(null);
                setBonusForm({
                  name: '',
                  amount: '',
                  description: '',
                });
                setBonusModalOpen(true);
              }}
            >
              Tambah Master Bonus
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#F0F6FB] p-1.5 rounded-[22px] inline-flex items-center gap-1 overflow-x-auto max-w-full">
        {[
          { key: 'employees', label: 'Data Karyawan', icon: UserCheck },
          { key: 'divisions', label: 'Divisi', icon: Briefcase },
          { key: 'positions', label: 'Jabatan', icon: Briefcase },
          { key: 'schedules', label: 'Jadwal Kerja', icon: Clock },
          { key: 'bonuses', label: 'Master Bonus', icon: Gift },
          { key: 'invitations', label: 'Kode Undangan', icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[16px] text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
            <Skeleton height="h-16" rounded="rounded-[20px]" />
          </div>
        ) : activeTab === 'employees' ? (
          /* TAB 1: EMPLOYEES */
          employees.length === 0 ? (
            <EmptyState
              icon={UserCheck}
              title="Belum Ada Karyawan Terdaftar"
              description="Tambahkan data pegawai baru untuk mulai mengelola presensi, penugasan SPK cetak, dan penggajian."
              actionLabel="Tambah Karyawan Baru"
              onAction={() => {
                setEditingEmployee(null);
                setEmployeeForm({
                  name: '',
                  email: '',
                  phone: '',
                  division_id: divisions[0]?.id || '',
                  position_id: positions[0]?.id || '',
                  employee_status_id: 1,
                  work_schedule_id: schedules[0]?.id || '',
                  basic_salary: 3000000,
                  allowance: 500000,
                });
                setEmployeeModalOpen(true);
              }}
            />
          ) : (
            <Table
              headers={[
                'Nama Karyawan',
                'Email & Kontak',
                'Divisi',
                'Jabatan',
                'Jadwal Shift',
                'Gaji Pokok',
                'Aksi',
              ]}
            >
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#004582]">{emp.name}</td>
                  <td className="py-4 px-6 text-xs text-slate-500">
                    <p>{emp.email || emp.user?.email || '-'}</p>
                    <p>{emp.phone || emp.user?.phone || '-'}</p>
                  </td>
                  <td className="py-4 px-6 font-medium text-xs">{emp.division?.name || '-'}</td>
                  <td className="py-4 px-6">
                    <Badge variant="secondary" size="sm">{emp.position?.name || '-'}</Badge>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 font-mono">
                    {emp.work_schedule?.name || emp.work_schedule?.shift_name || 'Reguler'}
                  </td>
                  <td className="py-4 px-6 font-bold text-[#DE0E86]">
                    Rp {Number(emp.basic_salary || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingEmployee(emp);
                          setEmployeeForm({
                            name: emp.name,
                            email: emp.email || emp.user?.email || '',
                            phone: emp.phone || emp.user?.phone || '',
                            division_id: emp.division_id || '',
                            position_id: emp.position_id || '',
                            employee_status_id: emp.employee_status_id || 1,
                            work_schedule_id: emp.work_schedule_id || '',
                            basic_salary: emp.basic_salary,
                            allowance: emp.allowance,
                          });
                          setEmployeeModalOpen(true);
                        }}
                        className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all cursor-pointer"
                        title="Edit Data Karyawan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            type: 'employees',
                            id: emp.id,
                            name: emp.name,
                          })
                        }
                        className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                        title="Hapus Karyawan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )
        ) : activeTab === 'divisions' ? (
          /* TAB 2: DIVISIONS */
          divisions.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Belum Ada Divisi Kerja"
              description="Buat divisi kerja baru (misal: Produksi, Desain Grafis, Administrasi, Pemasaran)."
              actionLabel="Tambah Divisi Baru"
              onAction={() => {
                setEditingDivision(null);
                setDivisionForm({ name: '' });
                setDivisionModalOpen(true);
              }}
            />
          ) : (
            <Table headers={['Nama Divisi', 'Jumlah Posisi Jabatan', 'Aksi']}>
              {divisions.map((div) => (
                <tr key={div.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#004582]">{div.name}</td>
                  <td className="py-4 px-6 text-xs text-slate-600">
                    <Badge variant="secondary" size="sm">
                      {div.positions_count ?? div.positions?.length ?? 0} Jabatan
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingDivision(div);
                          setDivisionForm({ name: div.name });
                          setDivisionModalOpen(true);
                        }}
                        className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all cursor-pointer"
                        title="Edit Divisi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            type: 'divisions',
                            id: div.id,
                            name: div.name,
                          })
                        }
                        className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                        title="Hapus Divisi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )
        ) : activeTab === 'positions' ? (
          /* TAB 3: POSITIONS */
          positions.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Belum Ada Posisi / Jabatan"
              description="Tambahkan jabatan kerja seperti Staff Sablon, Operator Mesin Cetak, Lead Designer, dll."
              actionLabel="Tambah Jabatan Baru"
              onAction={() => {
                setEditingPosition(null);
                setPositionForm({
                  name: '',
                  division_id: divisions[0]?.id || '',
                });
                setPositionModalOpen(true);
              }}
            />
          ) : (
            <Table headers={['Nama Jabatan', 'Divisi Induk', 'Jumlah Karyawan', 'Aksi']}>
              {positions.map((pos) => (
                <tr key={pos.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#004582]">{pos.name}</td>
                  <td className="py-4 px-6 text-xs font-semibold text-slate-700">
                    {pos.division?.name || '-'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600">
                    <Badge variant="primary" size="sm">
                      {pos.employees_count ?? 0} Pegawai
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingPosition(pos);
                          setPositionForm({
                            name: pos.name,
                            division_id: pos.division_id || '',
                          });
                          setPositionModalOpen(true);
                        }}
                        className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all cursor-pointer"
                        title="Edit Jabatan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            type: 'positions',
                            id: pos.id,
                            name: pos.name,
                          })
                        }
                        className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                        title="Hapus Jabatan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )
        ) : activeTab === 'schedules' ? (
          /* TAB 4: WORK SCHEDULES */
          schedules.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="Belum Ada Jadwal Kerja Shift"
              description="Atur jam masuk, jam pulang, dan hari kerja operasional percetakan untuk validasi presensi."
              actionLabel="Tambah Jadwal Kerja"
              onAction={() => {
                setEditingSchedule(null);
                setScheduleForm({
                  name: '',
                  start_time: '08:00',
                  end_time: '17:00',
                  work_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
                  is_active: true,
                });
                setScheduleModalOpen(true);
              }}
            />
          ) : (
            <Table headers={['Nama Shift', 'Jam Operasional', 'Hari Kerja', 'Status', 'Aksi']}>
              {schedules.map((sch) => (
                <tr key={sch.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#004582]">{sch.name || sch.shift_name}</td>
                  <td className="py-4 px-6 font-mono text-xs font-bold text-slate-700">
                    <span className="text-emerald-700">{(sch.start_time || sch.check_in_time)?.substring(0, 5)}</span>
                    {' - '}
                    <span className="text-[#DE0E86]">{(sch.end_time || sch.check_out_time)?.substring(0, 5)}</span>
                    {' WIB'}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600 font-medium">
                    {Array.isArray(sch.work_days) ? sch.work_days.join(', ') : 'Senin - Sabtu'}
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant={sch.is_active ? 'success' : 'secondary'} size="sm">
                      {sch.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingSchedule(sch);
                          setScheduleForm({
                            name: sch.name || sch.shift_name || '',
                            start_time: (sch.start_time || sch.check_in_time)?.substring(0, 5) || '08:00',
                            end_time: (sch.end_time || sch.check_out_time)?.substring(0, 5) || '17:00',
                            work_days: Array.isArray(sch.work_days)
                              ? sch.work_days
                              : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
                            is_active: Boolean(sch.is_active),
                          });
                          setScheduleModalOpen(true);
                        }}
                        className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all cursor-pointer"
                        title="Edit Jadwal Kerja"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            type: 'schedules',
                            id: sch.id,
                            name: sch.name || sch.shift_name,
                          })
                        }
                        className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )
        ) : activeTab === 'bonuses' ? (
          /* TAB 5: BONUSES */
          bonuses.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Belum Ada Master Bonus"
              description="Definisikan master bonus / insentif (misal: Bonus Target Produksi, Bonus Lembur Spesial, THR)."
              actionLabel="Tambah Master Bonus"
              onAction={() => {
                setEditingBonus(null);
                setBonusForm({ name: '', amount: '', description: '' });
                setBonusModalOpen(true);
              }}
            />
          ) : (
            <Table headers={['Nama Bonus / Insentif', 'Besaran Nominal', 'Deskripsi / Keterangan', 'Aksi']}>
              {bonuses.map((bon) => (
                <tr key={bon.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-[#004582]">{bon.name}</td>
                  <td className="py-4 px-6 font-extrabold text-emerald-700 font-mono text-sm">
                    Rp {Number(bon.amount).toLocaleString('id-ID')}
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-600">{bon.description || '-'}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingBonus(bon);
                          setBonusForm({
                            name: bon.name,
                            amount: bon.amount,
                            description: bon.description || '',
                          });
                          setBonusModalOpen(true);
                        }}
                        className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all cursor-pointer"
                        title="Edit Bonus"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteDialog({
                            isOpen: true,
                            type: 'bonuses',
                            id: bon.id,
                            name: bon.name,
                          })
                        }
                        className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                        title="Hapus Bonus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )
        ) : (
          /* TAB 6: INVITATIONS */
          invitations.length === 0 ? (
            <EmptyState
              icon={KeyRound}
              title="Belum Ada Kode Undangan"
              description="Kode undangan digunakan jika Anda ingin karyawan baru mendaftar mandiri lewat halaman registrasi internal."
              actionLabel="Terbitkan Kode Undangan"
              onAction={() => {
                setInvitationForm({
                  role_id: 4,
                  division_id: divisions[0]?.id || '',
                  expires_at: '',
                });
                setInvitationModalOpen(true);
              }}
            />
          ) : (
            <Table headers={['Kode Undangan', 'Peran (Role)', 'Divisi', 'Status Penggunaan', 'Batas Berlaku', 'Aksi']}>
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F0F6FB]/50 transition-colors">
                  <td className="py-4 px-6 font-mono font-extrabold text-[#004582] text-sm">
                    {inv.code}
                  </td>
                  <td className="py-4 px-6">
                    <Badge variant="primary" size="sm">{inv.role?.name}</Badge>
                  </td>
                  <td className="py-4 px-6 text-xs font-semibold">{inv.division?.name || 'Semua Divisi'}</td>
                  <td className="py-4 px-6">
                    <Badge variant={inv.is_used ? 'danger' : 'success'} size="sm">
                      {inv.is_used ? `Sudah Digunakan (${inv.used_by_user?.name || '-'})` : 'Aktif (Belum Dipakai)'}
                    </Badge>
                  </td>
                  <td className="py-4 px-6 text-xs text-slate-500">
                    {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString('id-ID') : 'Tanpa Batas'}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(inv.code)}
                        className="p-2 rounded-[12px] bg-[#F0F6FB] text-[#004582] hover:bg-[#DE0E86] hover:text-white transition-all cursor-pointer"
                        title="Salin Kode"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {!inv.is_used && (
                        <button
                          onClick={() =>
                            setDeleteDialog({
                              isOpen: true,
                              type: 'invitations',
                              id: inv.id,
                              name: inv.code,
                            })
                          }
                          className="p-2 rounded-[12px] bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
          )
        )}
      </Card>

      {/* 1. Modal Karyawan */}
      <Modal
        isOpen={employeeModalOpen}
        onClose={() => setEmployeeModalOpen(false)}
        title={editingEmployee ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
        subtitle="Kelola akun, penempatan divisi, shift presensi, dan gaji"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveEmployee} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap"
              required
              value={employeeForm.name}
              onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
              placeholder="Contoh: Budi Santoso"
            />
            <Input
              label="Nomor WhatsApp"
              required
              value={employeeForm.phone}
              onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
              placeholder="08123456789"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Divisi Kerja"
              required
              value={employeeForm.division_id}
              onChange={(e) => setEmployeeForm({ ...employeeForm, division_id: e.target.value })}
            >
              <option value="">Pilih Divisi...</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Select
              label="Jabatan"
              required
              value={employeeForm.position_id}
              onChange={(e) => setEmployeeForm({ ...employeeForm, position_id: e.target.value })}
            >
              <option value="">Pilih Jabatan...</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.division?.name || 'Divisi'})</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Jadwal Shift Kerja"
              required
              value={employeeForm.work_schedule_id}
              onChange={(e) => setEmployeeForm({ ...employeeForm, work_schedule_id: e.target.value })}
            >
              <option value="">Pilih Jadwal...</option>
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name || s.shift_name} ({(s.start_time || s.check_in_time)?.substring(0, 5)} - {(s.end_time || s.check_out_time)?.substring(0, 5)})
                </option>
              ))}
            </Select>

            <Input
              label="Gaji Pokok Bulanan (Rp)"
              type="number"
              required
              min={0}
              value={employeeForm.basic_salary}
              onChange={(e) => setEmployeeForm({ ...employeeForm, basic_salary: e.target.value })}
              placeholder="3000000"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full">
            Simpan Data Pegawai
          </Button>
        </form>
      </Modal>

      {/* 2. Modal Divisi */}
      <Modal
        isOpen={divisionModalOpen}
        onClose={() => setDivisionModalOpen(false)}
        title={editingDivision ? 'Edit Divisi Kerja' : 'Tambah Divisi Kerja Baru'}
        subtitle="Divisi mengelompokkan struktur dan departemen tim Kalebox"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveDivision} className="space-y-4 text-left">
          <Input
            label="Nama Divisi"
            required
            value={divisionForm.name}
            onChange={(e) => setDivisionForm({ ...divisionForm, name: e.target.value })}
            placeholder="Misal: Desain Kreatif, Produksi & Percetakan"
          />
          <Button type="submit" variant="primary" className="w-full">
            {editingDivision ? 'Perbarui Divisi' : 'Simpan Divisi Baru'}
          </Button>
        </form>
      </Modal>

      {/* 3. Modal Jabatan */}
      <Modal
        isOpen={positionModalOpen}
        onClose={() => setPositionModalOpen(false)}
        title={editingPosition ? 'Edit Jabatan Kerja' : 'Tambah Jabatan Kerja Baru'}
        subtitle="Jabatan spesifik di bawah suatu divisi"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSavePosition} className="space-y-4 text-left">
          <Input
            label="Nama Jabatan"
            required
            value={positionForm.name}
            onChange={(e) => setPositionForm({ ...positionForm, name: e.target.value })}
            placeholder="Misal: Operator Sablon, Lead Graphic Designer"
          />
          <Select
            label="Divisi Terkait"
            required
            value={positionForm.division_id}
            onChange={(e) => setPositionForm({ ...positionForm, division_id: e.target.value })}
          >
            <option value="">Pilih Divisi...</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>
          <Button type="submit" variant="primary" className="w-full">
            {editingPosition ? 'Perbarui Jabatan' : 'Simpan Jabatan Baru'}
          </Button>
        </form>
      </Modal>

      {/* 4. Modal Jadwal Shift Kerja */}
      <Modal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        title={editingSchedule ? 'Edit Jadwal Shift Kerja' : 'Tambah Jadwal Shift Baru'}
        subtitle="Tentukan jam kerja operasional untuk presensi dan toleransi keterlambatan"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4 text-left">
          <Input
            label="Nama Jadwal / Shift"
            required
            value={scheduleForm.name}
            onChange={(e) => setScheduleForm({ ...scheduleForm, name: e.target.value })}
            placeholder="Misal: Shift Pagi Kantor, Shift Produksi"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Jam Masuk (WIB)"
              type="time"
              required
              value={scheduleForm.start_time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })}
            />
            <Input
              label="Jam Pulang (WIB)"
              type="time"
              required
              value={scheduleForm.end_time}
              onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase tracking-wider mb-2">
              Hari Kerja Berlaku
            </label>
            <div className="flex flex-wrap gap-2">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => {
                const isSelected = scheduleForm.work_days.includes(day);
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => toggleWorkDay(day)}
                    className={`px-3 py-1.5 rounded-[12px] text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#004582] text-white shadow-sm'
                        : 'bg-[#F0F6FB] text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full">
            {editingSchedule ? 'Perbarui Jadwal Kerja' : 'Simpan Jadwal Baru'}
          </Button>
        </form>
      </Modal>

      {/* 5. Modal Master Bonus */}
      <Modal
        isOpen={bonusModalOpen}
        onClose={() => setBonusModalOpen(false)}
        title={editingBonus ? 'Edit Master Bonus' : 'Tambah Master Bonus Baru'}
        subtitle="Definisi jenis bonus dan tunjangan insentif untuk penggajian karyawan"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveBonus} className="space-y-4 text-left">
          <Input
            label="Nama Bonus / Tunjangan"
            required
            value={bonusForm.name}
            onChange={(e) => setBonusForm({ ...bonusForm, name: e.target.value })}
            placeholder="Misal: Bonus Target Produksi, Tunjangan Kehadiran"
          />

          <Input
            label="Besaran Nominal (Rp)"
            type="number"
            required
            min={0}
            value={bonusForm.amount}
            onChange={(e) => setBonusForm({ ...bonusForm, amount: e.target.value })}
            placeholder="500000"
          />

          <Input
            label="Keterangan / Ketentuan (Opsional)"
            value={bonusForm.description}
            onChange={(e) => setBonusForm({ ...bonusForm, description: e.target.value })}
            placeholder="Diberikan jika pesanan selesai tepat waktu"
          />

          <Button type="submit" variant="primary" className="w-full">
            {editingBonus ? 'Perbarui Bonus' : 'Simpan Bonus Baru'}
          </Button>
        </form>
      </Modal>

      {/* 6. Modal Terbitkan Kode Undangan */}
      <Modal
        isOpen={invitationModalOpen}
        onClose={() => setInvitationModalOpen(false)}
        title="Terbitkan Kode Undangan Karyawan"
        subtitle="Digunakan jika calon karyawan akan mendaftar mandiri lewat tautan registrasi"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateInvitation} className="space-y-4 text-left">
          <Select
            label="Peran Akun (Role)"
            required
            value={invitationForm.role_id}
            onChange={(e) => setInvitationForm({ ...invitationForm, role_id: Number(e.target.value) })}
          >
            <option value={4}>Desain Grafis (Role 4)</option>
            <option value={5}>Staff Produksi (Role 5)</option>
            <option value={3}>Admin Kantor (Role 3)</option>
            <option value={2}>Manajer Operasional (Maks 1)</option>
            <option value={1}>Owner (Maks 1)</option>
          </Select>

          <Select
            label="Divisi Kerja"
            value={invitationForm.division_id}
            onChange={(e) => setInvitationForm({ ...invitationForm, division_id: e.target.value })}
          >
            <option value="">Pilih Divisi (Opsional)...</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </Select>

          <Input
            label="Tanggal Kadaluarsa Kode (Opsional)"
            type="date"
            value={invitationForm.expires_at}
            onChange={(e) => setInvitationForm({ ...invitationForm, expires_at: e.target.value })}
          />

          <Button type="submit" variant="primary" className="w-full">
            Generate Kode Undangan Sekarang
          </Button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, type: '', id: null, name: '' })}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus"
        message={`Apakah Anda yakin ingin menghapus "${deleteDialog.name}"? Data yang dihapus tidak dapat dipulihkan.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EmployeesPage;
