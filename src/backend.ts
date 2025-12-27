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

  if (response.status === 401) {
    localStorage.removeItem('posq_token');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Sesi berakhir, silakan login kembali.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.statusText}`);
  }

  if (response.status === 204) return {} as T;

  return response.json();
}

// --- MOCK ExternalBlob ---
export class ExternalBlob {
  static fromBytes(bytes: Uint8Array): ExternalBlob {
    return new ExternalBlob();
  }
  getDirectURL(): string {
    return "";
  }
}

// --- ENUMS & TYPES ---

export enum AppRole {
  owner = 'owner',
  manager = 'manager',
  cashier = 'cashier',
  guest = 'customer',
  admin = 'administrator',
  user = 'subscriber',
  customer = 'customer'
}

export { AppRole as UserRole };

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
  quantity: number; // FIXED: number agar kompatibel dengan FE
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
  registeredAt?: bigint; // Added optional
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
  name: string;
}

// Dummy Interfaces
export interface PaymentSettings { [key: string]: any }
export interface OwnerProfile { [key: string]: any }
export interface BusinessProfile { [key: string]: any }
export interface PaymentProofVerification { [key: string]: any }
export interface DatabaseExport { [key: string]: any }
export interface ExpenseRequest { [key: string]: any }
export interface CashflowSummary { totalIncome: bigint; totalExpenses: bigint; balance: bigint; }
export interface Expense { id: bigint; amount: bigint; category: string; description: string; outletId: bigint; timestamp: bigint; }
export interface OrderStatusHistoryEntry { status: OrderStatus; timestamp: bigint; }
export interface StockLog {
  id: bigint;
  productId: bigint;
  outletId: bigint;
  quantity: bigint;
  operation: string;
  timestamp: bigint;
}