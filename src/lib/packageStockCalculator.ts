import type { ProductPackage, Product, Bundle, BundleItem } from '../backend';

/**
 * Calculate the available stock for a package based on its component products.
 * Returns the maximum number of complete packages that can be made from available components.
 */
export function calculatePackageStock(
  pkg: ProductPackage,
  products: Product[] | undefined
): bigint {
  if (!products || products.length === 0 || pkg.components.length === 0) {
    return BigInt(0);
  }

  let minStock: bigint | null = null;

  for (const component of pkg.components) {
    const product = products.find(p => p.id === component.productId);
    
    if (!product || product.isDeleted) {
      // If any component product is missing or deleted, package stock is 0
      return BigInt(0);
    }

    // FIX: Convert component.quantity (number) to BigInt before division
    const quantity = BigInt(Math.floor(component.quantity)); // Ensure integer
    if (quantity === BigInt(0)) continue; // Avoid division by zero if quantity is 0

    const possiblePackages = product.stock / quantity;

    // Track the minimum (bottleneck component)
    if (minStock === null || possiblePackages < minStock) {
      minStock = possiblePackages;
    }
  }

  return minStock ?? BigInt(0);
}

/**
 * Calculate the available stock for a bundle based on its items (products and/or packages).
 * Returns the maximum number of complete bundles that can be made from available items.
 */
export function calculateBundleStock(
  bundle: Bundle,
  products: Product[] | undefined,
  packages: ProductPackage[] | undefined
): bigint {
  if (!products || products.length === 0 || bundle.items.length === 0) {
    return BigInt(0);
  }

  let minStock: bigint | null = null;

  for (const item of bundle.items) {
    let itemStock: bigint;

    if (item.isPackage && item.packageId) {
      // It's a package - calculate package stock first
      const pkg = packages?.find(p => p.id === item.packageId);
      if (!pkg || !pkg.isActive) {
        return BigInt(0);
      }
      itemStock = calculatePackageStock(pkg, products);
    } else {
      // It's a product
      const product = products.find(p => p.id === item.productId);
      if (!product || product.isDeleted) {
        return BigInt(0);
      }
      itemStock = product.stock;
    }

    // FIX: Convert item.quantity (number) to BigInt before division
    const quantity = BigInt(Math.floor(item.quantity)); // Ensure integer
    if (quantity === BigInt(0)) continue;

    const possibleBundles = itemStock / quantity;

    // Track the minimum (bottleneck item)
    if (minStock === null || possibleBundles < minStock) {
      minStock = possibleBundles;
    }
  }

  return minStock ?? BigInt(0);
}

/**
 * Calculate stock for multiple packages at once
 */
export function calculatePackagesStock(
  packages: ProductPackage[] | undefined,
  products: Product[] | undefined
): Map<bigint, bigint> {
  const stockMap = new Map<bigint, bigint>();
  
  if (!packages || !products) {
    return stockMap;
  }

  for (const pkg of packages) {
    stockMap.set(pkg.id, calculatePackageStock(pkg, products));
  }

  return stockMap;
}

/**
 * Calculate stock for multiple bundles at once
 */
export function calculateBundlesStock(
  bundles: Bundle[] | undefined,
  products: Product[] | undefined,
  packages: ProductPackage[] | undefined
): Map<bigint, bigint> {
  const stockMap = new Map<bigint, bigint>();
  
  if (!bundles || !products) {
    return stockMap;
  }

  for (const bundle of bundles) {
    stockMap.set(bundle.id, calculateBundleStock(bundle, products, packages));
  }

  return stockMap;
}

/**
 * Extended package type with calculated stock
 */
export interface PackageWithStock extends ProductPackage {
  stock: bigint;
}

/**
 * Extended bundle type with calculated stock
 */
export interface BundleWithStock extends Bundle {
  stock: bigint;
}

/**
 * Add calculated stock to packages
 */
export function addStockToPackages(
  packages: ProductPackage[] | undefined,
  products: Product[] | undefined
): PackageWithStock[] {
  if (!packages) return [];
  
  return packages.map(pkg => ({
    ...pkg,
    stock: calculatePackageStock(pkg, products),
  }));
}

/**
 * Add calculated stock to bundles
 */
export function addStockToBundles(
  bundles: Bundle[] | undefined,
  products: Product[] | undefined,
  packages: ProductPackage[] | undefined
): BundleWithStock[] {
  if (!bundles) return [];
  
  return bundles.map(bundle => ({
    ...bundle,
    stock: calculateBundleStock(bundle, products, packages),
  }));
}