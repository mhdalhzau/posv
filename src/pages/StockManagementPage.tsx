import { useState, useMemo } from 'react';
import { useListProductsByOutlet, useListActivePackages, useAddStock, useReduceStock, useTransferStock, useGetCallerUserProfile, useIsCallerAdmin, useListOutlets } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, ArrowRightLeft, PackageOpen, Eye, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Product } from '../types/backend';
import { calculatePackageStock } from '../lib/packageStockCalculator';

type StockAction = 'add' | 'reduce' | 'transfer';

export default function StockManagementPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: outlets } = useListOutlets();

  const isOwner = isAdmin;
  const userOutletId = userProfile?.outletId;
  const targetOutletId = isOwner ? null : userOutletId || null;

  const { data: products, isLoading: productsLoading } = useListProductsByOutlet(targetOutletId);
  const { data: packages, isLoading: packagesLoading } = useListActivePackages(targetOutletId);
  const addStockMutation = useAddStock();
  const reduceStockMutation = useReduceStock();
  const transferStockMutation = useTransferStock();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stockAction, setStockAction] = useState<StockAction>('add');
  const [quantity, setQuantity] = useState('');
  const [targetOutlet, setTargetOutlet] = useState('');

  const canManageStock = isOwner || (userProfile?.outletId !== undefined);

  // Calculate package stocks dynamically
  const packagesWithStock = useMemo(() => {
    if (!packages || !products) return [];
    return packages.map(pkg => ({
      ...pkg,
      stock: calculatePackageStock(pkg, products),
    }));
  }, [packages, products]);

  const resetForm = () => {
    setQuantity('');
    setTargetOutlet('');
  };

  const handleOpenDialog = (product: Product, action: StockAction) => {
    setSelectedProduct(product);
    setStockAction(action);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;

    const quantityBigInt = BigInt(quantity);

    if (stockAction === 'add') {
      addStockMutation.mutate(
        { productId: selectedProduct.id, quantity: quantityBigInt, outletId: selectedProduct.outletId },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            resetForm();
          },
        }
      );
    } else if (stockAction === 'reduce') {
      reduceStockMutation.mutate(
        { productId: selectedProduct.id, quantity: quantityBigInt, outletId: selectedProduct.outletId },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            resetForm();
          },
        }
      );
    } else if (stockAction === 'transfer') {
      if (!targetOutlet) return;
      transferStockMutation.mutate(
        {
          productId: selectedProduct.id,
          fromOutletId: selectedProduct.outletId,
          toOutletId: BigInt(targetOutlet),
          quantity: quantityBigInt,
        },
        {
          onSuccess: () => {
            setIsDialogOpen(false);
            resetForm();
          },
        }
      );
    }
  };

  const getDialogTitle = () => {
    switch (stockAction) {
      case 'add':
        return 'Tambah Stok';
      case 'reduce':
        return 'Kurangi Stok';
      case 'transfer':
        return 'Pindahkan Stok';
    }
  };

  const getDialogDescription = () => {
    switch (stockAction) {
      case 'add':
        return 'Masukkan jumlah stok yang akan ditambahkan';
      case 'reduce':
        return 'Masukkan jumlah stok yang akan dikurangi';
      case 'transfer':
        return 'Masukkan jumlah stok dan outlet tujuan';
    }
  };

  const getOutletName = (outletId: bigint) => {
    const outlet = outlets?.find(o => o.id === outletId);
    return outlet?.name || `Outlet #${outletId}`;
  };

  const getProductName = (productId: bigint) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || `Produk #${productId}`;
  };

  const isPending = addStockMutation.isPending || reduceStockMutation.isPending || transferStockMutation.isPending;
  const isLoading = productsLoading || packagesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Stok</h1>
          <p className="text-muted-foreground">
            {isOwner ? 'Kelola stok produk di semua outlet' : canManageStock ? 'Kelola stok produk di outlet Anda' : 'Lihat stok produk di outlet Anda'}
          </p>
        </div>
      </div>

      {!canManageStock && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Anda memiliki akses hanya-baca untuk stok. Hanya owner dan manager yang dapat mengelola stok produk.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Stok paket dihitung otomatis dari produk komponen. Perubahan stok produk satuan akan otomatis memperbarui stok paket.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Produk Satuan</TabsTrigger>
          <TabsTrigger value="packages">Paket</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Produk Satuan</CardTitle>
              <CardDescription>
                {isOwner ? 'Semua produk di semua outlet' : 'Produk di outlet Anda'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !products || products.length === 0 ? (
                <div className="text-center py-12">
                  <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada produk</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Belum ada produk yang tersedia untuk dikelola stoknya
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Produk</TableHead>
                        {isOwner && <TableHead>Outlet</TableHead>}
                        <TableHead>Stok Saat Ini</TableHead>
                        {canManageStock && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id.toString()}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          {isOwner && <TableCell>{getOutletName(product.outletId)}</TableCell>}
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                product.stock === BigInt(0)
                                  ? 'bg-destructive/10 text-destructive'
                                  : product.stock < BigInt(10)
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                              }`}
                            >
                              {product.stock.toString()} unit
                            </span>
                          </TableCell>
                          {canManageStock && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDialog(product, 'add')}
                                  className="gap-1"
                                >
                                  <Plus className="h-4 w-4" />
                                  Tambah
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDialog(product, 'reduce')}
                                  className="gap-1"
                                >
                                  <Minus className="h-4 w-4" />
                                  Kurangi
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenDialog(product, 'transfer')}
                                  className="gap-1"
                                >
                                  <ArrowRightLeft className="h-4 w-4" />
                                  Pindahkan
                                </Button>
                              </div>
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
        </TabsContent>

        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Paket</CardTitle>
              <CardDescription>
                Stok paket dihitung otomatis dari ketersediaan produk komponen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !packagesWithStock || packagesWithStock.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada paket</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    Belum ada paket yang tersedia
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Paket</TableHead>
                        {isOwner && <TableHead>Outlet</TableHead>}
                        <TableHead>Komponen</TableHead>
                        <TableHead>Stok Tersedia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packagesWithStock.map((pkg) => (
                        <TableRow key={pkg.id.toString()}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          {isOwner && <TableCell>{getOutletName(pkg.outletId)}</TableCell>}
                          <TableCell>
                            <div className="space-y-1">
                              {pkg.components.map((comp, idx) => {
                                const product = products?.find(p => p.id === comp.productId);
                                return (
                                  <div key={idx} className="text-sm">
                                    {getProductName(comp.productId)} × {comp.quantity.toString()}
                                    {product && (
                                      <span className="text-muted-foreground ml-2">
                                        (Stok: {product.stock.toString()})
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                                pkg.stock === BigInt(0)
                                  ? 'bg-destructive/10 text-destructive'
                                  : pkg.stock < BigInt(5)
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                              }`}
                            >
                              {pkg.stock.toString()} paket
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Action Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>{getDialogDescription()}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {selectedProduct && (
                <div className="space-y-2">
                  <Label>Produk</Label>
                  <div className="p-3 bg-muted rounded-md">
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Stok saat ini: {selectedProduct.stock.toString()} unit
                    </p>
                    {isOwner && (
                      <p className="text-sm text-muted-foreground">
                        Outlet: {getOutletName(selectedProduct.outletId)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Masukkan jumlah"
                  required
                />
              </div>

              {stockAction === 'transfer' && outlets && outlets.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="target-outlet">Outlet Tujuan</Label>
                  <Select value={targetOutlet} onValueChange={setTargetOutlet} required>
                    <SelectTrigger id="target-outlet">
                      <SelectValue placeholder="Pilih outlet tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {outlets
                        .filter(outlet => selectedProduct && outlet.id !== selectedProduct.outletId)
                        .map((outlet) => (
                          <SelectItem key={outlet.id.toString()} value={outlet.id.toString()}>
                            {outlet.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending || (stockAction === 'transfer' && !targetOutlet)}>
                {isPending ? 'Memproses...' : 'Konfirmasi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
