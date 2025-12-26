// src/App.tsx
import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth'; // Import Auth baru
// Hapus import useInternetIdentity dan useGetCallerUserProfile jika tidak dipakai lagi untuk auth awal
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
// ... import halaman lainnya tetap sama
import DashboardPage from './pages/DashboardPage';
import ProductManagementPage from './pages/ProductManagementPage';
import POSPage from './pages/POSPage';
import ReportsPage from './pages/ReportsPage';
import OutletsPage from './pages/OutletsPage';
import StaffManagementPage from './pages/StaffManagementPage';
import StockManagementPage from './pages/StockManagementPage';
import CategoryBrandPage from './pages/CategoryBrandPage';
import SettingsPage from './pages/SettingsPage';
// ProfileSetupModal mungkin tidak diperlukan lagi jika data user langsung didapat dari login database backend standar, 
// tapi jika masih butuh, logika bisa disesuaikan.

// Komponen Wrapper untuk menangani logika Auth di dalam Provider
const AppContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  // Jika belum login, tampilkan Login Page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Router sederhana
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'products': return <ProductManagementPage />;
      case 'pos': return <POSPage />;
      case 'reports': return <ReportsPage />;
      case 'outlets': return <OutletsPage />;
      case 'staff': return <StaffManagementPage />;
      case 'stock': return <StockManagementPage />;
      case 'categories-brands': return <CategoryBrandPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </MainLayout>
  );
};

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}