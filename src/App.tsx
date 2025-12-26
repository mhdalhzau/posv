import { useState } from 'react';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import LoginPage from './pages/LoginPage';
import ProfileSetupModal from './components/ProfileSetupModal';
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

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');

  const isAuthenticated = !!identity;

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Memuat...</p>
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <LoginPage />
        <Toaster />
      </ThemeProvider>
    );
  }

  // Show profile setup modal if user doesn't have a profile yet
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'products':
        return <ProductManagementPage />;
      case 'pos':
        return <POSPage />;
      case 'reports':
        return <ReportsPage />;
      case 'outlets':
        return <OutletsPage />;
      case 'staff':
        return <StaffManagementPage />;
      case 'stock':
        return <StockManagementPage />;
      case 'categories-brands':
        return <CategoryBrandPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {showProfileSetup && <ProfileSetupModal />}
      {!showProfileSetup && (
        <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
          {renderPage()}
        </MainLayout>
      )}
      <Toaster />
    </ThemeProvider>
  );
}
