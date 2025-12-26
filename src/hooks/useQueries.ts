import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// --- IMPORTS: TYPES ---
import { 
  AppRole as UserRole, // Alias agar konsisten
  type UserProfile, 
  type ProductRequest, // Jika diperlukan nanti
  type MenuAccessConfig, 
  type MenuAccessInput, 
  type MenuAccess,
  type Product, 
  type Category, 
  type Brand, 
  // type ProductPackage, 
  // type PackageComponent, 
  // type Bundle, 
  // type BundleItem,
  type Transaction,
  type TransactionItem,
  type PaymentMethod,
  type Outlet,
  // type StockLog,
  // type DailySummary,
  // type GuestCustomerData
} from '../backend'; 

// --- KONFIGURASI API ---
const WP_API_URL = import.meta.env.VITE_WP_API_URL || 'https://erpos.tekrabyte.id/wp-json/posq/v1';

// --- HELPER: Fetcher dengan Auth Token ---
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('posq_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${WP_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  // Handle empty responses (like 204 No Content)
  if (response.status === 204) return {} as T;

  return response.json();
}

// ==========================================
// 1. USER PROFILE & AUTH
// ==========================================

export function useGetCallerUserProfile() {
  return useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      try {
        const data = await fetchAPI<any>('/profile');
        return {
          name: data.name,
          role: data.role as UserRole,
          outletId: data.outlet_id ? BigInt(data.outlet_id) : null,
        };
      } catch (e) {
        return null;
      }
    },
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: UserProfile) => {
      // Pastikan BigInt dikonversi ke string/number sebelum dikirim
      const payload = {
        ...profile,
        outletId: profile.outletId ? Number(profile.outletId) : null
      };
      return fetchAPI('/profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profil berhasil disimpan');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useIsCallerAdmin() {
  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      try {
        const data = await fetchAPI<any>('/profile');
        return data.role === 'owner' || (data.roles && data.roles.includes('administrator'));
      } catch {
        return false;
      }
    },
  });
}

export function useGetCallerUserRole() {
  return useQuery<UserRole>({
    queryKey: ['userRole'],
    queryFn: async () => {
      const data = await fetchAPI<any>('/profile');
      return data.role as UserRole;
    },
  });
}

// ==========================================
// 2. STAFF MANAGEMENT
// ==========================================

export function useListAllUsers() {
  return useQuery<Array<[string, UserProfile]>>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      const users = await fetchAPI<any[]>('/users');
      return users.map(u => [
        u.id.toString(),
        {
          name: u.name,
          role: u.role as UserRole,
          outletId: u.outlet_id ? BigInt(u.outlet_id) : null
        }
      ]);
    },
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, profile }: { userId: string; profile: UserProfile }) => {
      const payload = {
        ...profile,
        outletId: profile.outletId ? Number(profile.outletId) : null
      };
      return fetchAPI(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
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
  });
}

export function useAssignCallerUserRole() {
  return useMutation({
    mutationFn: async () => { throw new Error("Use admin panel to assign roles"); }
  });
}

// ==========================================
// 3. MENU ACCESS CONTROL
// ==========================================

export function useGetMenuAccessConfig() {
  return useQuery<MenuAccessConfig>({
    queryKey: ['menuAccessConfig'],
    queryFn: () => fetchAPI('/menu-access'),
  });
}

export function useGetRoleMenuAccess() {
  return useQuery<MenuAccess[]>({
    queryKey: ['roleMenuAccess'],
    queryFn: () => fetchAPI('/menu-access/my-role'),
  });
}

export function useSaveMenuAccessConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (config: MenuAccessInput) => fetchAPI('/menu-access', {
      method: 'POST',
      body: JSON.stringify(config),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuAccessConfig'] });
      toast.success('Menu access saved');
    },
  });
}

export function useIsMenuAccessible(menu: string) {
  return useQuery<boolean>({
    queryKey: ['menuAccessible', menu],
    queryFn: async () => {
      try {
        const res = await fetchAPI<{ accessible: boolean }>(`/menu-access/check?menu=${menu}`);
        return res.accessible;
      } catch {
        return false;
      }
    },
  });
}

// ==========================================
// 4. OUTLETS
// ==========================================

export function useListOutlets() {
  return useQuery<Outlet[]>({
    queryKey: ['outlets'],
    queryFn: async () => {
      const data = await fetchAPI<any[]>('/outlets');
      return data.map(o => ({
        id: BigInt(o.id),
        name: o.name,
        address: o.address,
        createdAt: BigInt(new Date(o.created_at).getTime()),
        isActive: Boolean(o.is_active),
      }));
    },
  });
}

export function useGetOutlet(id: bigint | null) {
  return useQuery<Outlet | null>({
    queryKey: ['outlet', id?.toString()],
    queryFn: async () => {
      if (!id) return null;
      const o = await fetchAPI<any>(`/outlets/${id}`);
      return {
        id: BigInt(o.id),
        name: o.name,
        address: o.address,
        createdAt: BigInt(new Date(o.created_at).getTime()),
        isActive: Boolean(o.is_active),
      };
    },
    enabled: id !== null,
  });
}

export function useAddOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; address: string }) => fetchAPI('/outlets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      toast.success('Outlet added');
    },
  });
}

export function useUpdateOutlet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: bigint; name: string; address: string; isActive: boolean }) => 
      fetchAPI(`/outlets/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, id: Number(data.id) }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
      toast.success('Outlet updated');
    },
  });
}

// ==========================================
// 5. MASTER DATA (CATEGORIES & BRANDS)
// ==========================================

export function useGetAllCategories() {
  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const data = await fetchAPI<any[]>('/categories');
      return data.map(c => ({
        id: BigInt(c.id),
        name: c.name,
        description: c.description || '',
        createdAt: BigInt(new Date(c.created_at).getTime()),
        isActive: Boolean(c.is_active),
      }));
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description: string }) => fetchAPI('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category added');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: bigint; name: string; description: string; isActive: boolean }) =>
      fetchAPI(`/categories/${data.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ ...data, id: Number(data.id) }) 
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] })
  });
}

export function useGetAllBrands() {
  return useQuery<Brand[]>({
    queryKey: ['brands'],
    queryFn: async () => {
      const data = await fetchAPI<any[]>('/brands');
      return data.map(b => ({
        id: BigInt(b.id),
        name: b.name,
        description: b.description || '',
        createdAt: BigInt(new Date(b.created_at).getTime()),
        isActive: Boolean(b.is_active),
      }));
    },
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description: string }) => fetchAPI('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast.success('Brand added');
    },
  });
}

// Placeholder for missing brand hooks
export function useUpdateBrand() {
  return useMutation({ mutationFn: async () => {} }); 
}
export function useDeleteBrand() {
  return useMutation({ mutationFn: async () => {} }); 
}

// ==========================================
// 6. PRODUCTS
// ==========================================

export function useListProductsByOutlet(outletId: bigint | null) {
  return useQuery<Product[]>({
    queryKey: ['products', outletId?.toString()],
    queryFn: async () => {
      const query = outletId ? `?outlet_id=${outletId}` : '';
      const data = await fetchAPI<any[]>(`/products${query}`);
      return data.map(p => ({
        id: BigInt(p.id),
        name: p.name,
        price: BigInt(p.price),
        stock: BigInt(p.stock),
        outletId: BigInt(p.outlet_id),
        createdAt: BigInt(new Date(p.created_at).getTime()),
        categoryId: p.category_id ? BigInt(p.category_id) : undefined,
        brandId: p.brand_id ? BigInt(p.brand_id) : undefined,
        isDeleted: Boolean(p.is_deleted),
      }));
    },
  });
}

export function useSearchProducts(search: string, outletId: bigint | null) {
  return useQuery<Product[]>({
    queryKey: ['products', 'search', search, outletId?.toString()],
    queryFn: async () => {
      const query = `?search=${search}` + (outletId ? `&outlet_id=${outletId}` : '');
      const data = await fetchAPI<any[]>(`/products/search${query}`);
      return data.map(p => ({
        id: BigInt(p.id),
        name: p.name,
        price: BigInt(p.price),
        stock: BigInt(p.stock),
        outletId: BigInt(p.outlet_id),
        createdAt: BigInt(new Date(p.created_at).getTime()),
        categoryId: p.category_id ? BigInt(p.category_id) : undefined,
        brandId: p.brand_id ? BigInt(p.brand_id) : undefined,
        isDeleted: Boolean(p.is_deleted),
      }));
    },
    enabled: search.length > 0,
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => {
      const payload = {
        ...data,
        price: Number(data.price),
        stock: Number(data.stock),
        outletId: Number(data.outletId),
        categoryId: data.categoryId ? Number(data.categoryId) : null,
        brandId: data.brandId ? Number(data.brandId) : null,
      };
      return fetchAPI('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added');
    },
    onError: (e: Error) => toast.error(e.message),
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
        outletId: Number(data.outletId),
      };
      return fetchAPI(`/products/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: bigint) => fetchAPI(`/products/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted');
    },
  });
}

// ==========================================
// 7. TRANSACTIONS
// ==========================================

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { items: TransactionItem[]; outletId: bigint; paymentMethods: PaymentMethod[] }) => {
      const payload = {
        outlet_id: Number(data.outletId),
        total: Number(data.items.reduce((acc, item) => acc + (item.price * BigInt(item.quantity)), 0n)),
        items: data.items.map(item => ({
          product_id: Number(item.productId),
          quantity: Number(item.quantity),
          price: Number(item.price),
          is_package: item.isPackage,
          is_bundle: item.isBundle
        })),
        payment_methods: data.paymentMethods
      };
      return fetchAPI('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // Stock changes
      toast.success('Transaction saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useListTransactions(outletId: bigint) {
  return useQuery<Transaction[]>({
    queryKey: ['transactions', outletId.toString()],
    queryFn: async () => {
      const data = await fetchAPI<any[]>(`/transactions?outlet_id=${outletId}`);
      return data.map(t => ({
        id: BigInt(t.id),
        userId: t.user_id.toString(),
        outletId: BigInt(t.outlet_id),
        total: BigInt(t.total),
        timestamp: BigInt(new Date(t.created_at).getTime()),
        status: t.status,
        items: [], // Detail items usually fetched separately or need eager load API
        paymentMethods: []
      }));
    },
  });
}

export function useGetUserTransactionHistory(userId?: string) {
  return useQuery<Transaction[]>({
    queryKey: ['userTrxHistory', userId],
    queryFn: async () => {
      if (!userId) return [];
      try {
        const data = await fetchAPI<any[]>(`/transactions/user/${userId}`);
        return data.map(t => ({
          id: BigInt(t.id),
          userId: t.user_id.toString(),
          outletId: BigInt(t.outlet_id),
          total: BigInt(t.total),
          timestamp: BigInt(new Date(t.created_at).getTime()),
          status: t.status,
          items: [],
          paymentMethods: []
        }));
      } catch (e) {
        return [];
      }
    },
    enabled: !!userId
  });
}

export function useListAllTransactions(outletId?: bigint) {
  return useQuery<Transaction[]>({
    queryKey: ['allTrx', outletId?.toString()],
    queryFn: async () => {
      const query = outletId ? `?outlet_id=${outletId}` : '';
      const data = await fetchAPI<any[]>(`/transactions/all${query}`);
      return data.map(t => ({
        id: BigInt(t.id),
        userId: t.user_id?.toString() || 'Guest',
        outletId: BigInt(t.outlet_id),
        total: BigInt(t.total),
        timestamp: BigInt(new Date(t.created_at).getTime()),
        status: t.status || 'completed',
        items: t.items || [],
        paymentMethods: t.payment_methods || []
      }));
    }
  });
}

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { transactionId: bigint; status: string }) => 
      fetchAPI(`/transactions/${data.transactionId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: data.status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['allTrx'] });
      toast.success('Status transaksi diperbarui');
    }
  });
}

// ==========================================
// 8. PAYMENT & CUSTOMERS
// ==========================================

export function useGetPaymentSettings() {
  return useQuery<any>({
    queryKey: ['paymentSettings'],
    queryFn: async () => {
      // Fetch from API or return static config
      return {
        enable_cash: true,
        enable_qris: true,
        enable_transfer: true
      };
    }
  });
}

export function useUploadPaymentProof() {
  return useMutation({
    mutationFn: async (file: File) => {
      // Implement file upload logic here (FormData)
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => toast.success('Bukti pembayaran diunggah'),
  });
}

export function useGetAllCustomers() {
  return useQuery<Array<[string, UserProfile]>>({
    queryKey: ['allCustomers'],
    queryFn: async () => {
      return []; // Placeholder
    },
  });
}

// ==========================================
// 9. STOCK MANAGEMENT
// ==========================================

export function useAddStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: bigint; quantity: bigint }) => fetchAPI('/stock/update', {
      method: 'POST',
      body: JSON.stringify({ 
        product_id: Number(data.productId), 
        quantity: Number(data.quantity), 
        operation: 'add' 
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock added');
    },
  });
}

export function useReduceStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { productId: bigint; quantity: bigint }) => fetchAPI('/stock/update', {
      method: 'POST',
      body: JSON.stringify({ 
        product_id: Number(data.productId), 
        quantity: Number(data.quantity), 
        operation: 'reduce' 
      }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock reduced');
    },
  });
}

// ==========================================
// 10. PLACEHOLDERS & FUTURE FEATURES
// ==========================================

const notImplemented = () => Promise.resolve([]);
const dummyMutation = () => ({ mutate: () => toast.info('Fitur belum tersedia'), isPending: false });

export const useListActivePackages = (id: any) => useQuery({ queryKey: ['pkg'], queryFn: notImplemented });
export const useGetPackage = (id: any) => useQuery({ queryKey: ['pkg', id], queryFn: () => null });
export const useCreatePackage = () => dummyMutation();
export const useUpdatePackage = () => dummyMutation();
export const useMarkPackageInactive = () => dummyMutation();

export const useListActiveBundles = (id: any) => useQuery({ queryKey: ['bdl'], queryFn: notImplemented });
export const useGetBundle = (id: any) => useQuery({ queryKey: ['bdl', id], queryFn: () => null });
export const useCreateBundle = () => dummyMutation();
export const useUpdateBundle = () => dummyMutation();
export const useMarkBundleInactive = () => dummyMutation();

export const useTransferStock = () => dummyMutation();
export const useGetStockLogs = (id: any) => useQuery({ queryKey: ['logs'], queryFn: notImplemented });

export const useListMyTransactions = () => useQuery({ queryKey: ['myTrx'], queryFn: notImplemented });

export const useGetDailySummaryOutlet = (id: any) => useQuery({ 
  queryKey: ['daily'], 
  queryFn: () => ({ totalRevenue: 0n, transactionCount: 0n, date: 0n }) 
});
export const useGetOverallSummaryOutlet = (id: any) => useQuery({ queryKey: ['ovr'], queryFn: () => [0n, 0n] });
export const useGetBestSellers = (id: any) => useQuery({ queryKey: ['best'], queryFn: notImplemented });
export const useGetTopOutlets = () => useQuery({ queryKey: ['top'], queryFn: notImplemented });
export const useGetBestSellersByOutlet = () => useQuery({ queryKey: ['bestOut'], queryFn: notImplemented });

export const useGetTotalRevenuePerPaymentCategory = () => useQuery({ queryKey: ['revCat'], queryFn: notImplemented });
export const useGetRevenueByPaymentCategory = () => useQuery({ queryKey: ['revPay'], queryFn: () => 0n });
export const useGetRevenueByPaymentSubCategory = () => useQuery({ queryKey: ['revSub'], queryFn: () => 0n });
export const useGetTransactionsByPaymentCategory = () => useQuery({ queryKey: ['trxCat'], queryFn: notImplemented });

export const useGetCategory = (id: any) => useQuery({ queryKey: ['cat', id], queryFn: () => null });
export const useGetBrand = (id: any) => useQuery({ queryKey: ['brand', id], queryFn: () => null });