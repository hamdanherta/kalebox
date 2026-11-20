import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const MemberLoginPage = () => {
  const { loginMember } = useAuth();
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
      await loginMember(email, password);
      addToast('Selamat datang kembali di Kalebox!', 'success');
      navigate('/member/pesanan');
    } catch (err) {
      addToast(err.message || 'Login gagal. Periksa email dan kata sandi Anda.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="primary" size="sm">Area Member Pelanggan</Badge>
          <h1 className="text-3xl font-extrabold text-[#004582] tracking-tight">
            Masuk ke Akun Kalebox
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Pantau seluruh riwayat pesanan box, unduh invoice, dan kelola alamat pengiriman Anda dengan mudah.
          </p>
        </div>

        <Card padding="p-8" className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              Masuk Akun Member
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
            Belum memiliki akun member?{' '}
            <Link to="/daftar" className="text-[#DE0E86] font-bold hover:underline">
              Daftar Sekarang
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MemberLoginPage;
