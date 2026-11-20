import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layout
import InternalLayout from './components/layout/InternalLayout';

// Internal Authentication Pages
import InternalLoginPage from './pages/internal/InternalLoginPage';
import InternalRegisterPage from './pages/internal/InternalRegisterPage';

// Internal Pages
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

  if (!['owner', 'manager'].includes(role)) {
    return <Navigate to="/internal/dasbor" replace />;
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
              {/* Root redirect directly to internal login / dashboard */}
              <Route path="/" element={<Navigate to="/internal/dasbor" replace />} />
              <Route path="/login" element={<Navigate to="/internal/login" replace />} />
              <Route path="/masuk" element={<Navigate to="/internal/login" replace />} />
              <Route path="/daftar" element={<Navigate to="/internal/daftar" replace />} />

              {/* Internal Auth */}
              <Route path="/internal/login" element={<InternalLoginPage />} />
              <Route path="/internal/daftar" element={<InternalRegisterPage />} />

              {/* Internal Protected Portal */}
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

              {/* Fallback to dashboard */}
              <Route path="*" element={<Navigate to="/internal/dasbor" replace />} />
            </Routes>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
