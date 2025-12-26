import { useState, useEffect } from 'react';
import { useIsCallerAdmin, useGetMenuAccessConfig, useSaveMenuAccessConfig } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Settings, AlertCircle, RotateCcw } from 'lucide-react';
import type { MenuAccess } from '../backend';

interface MenuAccessState {
  manager: MenuAccess[];
  cashier: MenuAccess[];
  owner: MenuAccess[];
}

const menuLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  pos: 'Kasir (POS)',
  products: 'Produk',
  reports: 'Laporan',
  stock: 'Manajemen Stok',
  staff: 'Manajemen Staf',
  outlets: 'Outlet',
  categories: 'Kategori & Brand',
  settings: 'Pengaturan',
};

const defaultMenuAccess: MenuAccessState = {
  cashier: [
    { menu: 'dashboard', isAccessible: true },
    { menu: 'pos', isAccessible: true },
    { menu: 'products', isAccessible: true },
    { menu: 'reports', isAccessible: false },
    { menu: 'stock', isAccessible: false },
    { menu: 'staff', isAccessible: false },
    { menu: 'outlets', isAccessible: false },
    { menu: 'categories', isAccessible: false },
    { menu: 'settings', isAccessible: false },
  ],
  manager: [
    { menu: 'dashboard', isAccessible: true },
    { menu: 'pos', isAccessible: false },
    { menu: 'products', isAccessible: true },
    { menu: 'reports', isAccessible: true },
    { menu: 'stock', isAccessible: true },
    { menu: 'staff', isAccessible: true },
    { menu: 'outlets', isAccessible: false },
    { menu: 'categories', isAccessible: true },
    { menu: 'settings', isAccessible: false },
  ],
  owner: [
    { menu: 'dashboard', isAccessible: true },
    { menu: 'pos', isAccessible: true },
    { menu: 'products', isAccessible: true },
    { menu: 'reports', isAccessible: true },
    { menu: 'stock', isAccessible: true },
    { menu: 'staff', isAccessible: true },
    { menu: 'outlets', isAccessible: true },
    { menu: 'categories', isAccessible: true },
    { menu: 'settings', isAccessible: true },
  ],
};

export default function SettingsPage() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: menuConfig, isLoading: configLoading } = useGetMenuAccessConfig();
  const saveConfig = useSaveMenuAccessConfig();

  const [localConfig, setLocalConfig] = useState<MenuAccessState>(defaultMenuAccess);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local config from backend
  useEffect(() => {
    if (menuConfig) {
      setLocalConfig({
        cashier: menuConfig.cashier,
        manager: menuConfig.manager,
        owner: menuConfig.owner,
      });
    }
  }, [menuConfig]);

  // Check if user is owner
  if (isAdminLoading || configLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container max-w-4xl py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anda tidak memiliki akses ke halaman ini. Hanya owner yang dapat mengkonfigurasi pengaturan akses menu.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleToggle = (role: 'manager' | 'cashier', menuKey: string) => {
    setLocalConfig(prev => ({
      ...prev,
      [role]: prev[role].map(item =>
        item.menu === menuKey ? { ...item, isAccessible: !item.isAccessible } : item
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await saveConfig.mutateAsync({
        cashier: localConfig.cashier,
        manager: localConfig.manager,
        owner: localConfig.owner,
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save menu access config:', error);
    }
  };

  const handleReset = () => {
    setLocalConfig(defaultMenuAccess);
    setHasChanges(true);
  };

  const getMenuAccess = (role: 'manager' | 'cashier', menuKey: string): boolean => {
    const menuItem = localConfig[role].find(m => m.menu === menuKey);
    return menuItem ? menuItem.isAccessible : false;
  };

  const allMenuKeys = Object.keys(menuLabels);

  return (
    <div className="container max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Pengaturan Akses Menu
          </h1>
          <p className="text-muted-foreground mt-2">
            Konfigurasi akses menu untuk setiap role pengguna (Manager dan Kasir)
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Owner selalu memiliki akses penuh ke semua menu dan tidak dapat diubah. Konfigurasi ini hanya berlaku untuk Manager dan Kasir.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Konfigurasi Akses Menu</CardTitle>
          <CardDescription>
            Aktifkan atau nonaktifkan akses menu untuk setiap role. Perubahan akan diterapkan setelah Anda menyimpan konfigurasi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Manager Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Manager</h3>
              <p className="text-sm text-muted-foreground">
                Konfigurasi akses menu untuk role Manager
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allMenuKeys.map(menuKey => (
                <div key={`manager-${menuKey}`} className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <Label htmlFor={`manager-${menuKey}`} className="flex-1 cursor-pointer">
                    {menuLabels[menuKey]}
                  </Label>
                  <Switch
                    id={`manager-${menuKey}`}
                    checked={getMenuAccess('manager', menuKey)}
                    onCheckedChange={() => handleToggle('manager', menuKey)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Cashier Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Kasir</h3>
              <p className="text-sm text-muted-foreground">
                Konfigurasi akses menu untuk role Kasir
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allMenuKeys.map(menuKey => (
                <div key={`cashier-${menuKey}`} className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                  <Label htmlFor={`cashier-${menuKey}`} className="flex-1 cursor-pointer">
                    {menuLabels[menuKey]}
                  </Label>
                  <Switch
                    id={`cashier-${menuKey}`}
                    checked={getMenuAccess('cashier', menuKey)}
                    onCheckedChange={() => handleToggle('cashier', menuKey)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Owner Section (Read-only) */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Owner</h3>
              <p className="text-sm text-muted-foreground">
                Owner memiliki akses penuh ke semua menu (tidak dapat diubah)
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allMenuKeys.map(menuKey => (
                <div key={`owner-${menuKey}`} className="flex items-center justify-between space-x-2 rounded-lg border p-4 bg-muted/50">
                  <Label className="flex-1 text-muted-foreground">
                    {menuLabels[menuKey]}
                  </Label>
                  <Switch
                    checked={true}
                    disabled
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={saveConfig.isPending}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset ke Default
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saveConfig.isPending}
            >
              {saveConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Konfigurasi'
              )}
            </Button>
          </div>

          {hasChanges && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Anda memiliki perubahan yang belum disimpan. Klik "Simpan Konfigurasi" untuk menerapkan perubahan.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
