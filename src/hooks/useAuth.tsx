import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserProfile } from '../backend';

const WP_API_URL =
  import.meta.env.VITE_WP_API_URL ||
  'https://erpos.tekrabyte.id/wp-json/posq/v1';

/* ======================================================
 * FETCH HELPER
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

  // ✅ TOKEN DIKIRIM VIA CUSTOM HEADER
  if (token) {
   headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${WP_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // ⛔ Token invalid / expired
  if (response.status === 401) {
    localStorage.removeItem('posq_token');
    throw new Error('Sesi berakhir, silakan login kembali');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Terjadi kesalahan server');
  }

  return response.json();
}

/* ======================================================
 * 1. CURRENT USER (PROFILE)
 * ==================================================== */
export function useCurrentUser() {
  return useQuery<UserProfile | null>({
    queryKey: ['currentUser'],
    retry: false,
    queryFn: async () => {
      const token = localStorage.getItem('posq_token');
      if (!token) return null;

      try {
        const data = await fetchAPI<any>('/profile');
        return {
          name: data.name,
          role: data.role,
          outletId: data.outlet_id ? BigInt(data.outlet_id) : null,
        };
      } catch {
        return null;
      }
    },
  });
}

/* ======================================================
 * 2. LOGIN
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Login gagal');
      }

      return res.json();
    },

    onSuccess: (data) => {
      localStorage.setItem('posq_token', data.token);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Berhasil masuk');
    },

    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

/* ======================================================
 * 3. LOGOUT
 * ==================================================== */
export function useLogout() {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem('posq_token');
    queryClient.clear();
    toast.info('Anda telah logout');
  };
}
