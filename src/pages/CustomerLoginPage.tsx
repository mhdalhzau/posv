import { useState } from 'react';
import { useRegisterUser } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';

export default function CustomerLoginPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const registerUser = useRegisterUser();

  const handleRegister = () => {
    if (!name.trim()) {
      toast.error('Nama harus diisi');
      return;
    }
    // Logic register sederhana untuk guest
    registerUser.mutate(name);
  };

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="px-0">
        <CardTitle>Selamat Datang</CardTitle>
        <CardDescription>Masukkan nama Anda untuk mulai memesan</CardDescription>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        <div className="space-y-2">
          <Label>Nama Lengkap</Label>
          <Input 
            placeholder="Contoh: Budi Santoso" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>
        <div className="space-y-2">
          <Label>Email (Opsional)</Label>
          <Input 
            placeholder="email@contoh.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
      </CardContent>
      <CardFooter className="px-0">
        <Button 
          className="w-full" 
          onClick={handleRegister} 
          disabled={registerUser.isPending}
        >
          {registerUser.isPending ? 'Mendaftar...' : 'Lanjut Memesan'}
        </Button>
      </CardFooter>
    </Card>
  );
}