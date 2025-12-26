// FILE: frontend/src/types/backend.ts

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
  packageId?: bigint;
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