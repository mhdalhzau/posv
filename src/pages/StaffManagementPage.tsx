import { useState, useEffect } from 'react';
import { useListAllUsers, useUpdateUserProfile, useRemoveUser, useListOutlets } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Users } from 'lucide-react';
import { AppRole, UserProfile } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

export default function StaffManagementPage() {
  const { data: users, isLoading } = useListAllUsers();
  const { data: outlets } = useListOutlets();
  const updateUserProfile = useUpdateUserProfile();
  const removeUser = useRemoveUser();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ principal: Principal; profile: UserProfile } | null>(null);

  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<AppRole>(AppRole.cashier);
  const [editOutletId, setEditOutletId] = useState<string>('none');

  // Clear outlet when role changes to owner
  useEffect(() => {
    if (editRole === AppRole.owner) {
      setEditOutletId('none');
    }
  }, [editRole]);

  const handleEditClick = (principal: Principal, profile: UserProfile) => {
    setSelectedUser({ principal, profile });
    setEditName(profile.name);
    setEditRole(profile.role);
    setEditOutletId(profile.outletId?.toString() || 'none');
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (principal: Principal, profile: UserProfile) => {
    setSelectedUser({ principal, profile });
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editName.trim()) return;

    const updatedProfile: UserProfile = {
      name: editName.trim(),
      role: editRole,
      outletId: editRole === AppRole.owner || editOutletId === 'none' ? undefined : BigInt(editOutletId),
    };

    updateUserProfile.mutate(
      { userId: selectedUser.principal, profile: updatedProfile },
      {
        onSuccess: () => {
          setEditDialogOpen(false);
          setSelectedUser(null);
          setEditName('');
          setEditRole(AppRole.cashier);
          setEditOutletId('none');
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    if (!selectedUser) return;

    removeUser.mutate(selectedUser.principal, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      },
    });
  };

  const getRoleBadge = (role: AppRole) => {
    if (role === AppRole.owner) {
      return <Badge variant="default">Owner</Badge>;
    } else if (role === AppRole.manager) {
      return <Badge variant="secondary">Manager</Badge>;
    } else if (role === AppRole.cashier) {
      return <Badge variant="outline">Kasir</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getOutletName = (outletId?: bigint) => {
    if (!outletId || !outlets) return '-';
    const outlet = outlets.find((o) => o.id === outletId);
    return outlet ? outlet.name : '-';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Memuat data staf...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Staf</h1>
          <p className="text-muted-foreground">Kelola pengguna dan hak akses mereka</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar Staf
              </CardTitle>
              <CardDescription>
                Total {users?.length || 0} pengguna terdaftar
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada staf terdaftar</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Principal ID</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(([principal, profile]) => (
                    <TableRow key={principal.toString()}>
                      <TableCell className="font-medium">{profile.name}</TableCell>
                      <TableCell>{getRoleBadge(profile.role)}</TableCell>
                      <TableCell>{getOutletName(profile.outletId)}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {principal.toString().slice(0, 20)}...
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditClick(principal, profile)}
                            title="Edit staf"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(principal, profile)}
                            title="Hapus staf"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profil Staf</DialogTitle>
            <DialogDescription>
              Ubah informasi staf dan hak akses mereka
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nama Lengkap</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Masukkan nama"
                required
                disabled={updateUserProfile.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select 
                value={editRole} 
                onValueChange={(value) => setEditRole(value as AppRole)}
                disabled={updateUserProfile.isPending}
              >
                <SelectTrigger id="edit-role">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={AppRole.owner}>Owner</SelectItem>
                  <SelectItem value={AppRole.manager}>Manager</SelectItem>
                  <SelectItem value={AppRole.cashier}>Kasir</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(editRole === AppRole.manager || editRole === AppRole.cashier) && (
              <div className="space-y-2">
                <Label htmlFor="edit-outlet">Outlet</Label>
                <Select 
                  value={editOutletId} 
                  onValueChange={setEditOutletId}
                  disabled={updateUserProfile.isPending}
                >
                  <SelectTrigger id="edit-outlet">
                    <SelectValue placeholder="Pilih outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak ada</SelectItem>
                    {outlets && outlets.map((outlet) => (
                      <SelectItem key={outlet.id.toString()} value={outlet.id.toString()}>
                        {outlet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih outlet yang akan dikelola oleh staf ini
                </p>
              </div>
            )}

            {editRole === AppRole.owner && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm text-muted-foreground">
                  Owner memiliki akses ke semua outlet dan tidak perlu assignment outlet spesifik.
                </p>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={updateUserProfile.isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={updateUserProfile.isPending}>
                {updateUserProfile.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Staf</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus staf <strong>{selectedUser?.profile.name}</strong>?
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeUser.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={removeUser.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeUser.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
