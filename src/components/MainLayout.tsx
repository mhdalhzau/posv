import { useCurrentUser, useLogout } from '../hooks/useAuth'; // UBAH IMPORT INI
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  Users,
  Store,
  Menu,
  LogOut,
  User,
  Warehouse,
  Tag,
  Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AppRole } from '../backend';

interface MainLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function MainLayout({ children, currentPage, onNavigate }: MainLayoutProps) {
  // --- PERBAIKAN: Ganti useAuth() dengan hook React Query ---
  const { data: user } = useCurrentUser(); 
  const logout = useLogout();
  // ---------------------------------------------------------

  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    queryClient.clear();
  };

  // Konfigurasi akses menu berdasarkan Role
  const getAccessibleMenus = (role?: AppRole): string[] => {
    if (!role) return [];

    const allMenus = [
      'dashboard', 
      'pos', 
      'products', 
      'stock', 
      'categories', 
      'reports', 
      'outlets', 
      'staff', 
      'settings'
    ];

    switch (role) {
      case AppRole.owner:
      case AppRole.manager:
        return allMenus;
      case AppRole.cashier:
        return ['dashboard', 'pos', 'products', 'stock', 'categories'];
      default:
        return [];
    }
  };

  const allowedMenus = getAccessibleMenus(user?.role);

  const isMenuAccessible = (menuKey: string): boolean => {
    return allowedMenus.includes(menuKey);
  };

  const allNavigationItems = [
    { name: 'Dashboard', page: 'dashboard', icon: LayoutDashboard, menuKey: 'dashboard' },
    { name: 'Kasir (POS)', page: 'pos', icon: ShoppingCart, menuKey: 'pos' },
    { name: 'Produk', page: 'products', icon: Package, menuKey: 'products' },
    { name: 'Manajemen Stok', page: 'stock', icon: Warehouse, menuKey: 'stock' },
    { name: 'Kategori & Brand', page: 'categories-brands', icon: Tag, menuKey: 'categories' },
    { name: 'Laporan', page: 'reports', icon: FileText, menuKey: 'reports' },
    { name: 'Outlet', page: 'outlets', icon: Store, menuKey: 'outlets' },
    { name: 'Manajemen Staf', page: 'staff', icon: Users, menuKey: 'staff' },
    { name: 'Pengaturan', page: 'settings', icon: Settings, menuKey: 'settings' },
  ];

  const navigation = allNavigationItems.filter(item => isMenuAccessible(item.menuKey));

  // Redirect jika halaman tidak bisa diakses
  useEffect(() => {
    if (user && navigation.length > 0) {
      const currentPageAccessible = navigation.some(item => item.page === currentPage);
      // Cek agar tidak redirect loop jika sedang di halaman valid
      if (!currentPageAccessible && currentPage !== 'login') {
        onNavigate(navigation[0].page);
      }
    }
  }, [user, currentPage, navigation, onNavigate]);

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.page;
        return (
          <button
            key={item.name}
            onClick={() => {
              onNavigate(item.page);
              if (mobile) setIsMobileMenuOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent ${
              isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center border-b px-6">
                  <h2 className="text-lg font-semibold">Menu</h2>
                </div>
                <nav className="flex flex-col gap-1 p-4">
                  <NavLinks mobile />
                </nav>
              </SheetContent>
            </Sheet>
            <button onClick={() => onNavigate('dashboard')} className="flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">POS System</span>
            </button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">{user?.name || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.role === AppRole.owner ? 'Owner' : user?.role === AppRole.manager ? 'Manager' : 'Kasir'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden w-64 border-r bg-muted/40 md:block">
          <nav className="flex flex-col gap-1 p-4">
            <NavLinks />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="container py-6">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © 2025. Dibuat dengan ❤️ menggunakan{' '}
          <a href="#" className="text-primary hover:underline">
            KasirKu System
          </a>
        </div>
      </footer>
    </div>
  );
}