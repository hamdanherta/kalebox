import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';
import { Menu, X, ShoppingBag, User, LogOut, Search, Phone, Mail, MapPin } from 'lucide-react';

export const PublicLayout = () => {
  const { user, isMember, isInternal, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Beranda', path: '/' },
    { name: 'Katalog Box', path: '/katalog' },
    { name: 'Cara Pesan', path: '/cara-pesan' },
    { name: 'Lacak Pesanan', path: '/lacak' },
    { name: 'Karir', path: '/karir' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-[#004582] selection:bg-[#DE0E86] selection:text-white">
      {/* Top Notification Bar */}
      <div className="bg-[#004582] text-white text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="font-medium tracking-tight">
            Percetakan Kemasan Food Grade & Box Custom Terpercaya di Indonesia
          </p>
          <div className="hidden sm:flex items-center gap-6 text-xs text-white/80">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#DE0E86]" /> 0812-3456-7890
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#DE0E86]" /> kontak@kalebox.id
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo/kaleboxlogo.png"
              alt="Kalebox Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-semibold tracking-tight transition-colors duration-200 ${
                    isActive
                      ? 'text-[#DE0E86] font-bold'
                      : 'text-[#004582] hover:text-[#DE0E86]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Auth & CTAs */}
          <div className="hidden md:flex items-center gap-4">
            {isInternal && (
              <Link to="/internal/dasbor">
                <Button variant="secondary" size="sm">
                  Dasbor Internal
                </Button>
              </Link>
            )}

            {isMember ? (
              <div className="flex items-center gap-3">
                <Link to="/member/pesanan">
                  <Button variant="light" size="sm" icon={ShoppingBag}>
                    Pesanan Saya
                  </Button>
                </Link>
                <Link to="/member/akun">
                  <Button variant="light" size="sm" icon={User}>
                    {user?.name?.split(' ')[0]}
                  </Button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                  title="Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              !isInternal && (
                <div className="flex items-center gap-3">
                  <Link to="/masuk">
                    <Button variant="ghost" size="sm">
                      Masuk Member
                    </Button>
                  </Link>
                  <Link to="/katalog">
                    <Button variant="primary" size="sm">
                      Pesan Kemasan
                    </Button>
                  </Link>
                </div>
              )
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#004582] hover:bg-[#F0F6FB] rounded-xl transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white px-6 pt-2 pb-6 shadow-xl space-y-4 animate-in slide-in-from-top-4">
            <nav className="flex flex-col space-y-3 pt-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-base font-semibold py-2 transition-colors ${
                      isActive ? 'text-[#DE0E86]' : 'text-[#004582]'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            <div className="pt-4 space-y-2">
              {isInternal && (
                <Link to="/internal/dasbor" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Dasbor Internal
                  </Button>
                </Link>
              )}

              {isMember ? (
                <>
                  <Link to="/member/pesanan" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="light" className="w-full mb-2" icon={ShoppingBag}>
                      Pesanan Saya
                    </Button>
                  </Link>
                  <Button
                    variant="danger"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    icon={LogOut}
                  >
                    Keluar Akun
                  </Button>
                </>
              ) : (
                !isInternal && (
                  <div className="flex flex-col gap-2">
                    <Link to="/masuk" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="light" className="w-full">
                        Masuk Member
                      </Button>
                    </Link>
                    <Link to="/katalog" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" className="w-full">
                        Pesan Kemasan
                      </Button>
                    </Link>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white pt-16 pb-12 mt-20 shadow-[0_-4px_20px_rgba(0,69,130,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Col 1: Brand Info */}
            <div className="space-y-4 md:col-span-1">
              <img
                src="/logo/kaleboxlogo.png"
                alt="Kalebox Logo"
                className="h-10 w-auto object-contain"
              />
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">
                Penyedia kemasan kotak custom profesional, higienis berstandar food grade dengan presisi cetak offset dan digital terdepan di Indonesia.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider mb-4">
                Navigasi Cepat
              </h4>
              <ul className="space-y-2.5 text-sm font-medium text-slate-600">
                <li><Link to="/katalog" className="hover:text-[#DE0E86] transition-colors">Katalog Box</Link></li>
                <li><Link to="/cara-pesan" className="hover:text-[#DE0E86] transition-colors">Panduan Pemesanan</Link></li>
                <li><Link to="/lacak" className="hover:text-[#DE0E86] transition-colors">Lacak Status Pesanan</Link></li>
                <li><Link to="/karir" className="hover:text-[#DE0E86] transition-colors">Karir & Rekrutmen</Link></li>
              </ul>
            </div>

            {/* Col 3: Produk Populer */}
            <div>
              <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider mb-4">
                Pilihan Kemasan
              </h4>
              <ul className="space-y-2.5 text-sm font-medium text-slate-600">
                <li><Link to="/katalog" className="hover:text-[#DE0E86] transition-colors">Box Makanan Food Grade</Link></li>
                <li><Link to="/katalog" className="hover:text-[#DE0E86] transition-colors">Hard Box & Gift Box Premium</Link></li>
                <li><Link to="/katalog" className="hover:text-[#DE0E86] transition-colors">Corrugated Mailer Box</Link></li>
                <li><Link to="/katalog" className="hover:text-[#DE0E86] transition-colors">Sleeve & Paper Tray</Link></li>
              </ul>
            </div>

            {/* Col 4: Kantor & Kontak */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#004582] uppercase tracking-wider mb-4">
                Kontak & Workshop
              </h4>
              <p className="text-xs text-slate-600 flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#DE0E86] flex-shrink-0 mt-0.5" />
                <span>Jl. Kolonel Pol. M. Thaher No. 88, Wijayapura, Jambi Selatan, Kota Jambi 36139</span>
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#DE0E86] flex-shrink-0" />
                <span>0812-3456-7890 (WhatsApp Official)</span>
              </p>
              <p className="text-xs text-slate-600 flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#DE0E86] flex-shrink-0" />
                <span>kontak@kalebox.id</span>
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-4">
            <p>© {new Date().getFullYear()} Kalebox Percetakan Kemasan. Hak Cipta Dilindungi Undang-Undang.</p>
            <p className="tracking-tight text-slate-400">
              Standar Kualitas Cetak & Food Grade Indonesia
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
