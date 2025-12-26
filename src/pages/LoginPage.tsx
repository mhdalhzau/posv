// src/pages/LoginPage.tsx
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Package, Receipt, TrendingUp, Lock, User } from 'lucide-react';
import { AppRole } from '../backend';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AppRole>(AppRole.owner);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    // Di sini kita memanggil fungsi login dari hook useAuth
    await login(username, role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Sisi Kiri - Branding (Sama seperti sebelumnya) */}
        <div className="space-y-6 text-center md:text-left hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">KasirKu</h1>
          </div>
          
          <h2 className="text-3xl font-semibold mb-4">Kelola Bisnis Anda dengan Lebih Cerdas</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Sistem Point of Sale modern yang terintegrasi untuk memaksimalkan efisiensi operasional harian Anda.
          </p>
          
          <div className="grid gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border backdrop-blur-sm">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Manajemen Stok</p>
                <p className="text-sm text-muted-foreground">Pantau inventaris secara real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border backdrop-blur-sm">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Analisis Penjualan</p>
                <p className="text-sm text-muted-foreground">Laporan lengkap performa bisnis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sisi Kanan - Login Form Baru */}
        <Card className="shadow-2xl border-primary/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Selamat Datang Kembali</CardTitle>
            <CardDescription>
              Silakan masuk dengan akun Anda
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="username" 
                    placeholder="Masukkan username" 
                    className="pl-9"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Masukkan password" 
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Login Sebagai (Simulasi)</Label>
                <Select 
                  value={role} 
                  onValueChange={(val) => setRole(val as AppRole)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={AppRole.owner}>Owner (Pemilik)</SelectItem>
                    <SelectItem value={AppRole.manager}>Manager</SelectItem>
                    <SelectItem value={AppRole.cashier}>Cashier (Kasir)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full h-11 text-base font-medium shadow-lg shadow-primary/20" 
                disabled={isLoading}
              >
                {isLoading ? 'Memproses...' : 'Masuk'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Lupa password? Hubungi administrator sistem.
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}