import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { Mail, Lock, User, Phone, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

const ROLES = [
  { id: 'owner', label: 'Owner (Pemilik Toko)', domain: 'ownerkalebox.id', maxNote: 'Maksimal 1 Akun' },
  { id: 'manager', label: 'Manager (Manajer Operasional)', domain: 'managerkalebox.id', maxNote: 'Maksimal 1 Akun' },
  { id: 'admin', label: 'Admin (Admin & Konten)', domain: 'adminkalebox.id' },
  { id: 'design', label: 'Desain (Graphic Designer)', domain: 'desainkalebox.id' },
  { id: 'staff', label: 'Produksi (Operator Mesin & QC)', domain: 'produksikalebox.id' },
  { id: 'keuangan', label: 'Keuangan (Kasir & Keuangan)', domain: 'keuangankalebox.id' },
];

export const InternalRegisterPage = () => {
  const { registerInternal } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState('owner');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const selectedRoleInfo = ROLES.find((r) => r.id === role) || ROLES[0];

  const handleRegister = async (e) => {
    e.preventDefault();

    // Client side domain check
    const expectedDomain = selectedRoleInfo.domain;
    const emailLower = email.toLowerCase().trim();
    if (!emailLower.endsWith(`@${expectedDomain}`)) {
      addToast(`Format email untuk role ${selectedRoleInfo.label} wajib berakhiran @${expectedDomain} (contoh: nama@${expectedDomain})`, 'warning');
      return;
    }

    if (password !== passwordConfirmation) {
      addToast('Konfirmasi kata sandi tidak cocok', 'warning');
      return;
    }

    if (password.length < 6) {
      addToast('Kata sandi minimal 6 karakter', 'warning');
      return;
    }

    setIsRegistering(true);
    try {
      const user = await registerInternal({
        name,
        role,
        email: emailLower,
        phone,
        password,
        password_confirmation: passwordConfirmation,
      });

      addToast(`Pendaftaran akun ${selectedRoleInfo.label} berhasil! Selamat datang, ${user.name}.`, 'success');
      navigate('/internal/dasbor');
    } catch (err) {
      addToast(err.message || 'Pendaftaran gagal.', 'error');
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
              Registrasi Akun Karyawan
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-[#004582] tracking-tight">
            Buat Akun Internal Baru
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Pilih role jabatan Anda dan gunakan format email khusus sesuai role.
          </p>
        </div>

        <Card padding="p-8" className="space-y-6">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Pilihan Role */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                Pilih Role / Jabatan <span className="text-[#DE0E86]">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setEmail('');
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-[16px] text-sm font-semibold text-[#004582] focus:outline-none focus:ring-2 focus:ring-[#004582]/20 focus:border-[#004582] transition-colors"
              >
                {ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} {r.maxNote ? `[${r.maxNote}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Nama Lengkap"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Hamdani"
              icon={User}
            />

            <div>
              <Input
                label="Alamat Email Khusus Role"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`nama@${selectedRoleInfo.domain}`}
                icon={Mail}
              />
              <div className="mt-1.5 p-2.5 rounded-[12px] bg-sky-50 border border-sky-100 text-[11px] text-[#004582] space-y-0.5">
                <div>
                  Format wajib:{' '}
                  <strong className="text-[#DE0E86] font-mono">
                    nama@{selectedRoleInfo.domain}
                  </strong>
                </div>
                {selectedRoleInfo.maxNote && (
                  <div className="text-amber-700 font-semibold">
                    * Perhatian: Role ini {selectedRoleInfo.maxNote.toLowerCase()}.
                  </div>
                )}
              </div>
            </div>

            <Input
              label="Nomor WhatsApp / HP"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
              icon={Phone}
            />

            <Input
              label="Kata Sandi Baru"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 karakter"
              icon={Lock}
            />

            <Input
              label="Konfirmasi Kata Sandi"
              type="password"
              required
              minLength={6}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Ulangi kata sandi"
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
              Daftar Akun Baru
            </Button>
          </form>

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
