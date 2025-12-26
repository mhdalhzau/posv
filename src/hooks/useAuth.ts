import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserProfile } from '../backend';

const WP_API_URL =
  import.meta.env.VITE_WP_API_URL ||
  'https://erpos.tekrabyte.id/wp-json/posq/v1';

/* ======================================================
 * FETCH HELPER - IMPROVED VERSION
 * ==================================================== */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('posq_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // ✅ FIX: Token dikirim dengan format yang benar
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    // Juga tambah X-Posq-Token sebagai fallback
    headers['X-Posq-Token'] = token;
  }

  const response = await fetch(`${WP_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Token invalid / expired
  if (response.status === 401) {
    localStorage.removeItem('posq_token');
    throw new Error('Sesi berakhir, silakan login kembali');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

/* ======================================================
 * 1. CURRENT USER (PROFILE) - IMPROVED
 * ==================================================== */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    retry: false,
    queryFn: async () => {
      const token = localStorage.getItem('posq_token');
      if (!token) return null;

      try {
        const data = await fetchAPI<any>('/auth/me');
        
        // Cek format response baru
        if (data.success && data.user) {
          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            username: data.user.username,
            role: data.user.role,
            is_admin: data.user.is_admin,
            // Tambah field lain jika perlu
          };
        } else if (data.id) { // Format lama
          return {
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
          };
        }
        
        return null;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        return null;
      }
    },
  });
}

/* ======================================================
 * 2. CHECK ADMIN STATUS - FIXED
 * ==================================================== */
export function useIsAdmin() {
  return useQuery({
    queryKey: ['isAdmin'],
    retry: 1,
    queryFn: async (): Promise<boolean> => {
      const token = localStorage.getItem('posq_token');
      if (!token) return false;

      try {
        // Coba endpoint /auth/is-admin dulu (format sederhana)
        const data = await fetchAPI<any>('/auth/is-admin');
        
        // Handle berbagai format response
        if (typeof data.isAdmin === 'boolean') {
          return data.isAdmin;
        } else if (typeof data.is_admin === 'boolean') {
          return data.is_admin;
        } else if (data.data && typeof data.data.isAdmin === 'boolean') {
          return data.data.isAdmin;
        }
        
        return false;
      } catch (error) {
        console.error('Failed to check admin status:', error);
        return false;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/* ======================================================
 * 3. LOGIN - IMPROVED
 * ==================================================== */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      const res = await fetch(`${WP_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || `Login gagal (${res.status})`);
      }

      const data = await res.json();
      
      // Validasi response
      if (!data.success || !data.token) {
        throw new Error('Invalid response from server');
      }
      
      return data;
    },

    onSuccess: (data) => {
      // Simpan token
      localStorage.setItem('posq_token', data.token);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
      
      toast.success(`Berhasil masuk sebagai ${data.user?.name || data.name}`);
    },

    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

/* ======================================================
 * 4. LOGOUT
 * ==================================================== */
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem('posq_token');
    queryClient.clear();
    queryClient.removeQueries();
    toast.info('Anda telah logout');
  };
}

/* ======================================================
 * 5. OUTLETS DATA
 * ==================================================== */
export function useOutlets() {
  return useQuery({
    queryKey: ['outlets'],
    queryFn: async () => {
      return fetchAPI<any[]>('/outlets');
    },
    retry: 1,
  });
}

/* ======================================================
 * 6. PRODUCTS DATA
 * ==================================================== */
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      return fetchAPI<any[]>('/products');
    },
  });
}

/* ======================================================
 * 7. CATEGORIES DATA
 * ==================================================== */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      return fetchAPI<any[]>('/categories');
    },
  });
}

/* ======================================================
 * 8. CUSTOMERS DATA
 * ==================================================== */
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      return fetchAPI<any[]>('/customers');
    },
  });
}

/* ======================================================
 * 9. ORDERS DATA
 * ==================================================== */
export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      return fetchAPI<any[]>('/orders');
    },
  });
}

/* ======================================================
 * 10. DEBUG API STATUS
 * ==================================================== */
export function useApiStatus() {
  return useQuery({
    queryKey: ['apiStatus'],
    queryFn: async () => {
      try {
        const data = await fetchAPI<any>('/test');
        return {
          status: 'online',
          message: data.message || 'API is running',
          timestamp: data.timestamp,
        };
      } catch (error) {
        return {
          status: 'offline',
          message: error instanceof Error ? error.message : 'API connection failed',
          timestamp: new Date().toISOString(),
        };
      }
    },
    refetchInterval: 60000, // Check every minute
  });
}