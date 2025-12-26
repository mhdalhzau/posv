import { useState } from 'react';
import { useLogin } from '../hooks/useAuth'; // Import hook baru
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ShoppingCart, User, Lock } from 'lucide-react';

export default function LoginPage() {
  const loginMutation = useLogin(); // Pakai hook mutation
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    // ✅ KIRIM PASSWORD KE HOOK
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
        
        {/* Branding Kiri */}
        <div className="space-y-6 text-center md:text-left hidden md:block">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
              <ShoppingCart className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">KasirKu</h1>
          </div>
          <h2 className="text-3xl font-semibold mb-4">Kelola Bisnis Anda dengan Lebih Cerdas</h2>
          <p className="text-lg text-muted-foreground">
            Masuk untuk mengakses dashboard dan Point of Sale.
          </p>
        </div>

        {/* Form Login Kanan */}
        <Card className="shadow-2xl border-primary/10">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Selamat Datang</CardTitle>
            <CardDescription>Silakan masuk akun Anda</CardDescription>
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
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Sedang Memuat...' : 'Masuk'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}