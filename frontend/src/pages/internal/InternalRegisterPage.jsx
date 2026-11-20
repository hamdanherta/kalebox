import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { KeyRound, Mail, Lock, User, Phone, CheckCircle2, ArrowRight } from 'lucide-react';

export const InternalRegisterPage = () => {
  const { registerInternal } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [invitationCode, setInvitationCode] = useState('');
  const [verifiedData, setVerifiedData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!invitationCode.trim()) return;

    setIsVerifying(true);
    try {
      const res = await api.post('/auth/internal/verify-invitation', {
        invitation_code: invitationCode.trim(),
      });

      if (res.data?.status === 'success') {
        setVerifiedData(res.data.data);
        addToast('Kode undangan valid! Silakan lengkapi biodata Anda.', 'success');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Kode undangan tidak valid atau sudah kadaluarsa', 'error');
      setVerifiedData(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      addToast('Konfirmasi kata sandi tidak cocok', 'warning');
      return;
    }

    setIsRegistering(true);
    try {
      const user = await registerInternal({
        invitation_code: invitationCode.trim(),
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirmation,
      });

      addToast(`Aktivasi akun berhasil! Selamat datang, ${user.name}.`, 'success');
      navigate('/internal/dasbor');
    } catch (err) {
      addToast(err.message || 'Registrasi gagal', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-3">
          <Link to="/" className="inline-block">
            <img src="/logo/kaleboxlogo.png" alt="Kalebox" className="h-10 mx-auto object-contain" />
          </Link>
          <div className="pt-2">
            <Badge variant="primary" size="sm" className="uppercase font-bold tracking-wider">
              Aktivasi Karyawan Baru
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-[#004582] tracking-tight">
            Pendaftaran Internal Kalebox
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Masukkan kode undangan resmi yang diterbitkan oleh manajemen untuk melanjutkan.
          </p>
        </div>

        <Card padding="p-8" className="space-y-6">
          {!verifiedData ? (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <Input
                label="Kode Undangan Resmi"
                required
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                placeholder="Contoh: KALE-XXXX-XXXX"
                icon={KeyRound}
                helperText="Hubungi Manajer Operasional jika belum memiliki kode undangan."
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                isLoading={isVerifying}
                icon={ArrowRight}
                iconPosition="right"
              >
                Verifikasi Kode Undangan
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Verified Code Info */}
              <div className="bg-emerald-50 text-emerald-900 p-4 rounded-[20px] text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Kode Undangan Terverifikasi</span>
                </div>
                <p>
                  Posisi Ditugaskan: <strong>{verifiedData.role?.name || 'Karyawan'}</strong>
                  {verifiedData.division && ` • Divisi ${verifiedData.division.name}`}
                </p>
              </div>

              <Input
                label="Nama Lengkap"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama sesuai KTP"
                icon={User}
              />

              <Input
                label="Alamat Email Perusahaan / Pribadi"
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

              <Input
                label="Kata Sandi Baru"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                icon={Lock}
              />

              <Input
                label="Konfirmasi Sandi Baru"
                type="password"
                required
                minLength={8}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Ulangi sandi"
                icon={Lock}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isRegistering}
                icon={CheckCircle2}
              >
                Selesaikan Aktivasi Akun
              </Button>

              <button
                type="button"
                onClick={() => setVerifiedData(null)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-medium pt-2"
              >
                Gunakan kode undangan lain
              </button>
            </form>
          )}

          <div className="pt-2 text-center text-xs text-slate-500 font-medium">
            Sudah memiliki akun?{' '}
            <Link to="/internal/login" className="text-[#DE0E86] font-bold hover:underline">
              Masuk di sini
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InternalRegisterPage;
