// src/backend.ts

// Pastikan URL ini benar sesuai settingan WordPress kamu
export const WP_API_URL = import.meta.env.VITE_WP_API_URL || 'https://erpos.tekrabyte.id/wp-json/posq/v1';

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  // --- AUTO LOGOUT JIKA TOKEN BASI (401) ---
  if (response.status === 401) {
    localStorage.removeItem('posq_token');
    // Redirect paksa ke login jika user tidak sedang di halaman login
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Sesi berakhir, silakan login kembali.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  // Handle respons kosong (seperti 204 No Content)
  if (response.status === 204) return {} as T;

  return response.json();
}

// Export tipe-tipe data (UserProfile, dll) di sini juga...
// (Biarkan tipe data yang sudah ada, tidak perlu dihapus)
// --- ENUMS (Pilihan Nilai) ---
export enum PaymentCategory {
  offline = 'offline',
  online = 'online',
  foodDelivery = 'foodDelivery'
}

export enum PaymentSubCategory {
  eWallet = 'eWallet',
  qris = 'qris',
  shopeeFood = 'shopeeFood',
  goFood = 'goFood',
  grabFood = 'grabFood',
  maximFood = 'maximFood',
  tiktok = 'tiktok'
}

export enum OrderStatus {
  pending = 'pending',
  processing = 'processing',
  ready = 'ready',
  completed = 'completed',
  canceled = 'canceled'
}

export enum AppRole {
  owner = 'owner',
  manager = 'manager',
  cashier = 'cashier'
}

// --- INTERFACES (Struktur Data Lengkap) ---

export interface PaymentMethod {
  id: string;
  name: string;
  category: PaymentCategory;
  subCategory?: PaymentSubCategory;
  methodName: string;
  amount?: bigint;
}

export interface TransactionItem {
  productId: bigint;
  quantity: number;
  price: bigint;
  isPackage: boolean;
  isBundle: boolean;
}

export interface Transaction {
  id: bigint;
  userId: string;
  outletId: bigint;
  total: bigint;
  timestamp: bigint;
  status: OrderStatus;
  items: TransactionItem[];
  paymentMethods: PaymentMethod[];
}

export interface Product {
  id: bigint;
  name: string;
  price: bigint;
  stock: bigint;
  outletId: bigint;
  createdAt: bigint;
  categoryId?: bigint;
  brandId?: bigint;
  isDeleted: boolean;
}

export interface Category {
  id: bigint;
  name: string;
  description: string;
  createdAt: bigint;
  isActive: boolean;
}

export interface Brand {
  id: bigint;
  name: string;
  description: string;
  createdAt: bigint;
  isActive: boolean;
}

export interface PackageComponent {
  productId: bigint;
  quantity: number;
}

export interface ProductPackage {
  id: bigint;
  name: string;
  price: bigint;
  components: PackageComponent[];
  outletId: bigint;
  createdAt: bigint;
  isActive: boolean;
  isActivePackage?: boolean;
}

export interface BundleItem {
  productId: bigint;
  packageId?: bigint | null;
  quantity: number;
  isPackage: boolean;
}

export interface Bundle {
  id: bigint;
  name: string;
  price: bigint;
  items: BundleItem[];
  outletId: bigint;
  createdAt: bigint;
  isActive: boolean;
}

export interface Outlet {
  id: bigint;
  name: string;
  address: string;
  createdAt: bigint;
  isActive: boolean;
}

export interface UserProfile {
  name: string;
  role: AppRole;
  outletId?: bigint | null;
}

export interface GuestCustomerData {
  name: string;
  phone?: string;
  address?: string;
  password?: string;
}

export interface MenuAccess {
  menu: string;
  isAccessible: boolean;
}

export interface MenuAccessConfig {
  cashier: MenuAccess[];
  manager: MenuAccess[];
  owner: MenuAccess[];
}

export interface MenuAccessInput {
  cashier: MenuAccess[];
  manager: MenuAccess[];
  owner: MenuAccess[];
}

export interface ProductRequest {
  id?: bigint;
  name: string;
  price: bigint;
  stock: bigint;
  outletId: bigint;
  categoryId?: bigint;
  brandId?: bigint;
}

export interface StockLog {
  id: bigint;
  productId: bigint;
  outletId: bigint;
  quantity: bigint;
  operation: 'add' | 'reduce' | 'transfer' | 'transaction';
  timestamp: bigint;
  userId: string;
}

export interface DailySummary {
  totalRevenue: bigint;
  transactionCount: bigint;
  date: bigint;
}