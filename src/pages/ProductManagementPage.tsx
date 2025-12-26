import { useState, useMemo } from 'react';
import { useListProductsByOutlet, useAddProduct, useUpdateProduct, useDeleteProduct, useGetCallerUserProfile, useIsCallerAdmin, useListOutlets, useGetAllCategories, useGetAllBrands, useListActivePackages, useCreatePackage, useUpdatePackage, useMarkPackageInactive, useListActiveBundles, useCreateBundle, useUpdateBundle, useMarkBundleInactive } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Package, Eye, PackagePlus, Minus, Layers } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Product, ProductPackage, PackageComponent, Bundle, BundleItem } from '../backend';
import { calculatePackageStock, calculateBundleStock } from '../lib/packageStockCalculator';

interface ComponentInput {
  productId: string;
  quantity: string;
}

interface BundleItemInput {
  productId: string;
  packageId: string;
  quantity: string;
  isPackage: boolean;
}

export default function ProductManagementPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: outlets } = useListOutlets();
  const { data: categories } = useGetAllCategories();
  const { data: brands } = useGetAllBrands();

  const isOwner = isAdmin;
  const userOutletId = userProfile?.outletId;
  const targetOutletId = isOwner ? null : userOutletId || null;

  const { data: products, isLoading: productsLoading } = useListProductsByOutlet(targetOutletId);
  const { data: packages, isLoading: packagesLoading } = useListActivePackages(targetOutletId);
  const { data: bundles, isLoading: bundlesLoading } = useListActiveBundles(targetOutletId);

  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const markPackageInactive = useMarkPackageInactive();
  const createBundle = useCreateBundle();
  const updateBundle = useUpdateBundle();
  const markBundleInactive = useMarkBundleInactive();

  const [activeTab, setActiveTab] = useState('products');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | ProductPackage | Bundle | null>(null);

  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    outletId: '',
    categoryId: 'none',
    brandId: 'none',
  });

  // Package form
  const [packageForm, setPackageForm] = useState({
    name: '',
    price: '',
    outletId: '',
  });
  const [packageComponents, setPackageComponents] = useState<ComponentInput[]>([{ productId: '', quantity: '1' }]);

  // Bundle form
  const [bundleForm, setBundleForm] = useState({
    name: '',
    price: '',
    outletId: '',
  });
  const [bundleItems, setBundleItems] = useState<BundleItemInput[]>([{ productId: '', packageId: '', quantity: '1', isPackage: false }]);

  // Calculate stocks dynamically
  const packagesWithStock = useMemo(() => {
    if (!packages || !products) return [];
    return packages.map(pkg => ({
      ...pkg,
      stock: calculatePackageStock(pkg, products),
    }));
  }, [packages, products]);

  const bundlesWithStock = useMemo(() => {
    if (!bundles || !products || !packages) return [];
    return bundles.map(bundle => ({
      ...bundle,
      stock: calculateBundleStock(bundle, products, packages),
    }));
  }, [bundles, products, packages]);

  const resetForms = () => {
    setProductForm({ 
      name: '', 
      price: '', 
      stock: '', 
      outletId: userOutletId?.toString() || '',
      categoryId: 'none',
      brandId: 'none',
    });
    setPackageForm({ 
      name: '', 
      price: '', 
      outletId: userOutletId?.toString() || '',
    });
    setPackageComponents([{ productId: '', quantity: '1' }]);
    setBundleForm({ 
      name: '', 
      price: '', 
      outletId: userOutletId?.toString() || '',
    });
    setBundleItems([{ productId: '', packageId: '', quantity: '1', isPackage: false }]);
  };

  const handleAdd = () => {
    setIsAddDialogOpen(true);
    resetForms();
  };

  const handleEdit = (item: Product | ProductPackage | Bundle) => {
    setSelectedItem(item);
    
    if ('components' in item) {
      // It's a package
      setPackageForm({
        name: item.name,
        price: item.price.toString(),
        outletId: item.outletId.toString(),
      });
      setPackageComponents(item.components.map(c => ({
        productId: c.productId.toString(),
        quantity: c.quantity.toString(),
      })));
    } else if ('items' in item) {
      // It's a bundle
      setBundleForm({
        name: item.name,
        price: item.price.toString(),
        outletId: item.outletId.toString(),
      });
      setBundleItems(item.items.map(i => ({
        productId: i.isPackage ? '' : i.productId.toString(),
        packageId: i.isPackage ? (i.packageId?.toString() || '') : '',
        quantity: i.quantity.toString(),
        isPackage: i.isPackage,
      })));
    } else {
      // It's a product
      setProductForm({
        name: item.name,
        price: item.price.toString(),
        stock: item.stock.toString(),
        outletId: item.outletId.toString(),
        categoryId: item.categoryId?.toString() || 'none',
        brandId: item.brandId?.toString() || 'none',
      });
    }
    setIsEditDialogOpen(true);
  };

  const handleDelete = (item: Product | ProductPackage | Bundle) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'products') {
      // Validasi kategori dan brand tidak boleh "none"
      if (productForm.categoryId === 'none') {
        alert('Silakan pilih kategori untuk produk');
        return;
      }
      if (productForm.brandId === 'none') {
        alert('Silakan pilih brand untuk produk');
        return;
      }

      addProduct.mutate(
        {
          name: productForm.name,
          price: BigInt(productForm.price),
          stock: BigInt(productForm.stock),
          outletId: productForm.outletId ? BigInt(productForm.outletId) : null,
          categoryId: productForm.categoryId !== 'none' ? BigInt(productForm.categoryId) : null,
          brandId: productForm.brandId !== 'none' ? BigInt(productForm.brandId) : null,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false);
            resetForms();
          },
        }
      );
    } else if (activeTab === 'packages') {
      const validComponents = packageComponents.filter(c => c.productId && c.quantity);
      if (validComponents.length === 0) return;

      const components: PackageComponent[] = validComponents.map(c => ({
        productId: BigInt(c.productId),
        quantity: BigInt(c.quantity),
      }));

      createPackage.mutate(
        {
          name: packageForm.name,
          price: BigInt(packageForm.price),
          outletId: BigInt(packageForm.outletId),
          components,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false);
            resetForms();
          },
        }
      );
    } else if (activeTab === 'bundles') {
      const validItems = bundleItems.filter(i => (i.isPackage ? i.packageId : i.productId) && i.quantity);
      if (validItems.length === 0) return;

      const items: BundleItem[] = validItems.map(i => ({
        productId: i.isPackage ? BigInt(0) : BigInt(i.productId),
        packageId: i.isPackage ? BigInt(i.packageId) : null,
        quantity: BigInt(i.quantity),
        isPackage: i.isPackage,
      }));

      createBundle.mutate(
        {
          name: bundleForm.name,
          price: BigInt(bundleForm.price),
          outletId: BigInt(bundleForm.outletId),
          items,
        },
        {
          onSuccess: () => {
            setIsAddDialogOpen(false);
            resetForms();
          },
        }
      );
    }
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    if ('components' in selectedItem) {
      // Package
      const validComponents = packageComponents.filter(c => c.productId && c.quantity);
      if (validComponents.length === 0) return;

      const components: PackageComponent[] = validComponents.map(c => ({
        productId: BigInt(c.productId),
        quantity: BigInt(c.quantity),
      }));

      updatePackage.mutate(
        {
          id: selectedItem.id,
          name: packageForm.name,
          price: BigInt(packageForm.price),
          components,
        },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            resetForms();
          },
        }
      );
    } else if ('items' in selectedItem) {
      // Bundle
      const validItems = bundleItems.filter(i => (i.isPackage ? i.packageId : i.productId) && i.quantity);
      if (validItems.length === 0) return;

      const items: BundleItem[] = validItems.map(i => ({
        productId: i.isPackage ? BigInt(0) : BigInt(i.productId),
        packageId: i.isPackage ? BigInt(i.packageId) : null,
        quantity: BigInt(i.quantity),
        isPackage: i.isPackage,
      }));

      updateBundle.mutate(
        {
          id: selectedItem.id,
          name: bundleForm.name,
          price: BigInt(bundleForm.price),
          items,
        },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            resetForms();
          },
        }
      );
    } else {
      // Product - Validasi kategori dan brand tidak boleh "none"
      if (productForm.categoryId === 'none') {
        alert('Silakan pilih kategori untuk produk');
        return;
      }
      if (productForm.brandId === 'none') {
        alert('Silakan pilih brand untuk produk');
        return;
      }

      updateProduct.mutate(
        {
          id: selectedItem.id,
          name: productForm.name,
          price: BigInt(productForm.price),
          stock: BigInt(productForm.stock),
          outletId: productForm.outletId ? BigInt(productForm.outletId) : null,
          categoryId: productForm.categoryId !== 'none' ? BigInt(productForm.categoryId) : null,
          brandId: productForm.brandId !== 'none' ? BigInt(productForm.brandId) : null,
        },
        {
          onSuccess: () => {
            setIsEditDialogOpen(false);
            setSelectedItem(null);
            resetForms();
          },
        }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!selectedItem) return;

    if ('components' in selectedItem) {
      markPackageInactive.mutate(selectedItem.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedItem(null);
        },
      });
    } else if ('items' in selectedItem) {
      markBundleInactive.mutate(selectedItem.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedItem(null);
        },
      });
    } else {
      deleteProduct.mutate(selectedItem.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedItem(null);
        },
      });
    }
  };

  const formatCurrency = (amount: bigint) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getOutletName = (outletId: bigint) => {
    const outlet = outlets?.find(o => o.id === outletId);
    return outlet?.name || `Outlet #${outletId}`;
  };

  const getCategoryName = (categoryId?: bigint) => {
    if (!categoryId) return '-';
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || '-';
  };

  const getBrandName = (brandId?: bigint) => {
    if (!brandId) return '-';
    const brand = brands?.find(b => b.id === brandId);
    return brand?.name || '-';
  };

  const getProductName = (productId: bigint) => {
    const product = products?.find(p => p.id === productId);
    return product?.name || `Produk #${productId}`;
  };

  const getPackageName = (packageId: bigint) => {
    const pkg = packages?.find(p => p.id === packageId);
    return pkg?.name || `Paket #${packageId}`;
  };

  const getAvailableProducts = (currentOutletId: string) => {
    if (!products) return [];
    const outletIdBigInt = BigInt(currentOutletId);
    return products.filter(p => p.outletId === outletIdBigInt && !p.isDeleted);
  };

  const getAvailablePackages = (currentOutletId: string) => {
    if (!packages) return [];
    const outletIdBigInt = BigInt(currentOutletId);
    return packages.filter(p => p.outletId === outletIdBigInt && p.isActive);
  };

  const addPackageComponent = () => {
    setPackageComponents([...packageComponents, { productId: '', quantity: '1' }]);
  };

  const removePackageComponent = (index: number) => {
    if (packageComponents.length > 1) {
      setPackageComponents(packageComponents.filter((_, i) => i !== index));
    }
  };

  const updatePackageComponent = (index: number, field: 'productId' | 'quantity', value: string) => {
    const newComponents = [...packageComponents];
    newComponents[index][field] = value;
    setPackageComponents(newComponents);
  };

  const addBundleItem = () => {
    setBundleItems([...bundleItems, { productId: '', packageId: '', quantity: '1', isPackage: false }]);
  };

  const removeBundleItem = (index: number) => {
    if (bundleItems.length > 1) {
      setBundleItems(bundleItems.filter((_, i) => i !== index));
    }
  };

  const updateBundleItem = (index: number, field: keyof BundleItemInput, value: string | boolean) => {
    const newItems = [...bundleItems];
    if (field === 'isPackage') {
      newItems[index][field] = value as boolean;
      // Reset IDs when switching type
      newItems[index].productId = '';
      newItems[index].packageId = '';
    } else {
      newItems[index][field] = value as string;
    }
    setBundleItems(newItems);
  };

  const isLoading = productsLoading || packagesLoading || bundlesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Produk</h1>
          <p className="text-muted-foreground">
            {isOwner ? 'Kelola produk satuan, paket, dan bundle di semua outlet' : 'Lihat daftar produk di outlet Anda'}
          </p>
        </div>
        {isOwner && (
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah {activeTab === 'products' ? 'Produk' : activeTab === 'packages' ? 'Paket' : 'Bundle'}
          </Button>
        )}
      </div>

      {!isOwner && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Anda memiliki akses hanya-baca. Hanya owner yang dapat menambah, mengubah, atau menghapus item.
          </AlertDescription>
        </Alert>
      )}

      <Alert>
        <Package className="h-4 w-4" />
        <AlertDescription>
          Stok paket dan bundle dihitung otomatis berdasarkan ketersediaan komponen. Perubahan stok produk satuan akan mempengaruhi ketersediaan paket dan bundle secara real-time.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products">
            <Package className="mr-2 h-4 w-4" />
            Produk Satuan
          </TabsTrigger>
          <TabsTrigger value="packages">
            <PackagePlus className="mr-2 h-4 w-4" />
            Paket
          </TabsTrigger>
          <TabsTrigger value="bundles">
            <Layers className="mr-2 h-4 w-4" />
            Bundle
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Produk Satuan</CardTitle>
              <CardDescription>
                Produk individual yang dapat dijual secara terpisah atau sebagai komponen paket/bundle
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
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada produk</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isOwner ? 'Mulai dengan menambahkan produk pertama Anda' : 'Belum ada produk yang tersedia'}
                  </p>
                  {isOwner && (
                    <Button onClick={handleAdd} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Produk
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Produk</TableHead>
                        {isOwner && <TableHead>Outlet</TableHead>}
                        <TableHead>Kategori</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Harga</TableHead>
                        <TableHead>Stok</TableHead>
                        {isOwner && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id.toString()}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          {isOwner && <TableCell>{getOutletName(product.outletId)}</TableCell>}
                          <TableCell>
                            <Badge variant="outline">{getCategoryName(product.categoryId)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getBrandName(product.brandId)}</Badge>
                          </TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                product.stock === BigInt(0)
                                  ? 'bg-destructive/10 text-destructive'
                                  : product.stock < BigInt(10)
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                              }`}
                            >
                              {product.stock.toString()}
                            </span>
                          </TableCell>
                          {isOwner && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(product)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(product)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Paket</CardTitle>
              <CardDescription>
                Paket berisi beberapa produk satuan dengan harga bundling
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
                  <PackagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada paket</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isOwner ? 'Buat paket untuk menjual beberapa produk sekaligus' : 'Belum ada paket yang tersedia'}
                  </p>
                  {isOwner && (
                    <Button onClick={handleAdd} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Paket
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Paket</TableHead>
                        {isOwner && <TableHead>Outlet</TableHead>}
                        <TableHead>Harga</TableHead>
                        <TableHead>Komponen</TableHead>
                        <TableHead>Stok Tersedia</TableHead>
                        {isOwner && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {packagesWithStock.map((pkg) => (
                        <TableRow key={pkg.id.toString()}>
                          <TableCell className="font-medium">{pkg.name}</TableCell>
                          {isOwner && <TableCell>{getOutletName(pkg.outletId)}</TableCell>}
                          <TableCell>{formatCurrency(pkg.price)}</TableCell>
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
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
                          {isOwner && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(pkg)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(pkg)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
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

        {/* Bundles Tab */}
        <TabsContent value="bundles">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Bundle</CardTitle>
              <CardDescription>
                Bundle dapat berisi kombinasi produk satuan dan paket
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !bundlesWithStock || bundlesWithStock.length === 0 ? (
                <div className="text-center py-12">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada bundle</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isOwner ? 'Buat bundle untuk menggabungkan produk dan paket' : 'Belum ada bundle yang tersedia'}
                  </p>
                  {isOwner && (
                    <Button onClick={handleAdd} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Bundle
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Bundle</TableHead>
                        {isOwner && <TableHead>Outlet</TableHead>}
                        <TableHead>Harga</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Stok Tersedia</TableHead>
                        {isOwner && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bundlesWithStock.map((bundle) => (
                        <TableRow key={bundle.id.toString()}>
                          <TableCell className="font-medium">{bundle.name}</TableCell>
                          {isOwner && <TableCell>{getOutletName(bundle.outletId)}</TableCell>}
                          <TableCell>{formatCurrency(bundle.price)}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {bundle.items.map((item, idx) => {
                                if (item.isPackage && item.packageId) {
                                  const pkg = packages?.find(p => p.id === item.packageId);
                                  return (
                                    <div key={idx} className="text-sm">
                                      <Badge variant="secondary" className="mr-1">Paket</Badge>
                                      {getPackageName(item.packageId)} × {item.quantity.toString()}
                                      {pkg && (
                                        <span className="text-muted-foreground ml-2">
                                          (Stok: {calculatePackageStock(pkg, products).toString()})
                                        </span>
                                      )}
                                    </div>
                                  );
                                } else {
                                  const product = products?.find(p => p.id === item.productId);
                                  return (
                                    <div key={idx} className="text-sm">
                                      <Badge variant="outline" className="mr-1">Produk</Badge>
                                      {getProductName(item.productId)} × {item.quantity.toString()}
                                      {product && (
                                        <span className="text-muted-foreground ml-2">
                                          (Stok: {product.stock.toString()})
                                        </span>
                                      )}
                                    </div>
                                  );
                                }
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                bundle.stock === BigInt(0)
                                  ? 'bg-destructive/10 text-destructive'
                                  : bundle.stock < BigInt(5)
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
                              }`}
                            >
                              {bundle.stock.toString()} bundle
                            </span>
                          </TableCell>
                          {isOwner && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(bundle)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(bundle)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
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
      </Tabs>

      {/* Add Dialog */}
      {isOwner && (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Tambah {activeTab === 'products' ? 'Produk' : activeTab === 'packages' ? 'Paket' : 'Bundle'} Baru
              </DialogTitle>
              <DialogDescription>
                {activeTab === 'products' && 'Masukkan informasi produk yang akan ditambahkan'}
                {activeTab === 'packages' && 'Buat paket produk dengan beberapa komponen'}
                {activeTab === 'bundles' && 'Buat bundle dengan kombinasi produk dan paket'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitAdd}>
              <div className="space-y-4 py-4">
                {activeTab === 'products' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-name">Nama Produk</Label>
                        <Input
                          id="add-name"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          placeholder="Contoh: Kopi Susu Gula Aren"
                          required
                        />
                      </div>
                      {outlets && outlets.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="add-outlet">Outlet</Label>
                          <Select value={productForm.outletId} onValueChange={(value) => setProductForm({ ...productForm, outletId: value })} required>
                            <SelectTrigger id="add-outlet">
                              <SelectValue placeholder="Pilih outlet" />
                            </SelectTrigger>
                            <SelectContent>
                              {outlets.map((outlet) => (
                                <SelectItem key={outlet.id.toString()} value={outlet.id.toString()}>
                                  {outlet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-category">Kategori</Label>
                        <Select value={productForm.categoryId} onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}>
                          <SelectTrigger id="add-category">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Kategori</SelectItem>
                            {categories && categories.filter(c => c.isActive).map((category) => (
                              <SelectItem key={category.id.toString()} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-brand">Brand</Label>
                        <Select value={productForm.brandId} onValueChange={(value) => setProductForm({ ...productForm, brandId: value })}>
                          <SelectTrigger id="add-brand">
                            <SelectValue placeholder="Pilih Brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Brand</SelectItem>
                            {brands && brands.filter(b => b.isActive).map((brand) => (
                              <SelectItem key={brand.id.toString()} value={brand.id.toString()}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-price">Harga (Rp)</Label>
                        <Input
                          id="add-price"
                          type="number"
                          min="0"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="add-stock">Stok</Label>
                        <Input
                          id="add-stock"
                          type="number"
                          min="0"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'packages' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-pkg-name">Nama Paket</Label>
                        <Input
                          id="add-pkg-name"
                          value={packageForm.name}
                          onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                          placeholder="Contoh: Paket Hemat"
                          required
                        />
                      </div>
                      {outlets && outlets.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="add-pkg-outlet">Outlet</Label>
                          <Select 
                            value={packageForm.outletId} 
                            onValueChange={(value) => {
                              setPackageForm({ ...packageForm, outletId: value });
                              setPackageComponents([{ productId: '', quantity: '1' }]);
                            }}
                            required
                          >
                            <SelectTrigger id="add-pkg-outlet">
                              <SelectValue placeholder="Pilih outlet" />
                            </SelectTrigger>
                            <SelectContent>
                              {outlets.map((outlet) => (
                                <SelectItem key={outlet.id.toString()} value={outlet.id.toString()}>
                                  {outlet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-pkg-price">Harga Paket (Rp)</Label>
                      <Input
                        id="add-pkg-price"
                        type="number"
                        min="0"
                        value={packageForm.price}
                        onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Komponen Paket</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPackageComponent}>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah Komponen
                        </Button>
                      </div>
                      {packageComponents.map((comp, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-2">
                            <Label>Produk</Label>
                            <Select
                              value={comp.productId}
                              onValueChange={(value) => updatePackageComponent(index, 'productId', value)}
                              disabled={!packageForm.outletId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={packageForm.outletId ? "Pilih produk" : "Pilih outlet dulu"} />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableProducts(packageForm.outletId).map((product) => (
                                  <SelectItem key={product.id.toString()} value={product.id.toString()}>
                                    {product.name} (Stok: {product.stock.toString()})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32 space-y-2">
                            <Label>Jumlah</Label>
                            <Input
                              type="number"
                              min="1"
                              value={comp.quantity}
                              onChange={(e) => updatePackageComponent(index, 'quantity', e.target.value)}
                            />
                          </div>
                          {packageComponents.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePackageComponent(index)}
                            >
                              <Minus className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeTab === 'bundles' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="add-bundle-name">Nama Bundle</Label>
                        <Input
                          id="add-bundle-name"
                          value={bundleForm.name}
                          onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                          placeholder="Contoh: Bundle Spesial"
                          required
                        />
                      </div>
                      {outlets && outlets.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="add-bundle-outlet">Outlet</Label>
                          <Select 
                            value={bundleForm.outletId} 
                            onValueChange={(value) => {
                              setBundleForm({ ...bundleForm, outletId: value });
                              setBundleItems([{ productId: '', packageId: '', quantity: '1', isPackage: false }]);
                            }}
                            required
                          >
                            <SelectTrigger id="add-bundle-outlet">
                              <SelectValue placeholder="Pilih outlet" />
                            </SelectTrigger>
                            <SelectContent>
                              {outlets.map((outlet) => (
                                <SelectItem key={outlet.id.toString()} value={outlet.id.toString()}>
                                  {outlet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-bundle-price">Harga Bundle (Rp)</Label>
                      <Input
                        id="add-bundle-price"
                        type="number"
                        min="0"
                        value={bundleForm.price}
                        onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Item Bundle</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addBundleItem}>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah Item
                        </Button>
                      </div>
                      {bundleItems.map((item, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`bundle-item-${index}-isPackage`}
                              checked={item.isPackage}
                              onCheckedChange={(checked) => updateBundleItem(index, 'isPackage', checked as boolean)}
                            />
                            <Label htmlFor={`bundle-item-${index}-isPackage`}>Gunakan Paket</Label>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                              <Label>{item.isPackage ? 'Paket' : 'Produk'}</Label>
                              <Select
                                value={item.isPackage ? item.packageId : item.productId}
                                onValueChange={(value) => updateBundleItem(index, item.isPackage ? 'packageId' : 'productId', value)}
                                disabled={!bundleForm.outletId}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={bundleForm.outletId ? `Pilih ${item.isPackage ? 'paket' : 'produk'}` : "Pilih outlet dulu"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.isPackage 
                                    ? getAvailablePackages(bundleForm.outletId).map((pkg) => (
                                        <SelectItem key={pkg.id.toString()} value={pkg.id.toString()}>
                                          {pkg.name}
                                        </SelectItem>
                                      ))
                                    : getAvailableProducts(bundleForm.outletId).map((product) => (
                                        <SelectItem key={product.id.toString()} value={product.id.toString()}>
                                          {product.name} (Stok: {product.stock.toString()})
                                        </SelectItem>
                                      ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32 space-y-2">
                              <Label>Jumlah</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateBundleItem(index, 'quantity', e.target.value)}
                              />
                            </div>
                            {bundleItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeBundleItem(index)}
                              >
                                <Minus className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    activeTab === 'products' ? addProduct.isPending :
                    activeTab === 'packages' ? createPackage.isPending :
                    createBundle.isPending
                  }
                >
                  {(activeTab === 'products' ? addProduct.isPending :
                    activeTab === 'packages' ? createPackage.isPending :
                    createBundle.isPending) ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Dialog - Similar structure to Add Dialog */}
      {isOwner && selectedItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit {'components' in selectedItem ? 'Paket' : 'items' in selectedItem ? 'Bundle' : 'Produk'}
              </DialogTitle>
              <DialogDescription>Perbarui informasi item</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitEdit}>
              <div className="space-y-4 py-4">
                {!('components' in selectedItem) && !('items' in selectedItem) && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">Nama Produk</Label>
                        <Input
                          id="edit-name"
                          value={productForm.name}
                          onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                          required
                        />
                      </div>
                      {outlets && outlets.length > 0 && (
                        <div className="space-y-2">
                          <Label htmlFor="edit-outlet">Outlet</Label>
                          <Select value={productForm.outletId} onValueChange={(value) => setProductForm({ ...productForm, outletId: value })}>
                            <SelectTrigger id="edit-outlet">
                              <SelectValue placeholder="Pilih outlet" />
                            </SelectTrigger>
                            <SelectContent>
                              {outlets.map((outlet) => (
                                <SelectItem key={outlet.id.toString()} value={outlet.id.toString()}>
                                  {outlet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-category">Kategori</Label>
                        <Select value={productForm.categoryId} onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}>
                          <SelectTrigger id="edit-category">
                            <SelectValue placeholder="Pilih Kategori" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Kategori</SelectItem>
                            {categories && categories.filter(c => c.isActive).map((category) => (
                              <SelectItem key={category.id.toString()} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-brand">Brand</Label>
                        <Select value={productForm.brandId} onValueChange={(value) => setProductForm({ ...productForm, brandId: value })}>
                          <SelectTrigger id="edit-brand">
                            <SelectValue placeholder="Pilih Brand" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Pilih Brand</SelectItem>
                            {brands && brands.filter(b => b.isActive).map((brand) => (
                              <SelectItem key={brand.id.toString()} value={brand.id.toString()}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-price">Harga (Rp)</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          min="0"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-stock">Stok</Label>
                        <Input
                          id="edit-stock"
                          type="number"
                          min="0"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {'components' in selectedItem && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-pkg-name">Nama Paket</Label>
                        <Input
                          id="edit-pkg-name"
                          value={packageForm.name}
                          onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Outlet</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {getOutletName(BigInt(packageForm.outletId))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-pkg-price">Harga Paket (Rp)</Label>
                      <Input
                        id="edit-pkg-price"
                        type="number"
                        min="0"
                        value={packageForm.price}
                        onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Komponen Paket</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPackageComponent}>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah Komponen
                        </Button>
                      </div>
                      {packageComponents.map((comp, index) => (
                        <div key={index} className="flex gap-2 items-end">
                          <div className="flex-1 space-y-2">
                            <Label>Produk</Label>
                            <Select
                              value={comp.productId}
                              onValueChange={(value) => updatePackageComponent(index, 'productId', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih produk" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableProducts(packageForm.outletId).map((product) => (
                                  <SelectItem key={product.id.toString()} value={product.id.toString()}>
                                    {product.name} (Stok: {product.stock.toString()})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32 space-y-2">
                            <Label>Jumlah</Label>
                            <Input
                              type="number"
                              min="1"
                              value={comp.quantity}
                              onChange={(e) => updatePackageComponent(index, 'quantity', e.target.value)}
                            />
                          </div>
                          {packageComponents.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePackageComponent(index)}
                            >
                              <Minus className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {'items' in selectedItem && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-bundle-name">Nama Bundle</Label>
                        <Input
                          id="edit-bundle-name"
                          value={bundleForm.name}
                          onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Outlet</Label>
                        <div className="p-3 bg-muted rounded-md">
                          {getOutletName(BigInt(bundleForm.outletId))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-bundle-price">Harga Bundle (Rp)</Label>
                      <Input
                        id="edit-bundle-price"
                        type="number"
                        min="0"
                        value={bundleForm.price}
                        onChange={(e) => setBundleForm({ ...bundleForm, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Item Bundle</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addBundleItem}>
                          <Plus className="h-4 w-4 mr-1" />
                          Tambah Item
                        </Button>
                      </div>
                      {bundleItems.map((item, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`edit-bundle-item-${index}-isPackage`}
                              checked={item.isPackage}
                              onCheckedChange={(checked) => updateBundleItem(index, 'isPackage', checked as boolean)}
                            />
                            <Label htmlFor={`edit-bundle-item-${index}-isPackage`}>Gunakan Paket</Label>
                          </div>
                          <div className="flex gap-2 items-end">
                            <div className="flex-1 space-y-2">
                              <Label>{item.isPackage ? 'Paket' : 'Produk'}</Label>
                              <Select
                                value={item.isPackage ? item.packageId : item.productId}
                                onValueChange={(value) => updateBundleItem(index, item.isPackage ? 'packageId' : 'productId', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder={`Pilih ${item.isPackage ? 'paket' : 'produk'}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {item.isPackage 
                                    ? getAvailablePackages(bundleForm.outletId).map((pkg) => (
                                        <SelectItem key={pkg.id.toString()} value={pkg.id.toString()}>
                                          {pkg.name}
                                        </SelectItem>
                                      ))
                                    : getAvailableProducts(bundleForm.outletId).map((product) => (
                                        <SelectItem key={product.id.toString()} value={product.id.toString()}>
                                          {product.name} (Stok: {product.stock.toString()})
                                        </SelectItem>
                                      ))
                                  }
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-32 space-y-2">
                              <Label>Jumlah</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateBundleItem(index, 'quantity', e.target.value)}
                              />
                            </div>
                            {bundleItems.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeBundleItem(index)}
                              >
                                <Minus className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    'components' in selectedItem ? updatePackage.isPending :
                    'items' in selectedItem ? updateBundle.isPending :
                    updateProduct.isPending
                  }
                >
                  {('components' in selectedItem ? updatePackage.isPending :
                    'items' in selectedItem ? updateBundle.isPending :
                    updateProduct.isPending) ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {isOwner && selectedItem && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {'components' in selectedItem ? 'Nonaktifkan Paket' : 'items' in selectedItem ? 'Nonaktifkan Bundle' : 'Hapus Produk'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin {('components' in selectedItem || 'items' in selectedItem) ? 'menonaktifkan' : 'menghapus'} "{selectedItem.name}"? 
                {('components' in selectedItem || 'items' in selectedItem) 
                  ? ' Item ini tidak akan muncul lagi dalam daftar aktif.' 
                  : ' Tindakan ini tidak dapat dibatalkan.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {('components' in selectedItem ? markPackageInactive.isPending :
                  'items' in selectedItem ? markBundleInactive.isPending :
                  deleteProduct.isPending) 
                  ? ('components' in selectedItem || 'items' in selectedItem ? 'Menonaktifkan...' : 'Menghapus...') 
                  : ('components' in selectedItem || 'items' in selectedItem ? 'Nonaktifkan' : 'Hapus')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
