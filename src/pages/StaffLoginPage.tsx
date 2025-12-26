import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, TrendingUp, Package, Receipt, ArrowLeft } from 'lucide-react';

interface StaffLoginPageProps {
  onBack: () => void;
}

export default function StaffLoginPage({ onBack }: StaffLoginPageProps) {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="space-y-6 text-center md:text-left">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
              <ShoppingCart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">KasirKu</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Sistem Point of Sale yang mudah dan modern untuk bisnis Anda
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
              <Package className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Manajemen Produk</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
              <Receipt className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Transaksi Cepat</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
              <TrendingUp className="h-8 w-8 text-primary" />
              <span className="text-sm font-medium">Laporan Penjualan</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Login Owner/Staff</CardTitle>
            <CardDescription>
              Masuk untuk mengakses sistem manajemen kasir
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  Memproses...
                </>
              ) : (
                'Masuk dengan Internet Identity'
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Dengan masuk, Anda menyetujui penggunaan Internet Identity untuk autentikasi yang aman
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
