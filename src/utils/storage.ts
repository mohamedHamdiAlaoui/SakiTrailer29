import type { Order } from '@/types/order';
import type { KnownProductCategory, Product } from '@/types/product';
import { seedProducts } from '@/data/products';
import { PRODUCT_CATEGORY_OPTIONS } from '@/types/product';

export const STORAGE_KEYS = {
  products: 'sakitrailer29_products',
  productsSeedVersion: 'sakitrailer29_products_seed_version',
  productsCache: 'sakitrailer29_products_cache_v1',
  orders: 'sakitrailer29_orders',
} as const;

const PRODUCT_SEED_VERSION = 5;

const validProductCategories = new Set(PRODUCT_CATEGORY_OPTIONS);

function normalizeCategory(category: unknown): Product['category'] {
  if (typeof category !== 'string') return 'trailers';

  if (validProductCategories.has(category as KnownProductCategory)) {
    return category as KnownProductCategory;
  }

  if (category === 'other') {
    return 'other';
  }

  switch (category) {
    case 'truck':
    case 'tractorhead':
      return 'rigids';
    case 'van':
      return 'dry-freight-vans';
    case 'trailer':
      return 'trailers';
    case 'construction':
      return 'special-vehicles-tailor-made';
    case 'semitrailer':
      return 'curtainsiders-semicurtainsiders';
    default:
      return 'trailers';
  }
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function normalizeStoredProduct(product: Product): Product {
  return {
    ...product,
    category: normalizeCategory((product as { category?: unknown }).category),
  };
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function getStorageItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;

  const value = window.localStorage.getItem(key);
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function setStorageItem<T>(key: string, value: T) {
  if (!isBrowser()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCachedProducts() {
  return getStorageItem<Product[]>(STORAGE_KEYS.productsCache, []).map(normalizeStoredProduct);
}

export function saveCachedProducts(products: Product[]) {
  const normalizedProducts = products.map(normalizeStoredProduct);
  setStorageItem(STORAGE_KEYS.productsCache, normalizedProducts);
  return normalizedProducts;
}

export function getInitialProductCatalog() {
  const cachedProducts = getCachedProducts();
  if (cachedProducts.length > 0) {
    return cachedProducts;
  }

  return seedProducts.map(normalizeStoredProduct);
}

export function ensureProductSeed() {
  const storedProducts = getStorageItem<Product[]>(STORAGE_KEYS.products, []);
  const seedVersion = getStorageItem<number>(STORAGE_KEYS.productsSeedVersion, 0);

  if (storedProducts.length === 0 || seedVersion < PRODUCT_SEED_VERSION) {
    const seedIds = new Set(seedProducts.map((product) => product.id));
    const customProducts = storedProducts
      .filter((product) => !seedIds.has(product.id) && !product.id.startsWith('USED-'))
      .map(normalizeStoredProduct);
    const nextProducts = [...customProducts, ...seedProducts];

    setStorageItem(STORAGE_KEYS.products, nextProducts);
    setStorageItem(STORAGE_KEYS.productsSeedVersion, PRODUCT_SEED_VERSION);
    return nextProducts;
  }

  return storedProducts.map(normalizeStoredProduct);
}

export function getStoredOrders() {
  return getStorageItem<Order[]>(STORAGE_KEYS.orders, []);
}

export function saveOrders(orders: Order[]) {
  setStorageItem(STORAGE_KEYS.orders, orders);
  return orders;
}
