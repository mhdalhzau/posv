import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserProfile } from '../backend'; // Pastikan import ini benar

// Ganti URL ini dengan URL website WordPress kamu yang asli
const WP_API_URL = import.meta.env.VITE_WP_API_URL || 'https://erpos.tekrabyte.id/wp-json/posq/v1';

// --- Fetcher Helper ---
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('posq_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['X-Posq-Token'] = token; // [BARU] Kirim token di header cadangan juga
  }

  const response = await fetch(`${WP_API_URL}${endpoint}`, { ...options, headers });

  // Handle Logout jika token tidak valid (401 atau 403 dari endpoint profile)
  if (response.status === 401 || (response.status === 403 && endpoint === '/profile')) {
    localStorage.removeItem('posq_token');
    throw new Error('Sesi berakhir, silakan login lagi');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Terjadi kesalahan pada server');
  }

  return response.json();
}

// --- 1. Hook Cek User (Profile) ---
export function useCurrentUser() {
  return useQuery<UserProfile | null>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const token = localStorage.getItem('posq_token');
      if (!token) return null; // Jika tidak ada token, jangan fetch ke server
      try {
        const data = await fetchAPI<any>('/profile');
        return {
          name: data.name,
          role: data.role,
          outletId: data.outlet_id ? BigInt(data.outlet_id) : null,
        };
      } catch (error) {
        return null; // Token tidak valid/expired
      }
    },
    retry: false,
  });
}

// --- 2. Hook Login ---
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ username, password }: any) => {
      // Endpoint ini harus cocok dengan yang ada di posq-backend.php
      const res = await fetch(`${WP_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }), // ✅ Password dikirim di sini
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Login gagal, cek username/password');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Simpan token dari response backend
      localStorage.setItem('posq_token', data.token);
      
      // Refresh data user agar aplikasi sadar kita sudah login
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      toast.success('Berhasil masuk!');
      // Redirect akan ditangani otomatis oleh App.tsx saat user terdeteksi ada
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
}

// --- 3. Hook Logout ---
export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    localStorage.removeItem('posq_token');
    queryClient.setQueryData(['currentUser'], null);
    queryClient.clear();
    toast.info('Anda telah keluar');
    // window.location.href = '/login'; // Opsional, App.tsx akan handle ini
  };
}