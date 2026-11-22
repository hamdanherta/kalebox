import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import {
  LayoutDashboard,
  Clock,
  CalendarDays,
  ShoppingBag,
  Share2,
  Package,
  Users2,
  UserCheck,
  CreditCard,
  Briefcase,
  DollarSign,
  Settings,
  ShieldAlert,
  Bell,
  LogOut,
  Menu,
  X,
  Camera,
  MapPin,
  ChevronDown,
  Lock,
  KeyRound,
  RefreshCw,
} from 'lucide-react';

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371000; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const InternalLayout = () => {
  const { user, role, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  // Quick Attendance Modal State
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [attendanceType, setAttendanceType] = useState('check_in'); // check_in or check_out
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
  const [geoLoc, setGeoLoc] = useState(null);
  const [geoError, setGeoError] = useState(null);
  const [cameraPhoto, setCameraPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  const officeLat = todayAttendance?.office_lat != null ? Number(todayAttendance.office_lat) : null;
  const officeLng = todayAttendance?.office_lng != null ? Number(todayAttendance.office_lng) : null;
  const maxRadius = todayAttendance?.max_radius_meter != null ? Number(todayAttendance.max_radius_meter) : 10;

  const currentDistance = (geoLoc && officeLat != null && officeLng != null)
    ? calculateDistance(geoLoc.lat, geoLoc.lng, officeLat, officeLng)
    : null;

  const isWithinRadius = currentDistance !== null ? currentDistance <= maxRadius : false;

  // Change Password Modal
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success || res.data?.status === 'success') {
        setNotifications(res.data.data || []);
        setUnreadNotifs(res.data.unread_count || 0);
      }
    } catch {
      // quiet
    }
  };

  // Fetch today attendance status
  const fetchTodayAttendance = async () => {
    try {
      const res = await api.get('/attendance/today');
      if (res.data?.success || res.data?.status === 'success') {
        setTodayAttendance(res.data.data);
      }
    } catch {
      // quiet
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchTodayAttendance();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkNotifRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      // quiet
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch {
      // quiet
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/internal/login');
  };

  // Camera & Geolocation handlers
  const openAttendanceModal = (type = 'check_in') => {
    setAttendanceType(type);
    setCameraPhoto(null);
    setGeoError(null);
    setAttendanceModalOpen(true);
    fetchTodayAttendance();
    startCamera();
    requestLocation();
  };

  const startCamera = async () => {
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      const videoEl = document.getElementById('attendance-video');
      if (videoEl) {
        videoEl.srcObject = stream;
        videoEl.play();
      }
    } catch {
      setGeoError('Kamera tidak dapat diakses. Pastikan izin kamera telah diberikan pada peramban Anda.');
    }
  };

  const stopCamera = () => {
    const videoEl = document.getElementById('attendance-video');
    if (videoEl && videoEl.srcObject) {
      videoEl.srcObject.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    const videoEl = document.getElementById('attendance-video');
    if (!videoEl) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 640;
    canvas.height = videoEl.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCameraPhoto(dataUrl);
    stopCamera();
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Perangkat Anda tidak mendukung geolokasi GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoc({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setGeoError(`Gagal membaca GPS: ${err.message}. Mohon aktifkan izin lokasi presisi.`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmitAttendance = async () => {
    if (!cameraPhoto) {
      addToast('Silakan ambil foto selfie wajah terlebih dahulu', 'warning');
      return;
    }
    if (!geoLoc) {
      addToast('Koordinat GPS belum terdeteksi. Pastikan GPS aktif', 'warning');
      return;
    }

    setIsSubmittingAttendance(true);
    try {
      const endpoint = attendanceType === 'check_in' ? '/attendance/check-in' : '/attendance/check-out';
      const res = await api.post(endpoint, {
        photo: cameraPhoto,
        latitude: geoLoc.lat,
        longitude: geoLoc.lng,
      });

      if (res.data?.success || res.data?.status === 'success') {
        addToast(res.data.message || 'Presensi berhasil dicatat', 'success');
        setAttendanceModalOpen(false);
        stopCamera();
        fetchTodayAttendance();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Presensi gagal. Periksa koordinat atau batas radius kantor.', 'error');
    } finally {
      setIsSubmittingAttendance(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Konfirmasi kata sandi baru tidak cocok', 'warning');
      return;
    }
    setIsChangingPassword(true);
    try {
      const res = await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      if (res.data?.status === 'success') {
        addToast('Kata sandi berhasil diperbarui', 'success');
        setPasswordModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengubah kata sandi', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Nav menus by role
  const canManageProducts = ['owner', 'manager', 'admin'].includes(role);
  const canManagePartners = ['owner', 'manager', 'admin'].includes(role);
  const canManageEmployees = ['owner', 'manager'].includes(role);
  const canManagePayroll = ['owner', 'manager', 'keuangan'].includes(role);
  const canManageFinance = ['owner', 'manager', 'keuangan'].includes(role);
  const canManageCareers = ['owner', 'manager'].includes(role);
  const canManageSettings = ['owner', 'manager'].includes(role);

  const navItems = [
    { label: 'Dasbor', path: '/internal/dasbor', icon: LayoutDashboard },
    { label: 'Presensi Karyawan', path: '/internal/presensi', icon: Clock },
    { label: 'Cuti & Lembur', path: '/internal/cuti-lembur', icon: CalendarDays },
    { label: 'Manajemen Pesanan', path: '/internal/pesanan', icon: ShoppingBag },
    { label: 'Konten Promosi', path: '/internal/konten', icon: Share2 },
    ...(canManageProducts ? [{ label: 'Master Produk & Box', path: '/internal/produk', icon: Package }] : []),
    ...(canManagePartners ? [{ label: 'Kemitraan & Klien', path: '/internal/mitra', icon: Users2 }] : []),
    ...(canManageEmployees ? [{ label: 'Data Karyawan & HR', path: '/internal/karyawan', icon: UserCheck }] : []),
    ...(canManagePayroll ? [{ label: 'Penggajian (Payroll)', path: '/internal/penggajian', icon: CreditCard }] : []),
    ...(canManageFinance ? [{ label: 'Keuangan & Kas', path: '/internal/keuangan', icon: DollarSign }] : []),
    ...(canManageCareers ? [{ label: 'Karir & Rekrutmen', path: '/internal/karir', icon: Briefcase }] : []),
    ...(canManageSettings ? [
      { label: 'Pengaturan Sistem', path: '/internal/pengaturan', icon: Settings },
      { label: 'Log Aktivitas', path: '/internal/log-aktivitas', icon: ShieldAlert },
    ] : []),
  ];

  const roleNameMap = {
    owner: 'Owner',
    manager: 'Manajer Operasional',
    admin: 'Admin Kantor',
    design: 'Desainer Grafis',
    staff: 'Staff Produksi',
    keuangan: 'Staff Keuangan & Kasir',
  };

  return (
    <div className="min-h-screen flex bg-slate-50/50 text-[#004582] selection:bg-[#DE0E86] selection:text-white">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white shadow-card z-30 fixed inset-y-0 left-0">
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50">
          <Link to="/internal/dasbor" className="flex items-center gap-3">
            <img src="/logo/kaleboxlogo.png" alt="Kalebox" className="h-8 w-auto object-contain" />
          </Link>
          <Badge variant="primary" size="sm" className="uppercase font-bold tracking-wider">
            {role}
          </Badge>
        </div>

        {/* User Card */}
        <div className="p-4 mx-4 my-3 bg-[#F0F6FB] rounded-[24px] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#004582] text-white flex items-center justify-center font-bold text-sm">
            {user?.name?.charAt(0) || 'K'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-[#004582] truncate">{user?.name}</h4>
            <p className="text-[11px] text-slate-500 font-medium truncate">{roleNameMap[role] || role}</p>
          </div>
        </div>

        {/* Quick Presensi Bar */}
        <div className="px-4 pb-2">
          {todayAttendance?.has_checked_out || todayAttendance?.check_out_time ? (
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-[20px] text-xs font-semibold text-center shadow-sm">
              Presensi Hari Ini Selesai
            </div>
          ) : todayAttendance?.has_checked_in || todayAttendance?.check_in_time ? (
            <Button
              variant="danger"
              size="sm"
              className="w-full text-xs"
              onClick={() => openAttendanceModal('check_out')}
              icon={Clock}
            >
              Absen Pulang (Checkout)
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="w-full text-xs"
              onClick={() => openAttendanceModal('check_in')}
              icon={Clock}
            >
              Absen Masuk Sekarang
            </Button>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-[20px] text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#DE0E86] text-white shadow-md shadow-[#DE0E86]/20'
                      : 'text-[#004582] hover:bg-[#F0F6FB]'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
          <p className="font-semibold">Kalebox v1.0</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-rose-600 hover:text-rose-800 font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col lg:pl-72 min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md shadow-sm h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-[#004582] hover:bg-[#F0F6FB] rounded-xl transition-colors"
              aria-label="Buka navigasi"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Panel Internal Perusahaan
              </p>
              <h2 className="text-base font-extrabold text-[#004582] tracking-tight">
                {roleNameMap[role] || 'Internal Staff'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick Attendance status pill */}
            <div className="hidden sm:flex items-center gap-2">
              {todayAttendance?.has_checked_out || todayAttendance?.check_out_time ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Presensi Selesai (Pulang: {todayAttendance.check_out_time?.substring(0, 5)} WIB)
                </span>
              ) : todayAttendance?.has_checked_in || todayAttendance?.check_in_time ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Masuk: {todayAttendance.check_in_time?.substring(0, 5)} WIB ({todayAttendance?.is_late ? 'Terlambat' : 'Tepat Waktu'})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Belum Absen Masuk
                </span>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2.5 text-[#004582] hover:bg-[#F0F6FB] rounded-full transition-colors"
                aria-label="Notifikasi"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#DE0E86] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadNotifs > 9 ? '9+' : unreadNotifs}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-[24px] shadow-modal p-4 z-50 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider">
                      Notifikasi ({unreadNotifs})
                    </h4>
                    {unreadNotifs > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-[#DE0E86] font-semibold hover:underline"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto py-2 space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">Tidak ada notifikasi baru</p>
                    ) : (
                      notifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleMarkNotifRead(notif.id)}
                          className={`p-3 rounded-[16px] text-xs cursor-pointer transition-colors ${
                            notif.is_read ? 'bg-slate-50 text-slate-500' : 'bg-[#F0F6FB] text-[#004582] font-semibold'
                          }`}
                        >
                          <p className="font-bold">{notif.title}</p>
                          <p className="text-slate-500 font-normal mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.created_at).toLocaleString('id-ID')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-[#F0F6FB] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[#004582] text-white flex items-center justify-center font-bold text-sm">
                  {user?.name?.charAt(0) || 'K'}
                </div>
                <ChevronDown className="w-4 h-4 text-[#004582] hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-[24px] shadow-modal p-2 z-50 animate-in fade-in duration-200">
                  <div className="p-3 border-b border-slate-100">
                    <p className="text-xs font-bold text-[#004582] truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        setPasswordModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#004582] hover:bg-[#F0F6FB] rounded-[16px] transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      Ganti Kata Sandi
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-[16px] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar Sistem
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-[#004582]/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-72 bg-white flex flex-col h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-50">
              <img src="/logo/kaleboxlogo.png" alt="Kalebox" className="h-8 w-auto object-contain" />
              <button onClick={() => setSidebarOpen(false)} className="p-2 text-slate-400 hover:text-[#004582]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-[20px] text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#DE0E86] text-white shadow-md shadow-[#DE0E86]/20'
                          : 'text-[#004582] hover:bg-[#F0F6FB]'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-50">
              <Button variant="danger" className="w-full text-xs" onClick={handleLogout} icon={LogOut}>
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Attendance Modal */}
      <Modal
        isOpen={attendanceModalOpen}
        onClose={() => {
          stopCamera();
          setAttendanceModalOpen(false);
        }}
        title={attendanceType === 'check_in' ? 'Presensi Masuk (Check-In)' : 'Presensi Pulang (Check-Out)'}
        subtitle="Ambil foto selfie di area kantor dan pastikan GPS Anda terhubung"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-center">
          {/* Camera preview / Photo */}
          <div className="relative w-full h-64 bg-slate-900 rounded-[24px] overflow-hidden flex items-center justify-center">
            {cameraPhoto ? (
              <img src={cameraPhoto} alt="Foto Presensi" className="w-full h-full object-cover" />
            ) : (
              <video id="attendance-video" autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
          </div>

          {/* Action to capture/retake */}
          <div className="flex justify-center gap-3">
            {cameraPhoto ? (
              <Button
                variant="light"
                size="sm"
                onClick={() => {
                  setCameraPhoto(null);
                  startCamera();
                }}
              >
                Foto Ulang
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={capturePhoto} icon={Camera}>
                Ambil Foto Wajah
              </Button>
            )}
          </div>

          {/* Geolocation Status Card */}
          <div className="bg-[#F0F6FB] p-4 rounded-[24px] text-xs space-y-3 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-[#004582]">
                <MapPin className="w-4 h-4 text-[#DE0E86]" />
                <span>Geofence & Lokasi GPS</span>
              </div>
              <button
                type="button"
                onClick={requestLocation}
                className="text-[11px] font-bold text-[#DE0E86] hover:underline inline-flex items-center gap-1"
                title="Pindai ulang koordinat GPS perangkat"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Pindai Ulang GPS</span>
              </button>
            </div>

            {/* Titik Kantor (Pengaturan Sistem) */}
            <div className="p-2.5 rounded-[16px] bg-white border border-slate-200/60 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#004582]">Titik Kantor (Pengaturan Sistem):</span>
                <span className="text-slate-500 font-medium">Radius: {maxRadius} meter</span>
              </div>
              <p className="text-slate-600 font-mono text-[11px]">
                Lat: {officeLat ?? '-'}, Lng: {officeLng ?? '-'}
              </p>
            </div>

            {/* Posisi Anda Saat Ini (GPS Perangkat) */}
            <div className="p-2.5 rounded-[16px] bg-white border border-slate-200/60 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-[#004582]">Posisi Anda (GPS Perangkat):</span>
                {geoLoc && (
                  <span className="text-slate-400 text-[10px]">Akurasi: ±{Math.round(geoLoc.accuracy)}m</span>
                )}
              </div>
              {geoLoc ? (
                <p className="text-slate-600 font-mono text-[11px]">
                  Lat: {geoLoc.lat.toFixed(6)}, Lng: {geoLoc.lng.toFixed(6)}
                </p>
              ) : geoError ? (
                <p className="text-rose-600 font-semibold text-[11px]">{geoError}</p>
              ) : (
                <p className="text-slate-400 text-[11px]">Mendeteksi koordinat GPS peramban...</p>
              )}
            </div>

            {/* Jarak ke Kantor & Validasi Radius */}
            {currentDistance !== null && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-600 font-semibold text-xs">Jarak ke Titik Kantor:</span>
                <Badge
                  variant={isWithinRadius ? 'success' : 'danger'}
                  size="sm"
                  className="font-mono font-bold"
                >
                  {currentDistance.toFixed(1)} m ({isWithinRadius ? 'Dalam Radius' : 'Di Luar Radius'})
                </Badge>
              </div>
            )}

            {!isWithinRadius && currentDistance !== null && (
              <div className="p-2.5 rounded-[16px] bg-rose-50 border border-rose-200/60 text-rose-700 text-[11px] leading-relaxed">
                <p className="font-bold">Posisi Anda berjarak {currentDistance.toFixed(1)} meter (batas maksimal {maxRadius} meter).</p>
                {['owner', 'manager'].includes(role) && (
                  <p className="mt-1 text-slate-600">
                    Tips: Di menu <span className="font-bold text-[#004582]">Pengaturan Sistem</span>, Anda bisa memperbesar radius (mis. 25-50m untuk perangkat laptop/Wi-Fi) atau klik tombol <span className="font-bold text-[#DE0E86]">Gunakan Posisi GPS Saya Saat Ini</span>.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            variant="primary"
            className="w-full"
            isLoading={isSubmittingAttendance}
            disabled={!cameraPhoto || !geoLoc}
            onClick={handleSubmitAttendance}
          >
            {!cameraPhoto
              ? 'Ambil Foto Wajah Terlebih Dahulu'
              : !geoLoc
              ? 'Menunggu Deteksi GPS...'
              : 'Kirim Presensi Sekarang'}
          </Button>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title="Ganti Kata Sandi"
        subtitle="Gunakan kombinasi kata sandi yang aman dan tidak mudah ditebak"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase tracking-wide mb-1">
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-[#F0F6FB] rounded-[18px] px-4 py-3 text-sm text-[#004582] outline-none shadow-input focus:shadow-input-focus"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase tracking-wide mb-1">
              Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-[#F0F6FB] rounded-[18px] px-4 py-3 text-sm text-[#004582] outline-none shadow-input focus:shadow-input-focus"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#004582] uppercase tracking-wide mb-1">
              Konfirmasi Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[#F0F6FB] rounded-[18px] px-4 py-3 text-sm text-[#004582] outline-none shadow-input focus:shadow-input-focus"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full" isLoading={isChangingPassword}>
            Simpan Kata Sandi Baru
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default InternalLayout;
