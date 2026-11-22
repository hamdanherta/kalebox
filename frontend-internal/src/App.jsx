import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layouts
import PublicLayout from './components/layout/PublicLayout';
import InternalLayout from './components/layout/InternalLayout';

// Public & Client Pages
import HomePage from './pages/public/HomePage';
import CatalogPage from './pages/public/CatalogPage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import OrderFormPage from './pages/public/OrderFormPage';
import OrderTrackPage from './pages/public/OrderTrackPage';
import HowToOrderPage from './pages/public/HowToOrderPage';
import CareersPage from './pages/public/CareersPage';
import MemberLoginPage from './pages/public/MemberLoginPage';
import MemberRegisterPage from './pages/public/MemberRegisterPage';

// Member Portal Pages
import MemberOrdersPage from './pages/member/MemberOrdersPage';
import MemberProfilePage from './pages/member/MemberProfilePage';

// Internal Authentication Pages
import InternalLoginPage from './pages/internal/InternalLoginPage';
import InternalRegisterPage from './pages/internal/InternalRegisterPage';

// Internal Portal Pages
import DashboardPage from './pages/internal/DashboardPage';
import OrdersPage from './pages/internal/OrdersPage';
import ProductsPage from './pages/internal/ProductsPage';
import EmployeesPage from './pages/internal/EmployeesPage';
import AttendancePage from './pages/internal/AttendancePage';
import LeavesPage from './pages/internal/LeavesPage';
import PayrollPage from './pages/internal/PayrollPage';
import ContentsPage from './pages/internal/ContentsPage';
import FinancePage from './pages/internal/FinancePage';
import PartnersPage from './pages/internal/PartnersPage';
import CareersManagePage from './pages/internal/CareersManagePage';
import SettingsPage from './pages/internal/SettingsPage';
import AuditLogPage from './pages/internal/AuditLogPage';

// Route Guards
const InternalRoute = ({ children }) => {
  const { isAuthenticated, isInternal, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#DE0E86] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isInternal) {
    return <Navigate to="/internal/login" replace />;
  }

  return children;
};

const ExecutiveRoute = ({ children }) => {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#DE0E86] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!['owner', 'manager', 'keuangan'].includes(role)) {
    return <Navigate to="/internal/dasbor" replace />;
  }

  return children;
};

const MemberRoute = ({ children }) => {
  const { isAuthenticated, isMember, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#DE0E86] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isMember) {
    return <Navigate to="/masuk" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <Routes>
              {/* 1. Public & Client Website Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="katalog" element={<CatalogPage />} />
                <Route path="katalog/:id" element={<ProductDetailPage />} />
                <Route path="pesan" element={<OrderFormPage />} />
                <Route path="lacak" element={<OrderTrackPage />} />
                <Route path="pesanan/:token" element={<OrderTrackPage />} />
                <Route path="cara-pesan" element={<HowToOrderPage />} />
                <Route path="karir" element={<CareersPage />} />
                <Route path="masuk" element={<MemberLoginPage />} />
                <Route path="daftar" element={<MemberRegisterPage />} />

                {/* Member Portal */}
                <Route
                  path="member/pesanan"
                  element={
                    <MemberRoute>
                      <MemberOrdersPage />
                    </MemberRoute>
                  }
                />
                <Route
                  path="member/akun"
                  element={
                    <MemberRoute>
                      <MemberProfilePage />
                    </MemberRoute>
                  }
                />
              </Route>

              {/* 2. Shortcuts to Internal Login/Register */}
              <Route path="/login" element={<Navigate to="/internal/login" replace />} />

              {/* 3. Internal Auth */}
              <Route path="/internal/login" element={<InternalLoginPage />} />
              <Route path="/internal/daftar" element={<InternalRegisterPage />} />

              {/* 4. Internal Protected Portal */}
              <Route
                path="/internal"
                element={
                  <InternalRoute>
                    <InternalLayout />
                  </InternalRoute>
                }
              >
                <Route index element={<Navigate to="/internal/dasbor" replace />} />
                <Route path="dasbor" element={<DashboardPage />} />
                <Route path="pesanan" element={<OrdersPage />} />
                <Route path="presensi" element={<AttendancePage />} />
                <Route path="cuti-lembur" element={<LeavesPage />} />
                <Route path="produk" element={<ProductsPage />} />
                <Route
                  path="karyawan"
                  element={
                    <ExecutiveRoute>
                      <EmployeesPage />
                    </ExecutiveRoute>
                  }
                />
                <Route path="mitra" element={<PartnersPage />} />
                <Route
                  path="penggajian"
                  element={
                    <ExecutiveRoute>
                      <PayrollPage />
                    </ExecutiveRoute>
                  }
                />
                <Route path="konten" element={<ContentsPage />} />
                <Route
                  path="keuangan"
                  element={
                    <ExecutiveRoute>
                      <FinancePage />
                    </ExecutiveRoute>
                  }
                />
                <Route
                  path="karir"
                  element={
                    <ExecutiveRoute>
                      <CareersManagePage />
                    </ExecutiveRoute>
                  }
                />
                <Route
                  path="pengaturan"
                  element={
                    <ExecutiveRoute>
                      <SettingsPage />
                    </ExecutiveRoute>
                  }
                />
                <Route
                  path="log-aktivitas"
                  element={
                    <ExecutiveRoute>
                      <AuditLogPage />
                    </ExecutiveRoute>
                  }
                />
              </Route>

              {/* Fallback to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
