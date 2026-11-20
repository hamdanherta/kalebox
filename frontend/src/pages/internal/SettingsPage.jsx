import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import { Settings, Building, MapPin, Clock, Save } from 'lucide-react';

export const SettingsPage = () => {
  const { addToast } = useToast();
  const [settings, setSettings] = useState({
    company_name: '',
    company_tagline: '',
    company_about: '',
    company_vision: '',
    company_mission: '',
    company_phone: '',
    company_whatsapp: '',
    company_email: '',
    company_address: '',
    office_lat: -1.6169982045745503,
    office_lng: 103.57810290034548,
    attendance_radius_meter: 10.0,
    late_penalty_amount: 25000.0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        if (res.data?.success || res.data?.status === 'success') {
          setSettings((prev) => ({ ...prev, ...(res.data.data || {}) }));
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      addToast('Perangkat Anda tidak mendukung geolokasi GPS.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSettings((prev) => ({
          ...prev,
          office_lat: pos.coords.latitude,
          office_lng: pos.coords.longitude,
        }));
        addToast(
          `GPS terdeteksi: Lat ${pos.coords.latitude.toFixed(6)}, Lng ${pos.coords.longitude.toFixed(6)}. Jangan lupa klik Simpan Pengaturan.`,
          'success'
        );
      },
      (err) => {
        addToast(`Gagal membaca GPS: ${err.message}. Mohon izinkan akses lokasi pada browser.`, 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.data?.status === 'success') {
        addToast('Pengaturan sistem berhasil disimpan!', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal menyimpan pengaturan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-left">
      <div>
        <Badge variant="secondary" size="md">Konfigurasi Sistem</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
          Pengaturan Perusahaan & Geofence
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Profil publik perusahaan, koordinat titik pusat kantor presensi GPS, dan besaran denda absensi.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Profile Settings */}
        <Card padding="p-6 md:p-8" className="space-y-6">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <Building className="w-5 h-5 text-[#DE0E86]" />
            <h2 className="text-lg font-bold text-[#004582]">Identitas & Kontak Perusahaan</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Perusahaan"
              required
              value={settings.company_name}
              onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
            />
            <Input
              label="Tagline Resmi"
              value={settings.company_tagline}
              onChange={(e) => setSettings({ ...settings, company_tagline: e.target.value })}
            />
            <Input
              label="Nomor WhatsApp CS"
              required
              value={settings.company_whatsapp}
              onChange={(e) => setSettings({ ...settings, company_whatsapp: e.target.value })}
            />
            <Input
              label="Email Resmi"
              required
              type="email"
              value={settings.company_email}
              onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
            />
          </div>

          <Textarea
            label="Alamat Lengkap Workshop & Kantor"
            rows={2}
            value={settings.company_address}
            onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
          />

          <Textarea
            label="Tentang Perusahaan"
            rows={3}
            value={settings.company_about}
            onChange={(e) => setSettings({ ...settings, company_about: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Textarea
              label="Visi Perusahaan"
              rows={3}
              value={settings.company_vision}
              onChange={(e) => setSettings({ ...settings, company_vision: e.target.value })}
            />
            <Textarea
              label="Misi Perusahaan"
              rows={3}
              value={settings.company_mission}
              onChange={(e) => setSettings({ ...settings, company_mission: e.target.value })}
            />
          </div>
        </Card>

        {/* Attendance & Geofence Settings */}
        <Card padding="p-6 md:p-8" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#DE0E86]" />
              <h2 className="text-lg font-bold text-[#004582]">Geofence GPS & Aturan Presensi</h2>
            </div>
            <Button
              type="button"
              variant="light"
              size="sm"
              icon={MapPin}
              onClick={handleUseCurrentLocation}
            >
              Gunakan Posisi GPS Saya Saat Ini
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitude Titik Kantor (GPS)"
              type="number"
              step="any"
              required
              value={settings.office_lat}
              onChange={(e) => setSettings({ ...settings, office_lat: parseFloat(e.target.value) })}
            />
            <Input
              label="Longitude Titik Kantor (GPS)"
              type="number"
              step="any"
              required
              value={settings.office_lng}
              onChange={(e) => setSettings({ ...settings, office_lng: parseFloat(e.target.value) })}
            />
            <div>
              <Input
                label="Radius Toleransi Presensi (Meter)"
                type="number"
                min={1}
                required
                value={settings.attendance_radius_meter}
                onChange={(e) => setSettings({ ...settings, attendance_radius_meter: parseFloat(e.target.value) || 0 })}
                helperText="Rekomendasi 50 - 100 meter untuk kantor/ruko. Akurasi GPS laptop/Wi-Fi rata-rata ±50m s/d ±100m."
              />
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="text-[11px] font-semibold text-slate-400">Pilihan Cepat:</span>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, attendance_radius_meter: 25 })}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    settings.attendance_radius_meter === 25
                      ? 'bg-[#004582] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  25 m (Ketat / HP)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, attendance_radius_meter: 50 })}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    settings.attendance_radius_meter === 50
                      ? 'bg-[#004582] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  50 m (Standar Kantor)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, attendance_radius_meter: 100 })}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    settings.attendance_radius_meter === 100
                      ? 'bg-[#004582] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  100 m (Rekomendasi Laptop / Wi-Fi)
                </button>
              </div>
            </div>
            <Input
              label="Denda Keterlambatan per Kejadian (Rp)"
              type="number"
              min={0}
              required
              value={settings.late_penalty_amount}
              onChange={(e) => setSettings({ ...settings, late_penalty_amount: parseFloat(e.target.value) })}
              helperText="Dipotong otomatis saat generate payroll bulanan"
            />
          </div>
        </Card>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={isSaving}
          icon={Save}
        >
          Simpan Semua Pengaturan
        </Button>
      </form>
    </div>
  );
};

export default SettingsPage;
