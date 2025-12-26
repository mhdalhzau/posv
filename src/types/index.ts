// FILE: frontend/src/types/index.ts

// 1. Import Enum dari file yang baru Anda buat di Langkah 1
import { PaymentCategory, PaymentSubCategory, OrderStatus, AppRole } from '../backend';

// 2. Export ulang agar bisa dipakai di file lain
export { PaymentCategory, PaymentSubCategory, OrderStatus, AppRole };
export type { 
  UserProfile, 
  ProductRequest, 
  MenuAccess, 
  MenuAccessConfig, 
  MenuAccessInput, 
  GuestCustomerData 
} from '../backend';

// 3. Export ulang Database Entities dari Langkah 2
export type { 
  Product, 
  Category, 
  Brand, 
  ProductPackage, 
  PackageComponent, 
  Bundle, 
  BundleItem 
} from './backend';

// 4. Definisi Manual (Gabungan)

export interface PaymentMethod {
  id: string;
  name: string;
  category: PaymentCategory;
  subCategory?: PaymentSubCategory;
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
  items: TransactionItem[];
  paymentMethods: PaymentMethod[];
  status: OrderStatus;
}

export interface Outlet {
  id: bigint;
  name: string;
  address: string;
  createdAt: bigint;
  isActive: boolean;
}

export interface StockLog {
  id: bigint;
  productId: bigint;
  outletId: bigint;
  quantity: bigint;
  operation: 'add' | 'reduce' | 'transfer' | 'transaction';
  timestamp: bigint;
  userId: string;
  fromOutletId?: bigint;
  toOutletId?: bigint;
}

export interface DailySummary {
  totalRevenue: bigint;
  transactionCount: bigint;
  date: bigint;
}