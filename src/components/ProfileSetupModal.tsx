import { useState } from 'react';
import { useSaveCallerUserProfile, useListOutlets, useIsCallerAdmin } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppRole } from '../backend';

export default function ProfileSetupModal() {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AppRole>(AppRole.cashier);
  const [outletId, setOutletId] = useState<string>('');
  const saveProfile = useSaveCallerUserProfile();
  const { data: outlets } = useListOutlets();
  const { data: isAdmin } = useIsCallerAdmin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const profile = {
        name: name.trim(),
        role,
        outletId: outletId ? BigInt(outletId) : undefined,
      };
      saveProfile.mutate(profile);
    }
  };

  // For first-time setup, user is admin (owner)
  const isFirstTimeSetup = isAdmin;

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Selamat Datang!</DialogTitle>
          <DialogDescription>
            Silakan lengkapi profil Anda untuk melanjutkan
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              placeholder="Masukkan nama Anda"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {isFirstTimeSetup && (
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value) => setRole(value as AppRole)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AppRole.owner}>Owner</SelectItem>
                  <SelectItem value={AppRole.manager}>Manager</SelectItem>
                  <SelectItem value={AppRole.cashier}>Kasir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {(role === AppRole.manager || role === AppRole.cashier) && outlets && outlets.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="outlet">Outlet (Opsional)</Label>
              <Select value={outletId} onValueChange={setOutletId}>
                <SelectTrigger id="outlet">
                  <SelectValue placeholder="Pilih outlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak ada</SelectItem>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id.toString()} value={outlet.id.toString()}>
                      {outlet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim() || saveProfile.isPending}
          >
            {saveProfile.isPending ? 'Menyimpan...' : 'Lanjutkan'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
