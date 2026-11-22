import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { Mail, Lock, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const InternalLoginPage = () => {
  const { loginInternal } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await loginInternal(email, password);
      addToast(`Selamat datang kembali, ${user.name}!`, 'success');
      navigate('/internal/dasbor');
    } catch (err) {
      addToast(err.message || 'Login internal gagal. Pastikan kredensial Anda benar.', 'error');
    } finally {
      setIsLoading(false);
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
              Akses Internal Karyawan
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold text-[#004582] tracking-tight">
            Portal Manajemen Kalebox
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Khusus Owner, Manajer Operasional, Admin Kantor, Desainer, dan Staff Pabrik.
          </p>
        </div>

        <Card padding="p-8" className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Perusahaan"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pegawai@kalebox.id"
              icon={Mail}
            />

            <Input
              label="Kata Sandi"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-[#004582] focus:outline-none transition-colors p-1"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Masuk Sistem Internal
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Karyawan baru atau ingin buat akun?{' '}
            <Link to="/internal/daftar" className="text-[#DE0E86] font-bold hover:underline">
              Daftar Akun Baru
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InternalLoginPage;
