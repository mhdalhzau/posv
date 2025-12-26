import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Smartphone, CreditCard, Clock, ArrowLeft } from 'lucide-react';

interface CustomerLoginPageProps {
  onBack: () => void;
}

export default function CustomerLoginPage({ onBack }: CustomerLoginPageProps) {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/5 via-background to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="space-y-6 text-center md:text-left">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-accent-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Kiosk Belanja</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Belanja mudah dan cepat dengan sistem kiosk mandiri
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
              <Smartphone className="h-8 w-8 text-accent-foreground" />
              <span className="text-sm font-medium">Belanja Mandiri</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
              <CreditCard className="h-8 w-8 text-accent-foreground" />
              <span className="text-sm font-medium">Pembayaran Mudah</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border">
              <Clock className="h-8 w-8 text-accent-foreground" />
              <span className="text-sm font-medium">Lacak Pesanan</span>
            </div>
          </div>
        </div>

        {/* Right side - Login Card */}
        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Selamat Datang Pelanggan</CardTitle>
            <CardDescription>
              Masuk atau daftar untuk mulai berbelanja
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base"
              size="lg"
              variant="default"
            >
              {isLoggingIn ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  Memproses...
                </>
              ) : (
                'Masuk/Daftar dengan Internet Identity'
              )}
            </Button>
            
            <div className="text-xs text-center text-muted-foreground space-y-2">
              <p>Pengguna baru akan otomatis terdaftar sebagai pelanggan</p>
              <p>Dengan masuk, Anda menyetujui penggunaan Internet Identity untuk autentikasi yang aman</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
