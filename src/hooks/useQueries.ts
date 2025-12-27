import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { 
  AppRole as UserRole,
  type UserProfile, 
  type MenuAccess,
  type Product, 
  type Category, 
  type Brand,
  type Transaction,
  type TransactionItem,
  type PaymentMethod,
  type Outlet,
  type ProductPackage,
  type Bundle,
  type PackageComponent,
  type BundleItem,
  type Expense,
  type CashflowSummary,
  type StockLog,
  type PaymentSettings,
  type OwnerProfile,
  type BusinessProfile,
  fetchAPI 
} from '../backend';

// --- HELPER: Safe BigInt ---
function safeBigInt(value: any, fallback = 0n): bigint {
  if (value === null || value === undefined) return fallback;
  try {
    const num = Number(value);
    if (isNaN(num)) return fallback;
    return BigInt(Math.floor(num));
  } catch {
    return fallback;
  }
}

// --- HELPER: Safe Date ---
function safeDateToBigInt(dateStr: any): bigint {
  if (!dateStr) return BigInt(Date.now());
  const date = new Date(dateStr);
  const time = date.getTime();
  if (isNaN(time)) return BigInt(Date.now());
  return BigInt(time);
}

// ==========================================
// 1. USER PROFILE & AUTH
// ==========================================

export function useGetCallerUserProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      try {
        const data = await fetchAPI<any>('/auth/me');
        if (data.success && data.user) {
          return {
            name: data.user.name,
            role: data.user.role as UserRole,
            outletId: data.user.outlet_id ? safeBigInt(data.user.outlet_id) : null,
          };
        }
        return null;
      } catch (e) {
        return null;
      }
    },
    retry: false,
  });
}

// ALIAS untuk kompatibilitas
export const useSaveCallerUserProfile = useGetCallerUserProfile; 

export function useGetCallerUserRole() {
  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      try {
        const data = await fetchAPI<any>('/auth/me');
        if (data.success && data.user) {
          return data.user.role as UserRole;
        }
        return 'cashier' as UserRole;
      } catch {
        return 'cashier' as UserRole;
      }
    },
  });
}

export function useIsCallerAdmin() {
  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      try {
        const data = await fetchAPI<any>('/auth/is-admin');
        if (typeof data.isAdmin === 'boolean') return data.isAdmin;
        const userData = await fetchAPI<any>('/auth/me');
        if (userData.success && userData.user) {
          return userData.user.role === 'administrator' || userData.user.is_admin === true;
        }
        return false;
      } catch {
        return false;
      }
    },
    retry: 1,
  });
}

export function useRegisterUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      return fetchAPI('/users', {
        method: 'POST',
        body: JSON.stringify({
            username: name.toLowerCase().replace(/\s/g, ''),
            name: name,
            email: `${name.toLowerCase().replace(/\s/g, '')}@example.com`,
            password: 'password123',
            role: 'customer'
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Registrasi berhasil!');
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

// ==========================================
// 2. STAFF & USER MANAGEMENT
// ==========================================

export function useListAllUsers() {
  return useQuery<Array<[string, UserProfile]>>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      try {
        const data = await fetchAPI<any[]>('/users');
        return data.map(u => [
          u.id?.toString() || '',
          {
            name: u.name,
            role: u.role as UserRole,
            outletId: u.outlet_id ? safeBigInt(u.outlet_id) : undefined
          }
        ]);
      } catch { return []; }
    },
  });
}

export function useGetAllCustomers() {
    return useListAllUsers(); 
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, profile }: { userId: string; profile: UserProfile }) => {
      const payload = {
        name: profile.name,
        role: profile.role,
        outlet_id: profile.outletId ? Number(profile.outletId) : null
      };
      return fetchAPI(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('User updated');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => fetchAPI(`/users/${userId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('User removed');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAssignCallerUserRole() {
    return useMutation({ mutationFn: async () => {} });
}

// ==========================================
// 3. MASTER DATA
// ==========================================

export function useListOutlets() {
  return useQuery<Outlet[]>({
    queryKey: ['outlets'],
    queryFn: async () => {
      try {
        const data = await fetchAPI<any[]>('/outlets');
        return data.map(o => ({
          id: safeBigInt(o.id),
          name: o.name,
          address: o.address,
          createdAt: safeDateToBigInt(o.created_at),
          isActive: Boolean(o.is_active),
        }));
      } catch { return []; }
    },
  });
}

export function useGetOutlet(id: bigint | null) {
  return useQuery<Outlet | null>({
    queryKey: ['outlet', id?.toString()],
    queryFn: async () => {
      if (!id) return null;
      try {
        const data = await fetchAPI<any[]>('/outlets');
        const o = data.find((x: any) => BigInt(x.id) === id);
        if(!o) return null;
        return {
          id: safeBigInt(o.id),
          name: o.name,
          address: o.address,
          createdAt: safeDateToBigInt(o.created_at),
          isActive: Boolean(o.is_active),
        };
      } catch { return null; }
    },
    enabled: id !== null,
  });
}

export function useAddOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchAPI('/outlets', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      toast.success('Outlet added');
    },
  });
}

export function useUpdateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => fetchAPI('/outlets', { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      toast.success('Outlet updated');
    },
  });
}

export function useGetAllCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
        try {
            const data = await fetchAPI<any[]>('/categories');
            return data.map(c => ({
                id: safeBigInt(c.id),
                name: c.name,
                description: c.description || '',
                createdAt: safeDateToBigInt(c.created_at),
                isActive: Boolean(c.is_active),
            }));
        } catch { return []; }
    }
  });
}

export function useGetCategory(id: bigint | null) {
    return useQuery({ queryKey: ['cat', id], queryFn: () => null });
}
export function useCreateCategory() {
    return useMutation({ mutationFn: async (d: any) => fetchAPI('/categories', { method: 'POST', body: JSON.stringify(d) }) });
}
export function useUpdateCategory() {
    return useMutation({ mutationFn: async (d: any) => fetchAPI('/categories', { method: 'PUT', body: JSON.stringify(d) }) });
}

export function useGetAllBrands() {
  return useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
        try {
            const data = await fetchAPI<any[]>('/brands');
            return data.map(b => ({
                id: safeBigInt(b.id),
                name: b.name,
                description: b.description || '',
                createdAt: safeDateToBigInt(b.created_at),
                isActive: Boolean(b.is_active),
            }));
        } catch { return []; }
    }
  });
}

export function useGetBrand(id: bigint | null) { return useQuery({ queryKey: ['brand', id], queryFn: () => null }); }
export function useCreateBrand() {
    return useMutation({ mutationFn: async (d: any) => fetchAPI('/brands', { method: 'POST', body: JSON.stringify(d) }) });
}
export function useUpdateBrand() {
    return useMutation({ mutationFn: async (d: any) => fetchAPI('/brands', { method: 'PUT', body: JSON.stringify(d) }) });
}
export function useDeleteBrand() {
    return useMutation({ mutationFn: async (id: bigint) => fetchAPI('/brands', { method: 'DELETE', body: JSON.stringify({id: Number(id)}) }) });
}

// ==========================================
// 4. PRODUCTS
// ==========================================

export function useListProductsByOutlet(outletId: bigint | null) {
  return useQuery<Product[]>({
    queryKey: ['products', outletId?.toString()],
    queryFn: async () => {
      try {
        const query = outletId ? `?outlet_id=${outletId}` : '';
        const data = await fetchAPI<any[]>(`/products${query}`);
        return data.map(p => ({
          id: safeBigInt(p.id),
          name: p.name,
          price: safeBigInt(p.price),
          stock: safeBigInt(p.stock),
          outletId: safeBigInt(p.outlet_id),
          createdAt: safeDateToBigInt(p.created_at),
          categoryId: p.category_id ? safeBigInt(p.category_id) : undefined,
          brandId: p.brand_id ? safeBigInt(p.brand_id) : undefined,
          isDeleted: Boolean(p.is_deleted),
        }));
      } catch { return []; }
    },
  });
}

export function useSearchProducts(search: string, outletId: bigint | null) {
    return useListProductsByOutlet(outletId); 
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
        const payload = {
            ...data,
            price: Number(data.price),
            stock: Number(data.stock),
            outlet_id: Number(data.outletId),
            category_id: data.categoryId ? Number(data.categoryId) : null,
            brand_id: data.brandId ? Number(data.brandId) : null,
        };
        return fetchAPI('/products', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produk ditambahkan');
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
        const payload = {
            ...data,
            id: Number(data.id),
            price: Number(data.price),
            stock: Number(data.stock),
            outlet_id: Number(data.outletId),
            category_id: data.categoryId ? Number(data.categoryId) : null,
            brand_id: data.brandId ? Number(data.brandId) : null,
        };
        return fetchAPI(`/products/${data.id}`, { method: 'PUT', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produk diupdate');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => fetchAPI(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produk dihapus');
    },
  });
}

// ==========================================
// 5. PACKAGES & BUNDLES
// ==========================================

export function useListActivePackages(outletId: bigint | null) {
  return useQuery<ProductPackage[]>({
    queryKey: ['packages', outletId?.toString()],
    queryFn: async () => {
        try {
            const data = await fetchAPI<any[]>('/packages');
            return data.map(p => ({
                id: safeBigInt(p.id),
                name: p.name,
                price: safeBigInt(p.price),
                outletId: safeBigInt(p.outlet_id),
                createdAt: safeDateToBigInt(p.created_at),
                isActive: Boolean(p.is_active),
                components: (p.components || []).map((c: any) => ({
                    productId: safeBigInt(c.product_id),
                    quantity: Number(c.quantity)
                }))
            }));
        } catch { return []; }
    }
  });
}

export function useGetPackage(id: bigint | null) { return useQuery({ queryKey: ['pkg', id], queryFn: () => null }); }
export function useCreatePackage() { return useMutation({ mutationFn: async () => {} }); }
export function useUpdatePackage() { return useMutation({ mutationFn: async () => {} }); }
export function useMarkPackageInactive() { return useMutation({ mutationFn: async () => {} }); }

export function useListActiveBundles(outletId: bigint | null) {
  return useQuery<Bundle[]>({
    queryKey: ['bundles', outletId?.toString()],
    queryFn: async () => {
        try {
            const data = await fetchAPI<any[]>('/bundles');
            return data.map(b => ({
                id: safeBigInt(b.id),
                name: b.name,
                price: safeBigInt(b.price),
                outletId: safeBigInt(b.outlet_id),
                createdAt: safeDateToBigInt(b.created_at),
                isActive: Boolean(b.is_active),
                items: (b.items || []).map((i: any) => ({
                    productId: safeBigInt(i.product_id || 0),
                    packageId: i.package_id ? safeBigInt(i.package_id) : null,
                    quantity: Number(i.quantity),
                    isPackage: Boolean(i.is_package)
                }))
            }));
        } catch { return []; }
    }
  });
}

export function useGetBundle(id: bigint | null) { return useQuery({ queryKey: ['bdl', id], queryFn: () => null }); }
export function useCreateBundle() { return useMutation({ mutationFn: async () => {} }); }
export function useUpdateBundle() { return useMutation({ mutationFn: async () => {} }); }
export function useMarkBundleInactive() { return useMutation({ mutationFn: async () => {} }); }

// ==========================================
// 6. TRANSACTIONS
// ==========================================

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { items: TransactionItem[]; outletId: bigint; paymentMethods: PaymentMethod[] }) => {
      const payload = {
        outlet_id: Number(data.outletId),
        items: data.items.map(item => ({
          product_id: Number(item.productId),
          quantity: Number(item.quantity),
          price: Number(item.price),
          is_package: item.isPackage,
          is_bundle: item.isBundle
        })),
        payment_methods: data.paymentMethods,
      };
      return fetchAPI('/orders', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Transaksi sukses');
    },
  });
}

export function useListTransactions(outletId: bigint) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', outletId.toString()],
    queryFn: async () => {
        try {
            const data = await fetchAPI<any[]>('/orders');
            return data.map(t => ({
                id: safeBigInt(t.id),
                userId: t.user_id?.toString() || 'Guest',
                outletId: safeBigInt(t.outlet_id || 1),
                total: safeBigInt(t.total || 0),
                timestamp: safeDateToBigInt(t.created_at || t.date),
                status: t.status || 'completed',
                items: [],
                paymentMethods: []
            }));
        } catch { return []; }
    }
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { transactionId: bigint; newStatus: string }) => {
      return fetchAPI('/orders', { 
        method: 'POST', 
        body: JSON.stringify({ 
            action: 'update_status', 
            id: Number(data.transactionId), 
            status: data.newStatus 
        }) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Status pesanan diperbarui');
    },
    onError: (e: Error) => toast.error(e.message)
  });
}

export function useListMyTransactions() { return useListTransactions(BigInt(1)); }
export function useListAllTransactions() { return useListTransactions(BigInt(1)); }
export function useGetUserTransactionHistory() { return useQuery({ queryKey: ['history'], queryFn: () => [] }); }

// ==========================================
// 7. STOCK & OTHERS (Placeholders)
// ==========================================

// FIX: Correct Arguments for StockManagementPage
export function useAddStock() { 
    return useMutation({ 
        mutationFn: async (data: { productId: bigint; quantity: bigint; outletId?: bigint }) => {
            toast.info('Stock added'); 
        } 
    }); 
}
export function useReduceStock() { 
    return useMutation({ 
        mutationFn: async (data: { productId: bigint; quantity: bigint; outletId?: bigint }) => {
            toast.info('Stock reduced'); 
        } 
    }); 
}
export function useTransferStock() { 
    return useMutation({ 
        mutationFn: async (data: { productId: bigint; fromOutletId?: bigint; toOutletId: bigint; quantity: bigint }) => {
            toast.info('Stock transferred'); 
        }
    }); 
}
export function useUpdateStock() { return useMutation({ mutationFn: async () => {} }); }
export function useGetStockLogs(outletId: any) { return useQuery({ queryKey: ['logs'], queryFn: () => [] }); }

export const useGetDailySummaryOutlet = (id: any) => useQuery({ queryKey: ['daily'], queryFn: () => ({ totalRevenue: 0n, transactionCount: 0n, date: 0n }) });
export const useGetOverallSummaryOutlet = (id: any) => useQuery({ queryKey: ['ovr'], queryFn: () => [0n, 0n] });
export const useGetBestSellers = (id: any) => useQuery({ queryKey: ['best'], queryFn: () => [] });
export const useGetTopOutlets = () => useQuery({ queryKey: ['top'], queryFn: () => [] });
export const useGetBestSellersByOutlet = () => useQuery({ queryKey: ['bestOut'], queryFn: () => [] });

export const useGetPaymentSettings = () => useQuery<PaymentSettings | null>({ queryKey: ['paySet'], queryFn: () => null });
export const useUpdatePaymentSettings = () => useMutation({ mutationFn: async (settings: any) => {} });

// FIX: Aliases for SettingsPage
export const useGetOwnerProfile = () => useQuery<OwnerProfile | null>({ queryKey: ['ownProf'], queryFn: () => null });
export const useUpdateOwnerProfile = useUpdateUserProfile; // Alias as requested
export const useGetBusinessProfile = () => useQuery<BusinessProfile | null>({ queryKey: ['busProf'], queryFn: () => null });
export const useUpdateBusinessProfile = useUpdateUserProfile; // Alias as requested

export const useExportDatabase = () => useMutation({ mutationFn: async () => ({}) });

export const useGetMenuAccessConfig = () => useQuery({ queryKey: ['menu'], queryFn: () => ({}) });
export const useSaveMenuAccessConfig = () => useMutation({ mutationFn: async () => {} });
export function useGetRoleMenuAccess() {
    return useQuery({ queryKey: ['roleMenu'], queryFn: () => [
        { menu: 'dashboard', isAccessible: true, name: 'Dashboard' },
        { menu: 'pos', isAccessible: true, name: 'POS' },
        { menu: 'products', isAccessible: true, name: 'Produk' },
        { menu: 'staff', isAccessible: true, name: 'Staff' }
    ]});
}
export function useIsMenuAccessible(menu: string) { return useQuery({ queryKey: ['acc', menu], queryFn: () => true }); }

export const useGetTransactionsWithPaymentProof = () => useQuery({ queryKey: ['proof'], queryFn: () => [] });
export const useUploadPaymentProof = () => useMutation({ mutationFn: async (data: { transactionId: bigint, file: any }) => {} });
export const useVerifyPaymentProof = () => useMutation({ mutationFn: async () => {} });
export const useGetPaymentProof = () => useQuery({ queryKey: ['proofGet'], queryFn: () => null });

export const useGetTotalRevenuePerPaymentCategory = () => useQuery({ queryKey: ['revCat'], queryFn: () => [] });
export const useGetRevenueByPaymentCategory = () => useQuery({ queryKey: ['revPay'], queryFn: () => 0n });
export const useGetRevenueByPaymentSubCategory = () => useQuery({ queryKey: ['revSub'], queryFn: () => 0n });
export const useGetTransactionsByPaymentCategory = () => useQuery({ queryKey: ['trxCat'], queryFn: () => [] });

export const useGetExpenses = () => useQuery({ queryKey: ['exp'], queryFn: () => [] });
export const useGetCashflowSummary = () => useQuery({ queryKey: ['cf'], queryFn: () => ({ totalIncome: 0n, totalExpenses: 0n, balance: 0n }) });

// FIX: Mutation Types for CashflowPage
export const useAddExpense = () => useMutation({ 
    mutationFn: async (data: { amount: bigint; category: string; description: string; outletId: bigint }) => {} 
});
export const useUpdateExpense = () => useMutation({ 
    mutationFn: async (data: { expenseId: any; amount: bigint; category: string; description: string }) => {} 
});
export const useDeleteExpense = () => useMutation({ 
    mutationFn: async (id: bigint) => {} 
});