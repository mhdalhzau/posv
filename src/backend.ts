// FILE: frontend/src/backend.ts

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