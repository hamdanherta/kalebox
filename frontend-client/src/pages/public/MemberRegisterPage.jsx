import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import { Mail, Lock, User, Phone, Building, ArrowRight } from 'lucide-react';

export const MemberRegisterPage = () => {
  const { registerMember } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      addToast('Konfirmasi kata sandi tidak cocok', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      await registerMember({
        name,
        email,
        phone,
        company_name: companyName,
        address,
        password,
        password_confirmation: passwordConfirmation,
      });
      addToast('Pendaftaran akun member berhasil! Selamat datang.', 'success');
      navigate('/member/pesanan');
    } catch (err) {
      addToast(err.message || 'Pendaftaran gagal. Periksa kembali data Anda.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="primary" size="sm">Registrasi Member Pelanggan</Badge>
          <h1 className="text-3xl font-extrabold text-[#004582] tracking-tight">
            Buat Akun Member Baru
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Daftar untuk kemudahan pemesanan berulang, pelacakan otomatis, dan riwayat cetak kemasan Anda.
          </p>
        </div>

        <Card padding="p-8" className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nama Lengkap"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Rahmat Hidayat"
              icon={User}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Alamat Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                icon={Mail}
              />
              <Input
                label="Nomor WhatsApp"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                icon={Phone}
              />
            </div>

            <Input
              label="Nama Brand / Usaha (Opsional)"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Contoh: Kopi Nusantara"
              icon={Building}
            />

            <Textarea
              label="Alamat Lengkap Pengiriman"
              required
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Jalan, nomor rumah/ruko, kelurahan, kecamatan, kota..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Kata Sandi"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                icon={Lock}
              />
              <Input
                label="Konfirmasi Sandi"
                type="password"
                required
                minLength={8}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Ulangi sandi"
                icon={Lock}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Daftar Akun Member
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Sudah memiliki akun member?{' '}
            <Link to="/masuk" className="text-[#DE0E86] font-bold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MemberRegisterPage;
