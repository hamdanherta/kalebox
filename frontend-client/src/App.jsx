import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/common/ErrorBoundary';

// Layout
import PublicLayout from './components/layout/PublicLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import CatalogPage from './pages/public/CatalogPage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import OrderFormPage from './pages/public/OrderFormPage';
import OrderTrackPage from './pages/public/OrderTrackPage';
import HowToOrderPage from './pages/public/HowToOrderPage';
import CareersPage from './pages/public/CareersPage';
import MemberLoginPage from './pages/public/MemberLoginPage';
import MemberRegisterPage from './pages/public/MemberRegisterPage';

// Member Pages
import MemberOrdersPage from './pages/member/MemberOrdersPage';
import MemberProfilePage from './pages/member/MemberProfilePage';

// Member Route Guard
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
              {/* Public Website Routes */}
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
