import { useState } from 'react';
import { useGetAllCategories, useCreateCategory, useUpdateCategory, useGetAllBrands, useCreateBrand, useUpdateBrand, useDeleteBrand, useIsCallerAdmin } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Tag, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { Category, Brand } from '../types/backend';

export default function CategoryBrandPage() {
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: categories, isLoading: categoriesLoading } = useGetAllCategories();
  const { data: brands, isLoading: brandsLoading } = useGetAllBrands();
  
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const isOwner = isAdmin;

  // Category state
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Brand state
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [isEditingBrand, setIsEditingBrand] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [isDeleteBrandDialogOpen, setIsDeleteBrandDialogOpen] = useState(false);
  const [brandForm, setBrandForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', isActive: true });
    setSelectedCategory(null);
    setIsEditingCategory(false);
  };

  const resetBrandForm = () => {
    setBrandForm({ name: '', description: '', isActive: true });
    setSelectedBrand(null);
    setIsEditingBrand(false);
  };

  const handleAddCategory = () => {
    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description,
      isActive: category.isActive,
    });
    setIsEditingCategory(true);
    setIsCategoryDialogOpen(true);
  };

  const handleSubmitCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingCategory && selectedCategory) {
      updateCategory.mutate(
        {
          id: selectedCategory.id,
          name: categoryForm.name,
          description: categoryForm.description,
          isActive: categoryForm.isActive,
        },
        {
          onSuccess: () => {
            setIsCategoryDialogOpen(false);
            resetCategoryForm();
          },
        }
      );
    } else {
      createCategory.mutate(
        {
          name: categoryForm.name,
          description: categoryForm.description,
        },
        {
          onSuccess: () => {
            setIsCategoryDialogOpen(false);
            resetCategoryForm();
          },
        }
      );
    }
  };

  const handleAddBrand = () => {
    resetBrandForm();
    setIsBrandDialogOpen(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setBrandForm({
      name: brand.name,
      description: brand.description,
      isActive: brand.isActive,
    });
    setIsEditingBrand(true);
    setIsBrandDialogOpen(true);
  };

  const handleDeleteBrand = (brand: Brand) => {
    setSelectedBrand(brand);
    setIsDeleteBrandDialogOpen(true);
  };

  const handleConfirmDeleteBrand = () => {
    if (!selectedBrand) return;
    deleteBrand.mutate(selectedBrand.id, {
      onSuccess: () => {
        setIsDeleteBrandDialogOpen(false);
        setSelectedBrand(null);
      },
    });
  };

  const handleSubmitBrand = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingBrand && selectedBrand) {
      updateBrand.mutate(
        {
          id: selectedBrand.id,
          name: brandForm.name,
          description: brandForm.description,
          isActive: brandForm.isActive,
        },
        {
          onSuccess: () => {
            setIsBrandDialogOpen(false);
            resetBrandForm();
          },
        }
      );
    } else {
      createBrand.mutate(
        {
          name: brandForm.name,
          description: brandForm.description,
        },
        {
          onSuccess: () => {
            setIsBrandDialogOpen(false);
            resetBrandForm();
          },
        }
      );
    }
  };

  const isLoading = categoriesLoading || brandsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kategori & Brand</h1>
        <p className="text-muted-foreground">
          {isOwner ? 'Kelola kategori dan brand produk' : 'Lihat daftar kategori dan brand'}
        </p>
      </div>

      {!isOwner && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            Anda memiliki akses hanya-baca. Hanya owner yang dapat mengelola kategori dan brand.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="brands">Brand</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar Kategori</CardTitle>
                <CardDescription>Kategori produk yang tersedia</CardDescription>
              </div>
              {isOwner && (
                <Button onClick={handleAddCategory}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kategori
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !categories || categories.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada kategori</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isOwner ? 'Mulai dengan menambahkan kategori pertama' : 'Belum ada kategori yang tersedia'}
                  </p>
                  {isOwner && (
                    <Button onClick={handleAddCategory} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Kategori
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Status</TableHead>
                        {isOwner && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.id.toString()}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description}</TableCell>
                          <TableCell>
                            <Badge variant={category.isActive ? 'default' : 'secondary'}>
                              {category.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          {isOwner && (
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditCategory(category)}
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
        </TabsContent>

        <TabsContent value="brands">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Daftar Brand</CardTitle>
                <CardDescription>Brand produk yang tersedia</CardDescription>
              </div>
              {isOwner && (
                <Button onClick={handleAddBrand}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Brand
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !brands || brands.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-semibold">Belum ada brand</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {isOwner ? 'Mulai dengan menambahkan brand pertama' : 'Belum ada brand yang tersedia'}
                  </p>
                  {isOwner && (
                    <Button onClick={handleAddBrand} className="mt-4">
                      <Plus className="mr-2 h-4 w-4" />
                      Tambah Brand
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead>Status</TableHead>
                        {isOwner && <TableHead className="text-right">Aksi</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {brands.map((brand) => (
                        <TableRow key={brand.id.toString()}>
                          <TableCell className="font-medium">{brand.name}</TableCell>
                          <TableCell>{brand.description}</TableCell>
                          <TableCell>
                            <Badge variant={brand.isActive ? 'default' : 'secondary'}>
                              {brand.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                          </TableCell>
                          {isOwner && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditBrand(brand)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteBrand(brand)}
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

      {/* Category Dialog */}
      {isOwner && (
        <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}</DialogTitle>
              <DialogDescription>
                {isEditingCategory ? 'Perbarui informasi kategori' : 'Masukkan informasi kategori baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitCategory}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category-name">Nama Kategori</Label>
                  <Input
                    id="category-name"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="Contoh: Minuman"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category-description">Deskripsi</Label>
                  <Textarea
                    id="category-description"
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Deskripsi kategori"
                    rows={3}
                  />
                </div>
                {isEditingCategory && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="category-active"
                      checked={categoryForm.isActive}
                      onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, isActive: checked })}
                    />
                    <Label htmlFor="category-active">Aktif</Label>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCategoryDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}>
                  {createCategory.isPending || updateCategory.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Brand Dialog */}
      {isOwner && (
        <Dialog open={isBrandDialogOpen} onOpenChange={setIsBrandDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditingBrand ? 'Edit Brand' : 'Tambah Brand Baru'}</DialogTitle>
              <DialogDescription>
                {isEditingBrand ? 'Perbarui informasi brand' : 'Masukkan informasi brand baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmitBrand}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Nama Brand</Label>
                  <Input
                    id="brand-name"
                    value={brandForm.name}
                    onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                    placeholder="Contoh: Kapal Api"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand-description">Deskripsi</Label>
                  <Textarea
                    id="brand-description"
                    value={brandForm.description}
                    onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                    placeholder="Deskripsi brand"
                    rows={3}
                  />
                </div>
                {isEditingBrand && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="brand-active"
                      checked={brandForm.isActive}
                      onCheckedChange={(checked) => setBrandForm({ ...brandForm, isActive: checked })}
                    />
                    <Label htmlFor="brand-active">Aktif</Label>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsBrandDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={createBrand.isPending || updateBrand.isPending}>
                  {createBrand.isPending || updateBrand.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Brand Dialog */}
      {isOwner && (
        <AlertDialog open={isDeleteBrandDialogOpen} onOpenChange={setIsDeleteBrandDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Brand</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus brand "{selectedBrand?.name}"? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDeleteBrand}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteBrand.isPending ? 'Menghapus...' : 'Hapus'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
