import { useState } from 'react';
import { useCurrentUser } from './hooks/useAuth'; // Gunakan hook baru ini
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

// Halaman-halaman
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ProductManagementPage from './pages/ProductManagementPage';
import POSPage from './pages/POSPage';
import ReportsPage from './pages/ReportsPage';
import OutletsPage from './pages/OutletsPage';
import StaffManagementPage from './pages/StaffManagementPage';
import StockManagementPage from './pages/StockManagementPage';
import CategoryBrandPage from './pages/CategoryBrandPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  // 1. Ambil data user dari React Query
  const { data: user, isLoading } = useCurrentUser();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  // 2. Tampilkan Loading saat cek token (agar tidak flickering ke login page)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 3. Jika user tidak ada (belum login / token expired), tampilkan Login Page
  if (!user) {
    return <LoginPage />;
  }

  // 4. Router Sederhana (Hanya render jika user sudah login)
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
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {/* HAPUS AuthProvider, karena QueryClientProvider sudah ada di main.tsx */}
      <AppContent />
      <Toaster />
    </ThemeProvider>
  );
}