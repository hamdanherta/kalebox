import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import { User, Phone, Mail, Building, MapPin, KeyRound, Save } from 'lucide-react';

export const MemberProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setCompanyName(user.member?.company_name || '');
      setAddress(user.member?.address || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await api.put('/member/profile', {
        name,
        phone,
        company_name: companyName,
        address,
      });

      if (res.data?.status === 'success') {
        addToast('Profil berhasil diperbarui', 'success');
        refreshUser();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('Konfirmasi kata sandi tidak cocok', 'warning');
      return;
    }
    setIsChangingPass(true);
    try {
      const res = await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (res.data?.status === 'success') {
        addToast('Kata sandi berhasil diperbarui', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Gagal mengubah kata sandi', 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-left">
      <div>
        <Badge variant="secondary" size="md">Pengaturan Akun</Badge>
        <h1 className="text-3xl font-extrabold text-[#004582] tracking-tight mt-1">
          Profil Member & Alamat
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Kelola data kontak dan alamat pengiriman default untuk memudahkan pesanan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Profile info form */}
        <div className="md:col-span-7 space-y-6">
          <Card padding="p-6 md:p-8" className="space-y-6">
            <h3 className="text-base font-bold text-[#004582] pb-2 border-b border-slate-100">
              Informasi Pribadi & Pengiriman
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Nama Lengkap"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                icon={User}
              />

              <Input
                label="Alamat Email (Akun)"
                disabled
                value={user?.email || ''}
                icon={Mail}
                helperText="Email digunakan sebagai identitas akun Anda"
              />

              <Input
                label="Nomor WhatsApp"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={Phone}
              />

              <Input
                label="Nama Usaha / Brand"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                icon={Building}
              />

              <Textarea
                label="Alamat Pengiriman Default"
                required
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isUpdating}
                icon={Save}
              >
                Simpan Perubahan Profil
              </Button>
            </form>
          </Card>
        </div>

        {/* Change password form */}
        <div className="md:col-span-5 space-y-6">
          <Card padding="p-6 md:p-8" className="space-y-6">
            <h3 className="text-base font-bold text-[#004582] pb-2 border-b border-slate-100">
              Ganti Kata Sandi
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Kata Sandi Saat Ini"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />

              <Input
                label="Kata Sandi Baru"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Input
                label="Ulangi Sandi Baru"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                isLoading={isChangingPass}
                icon={KeyRound}
              >
                Perbarui Kata Sandi
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MemberProfilePage;
