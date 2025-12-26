import { useState } from 'react';
import { useListOutlets, useAddOutlet, useUpdateOutlet, useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Store } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { Outlet } from '../types';

export default function OutletsPage() {
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: outlets, isLoading } = useListOutlets();
  const addOutlet = useAddOutlet();
  const updateOutlet = useUpdateOutlet();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
  });

  const resetForm = () => {
    setFormData({ name: '', address: '' });
  };

  const handleAdd = () => {
    setIsAddDialogOpen(true);
    resetForm();
  };

  const handleEdit = (outlet: Outlet) => {
    setSelectedOutlet(outlet);
    setFormData({
      name: outlet.name,
      address: outlet.address,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addOutlet.mutate(
      {
        name: formData.name,
        address: formData.address,
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false);
          resetForm();
        },
      }
    );
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutlet) return;
    updateOutlet.mutate(
      {
        id: selectedOutlet.id,
        name: formData.name,
        address: formData.address,
        isActive: selectedOutlet.isActive,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedOutlet(null);
          resetForm();
        },
      }
    );
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp / BigInt(1000000))).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Outlet</h1>
          <p className="text-muted-foreground">Kelola semua outlet toko Anda</p>
        </div>
        {isAdmin && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Outlet
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Outlet</CardTitle>
          <CardDescription>Semua outlet yang terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !outlets || outlets.length === 0 ? (
            <div className="text-center py-12">
              <Store className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Belum ada outlet</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Mulai dengan menambahkan outlet pertama Anda
              </p>
              {isAdmin && (
                <Button onClick={handleAdd} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Outlet
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Outlet</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Tanggal Dibuat</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outlets.map((outlet) => (
                    <TableRow key={outlet.id.toString()}>
                      <TableCell className="font-medium">{outlet.name}</TableCell>
                      <TableCell>{outlet.address}</TableCell>
                      <TableCell>{formatDate(outlet.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={outlet.isActive ? 'default' : 'secondary'}>
                          {outlet.isActive ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(outlet)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Outlet Dialog */}
      {isAdmin && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Outlet Baru</DialogTitle>
              <DialogDescription>Masukkan informasi outlet yang akan ditambahkan</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitAdd}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="add-name">Nama Outlet</Label>
                  <Input
                    id="add-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-address">Alamat</Label>
                  <Textarea
                    id="add-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={addOutlet.isPending}>
                  {addOutlet.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Outlet Dialog */}
      {isAdmin && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Outlet</DialogTitle>
              <DialogDescription>Perbarui informasi outlet</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nama Outlet</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Alamat</Label>
                  <Textarea
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={updateOutlet.isPending}>
                  {updateOutlet.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
