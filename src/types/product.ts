export const PRODUCT_CATEGORY_OPTIONS = [
  'curtainsiders-semicurtainsiders',
  'reefers',
  'dry-freight-vans',
  'container-carrier-chassis',
  'platforms',
  'trailers',
  'dolly',
  'special-vehicles-tailor-made',
  'rigids',
] as const;

export type KnownProductCategory = (typeof PRODUCT_CATEGORY_OPTIONS)[number];
export type ProductCategory = KnownProductCategory | 'other';
export const PRODUCT_ADMIN_CATEGORY_OPTIONS = [...PRODUCT_CATEGORY_OPTIONS, 'other'] as const;
export type ProductAdminCategory = (typeof PRODUCT_ADMIN_CATEGORY_OPTIONS)[number];

export type ProductStatus = 'available' | 'reserved' | 'sold';
export type ProductStockType = 'used' | 'new';
export type ProductSource = 'sakitrailer29' | 'lecitrailer';
export type ProductTransmissionType = 'manual' | 'automatic' | 'semi-automatic';

export interface ProductCatalogue {
  name: string;
  url: string;
}

export interface Product {
  id: string;
  title: string;
  titleFr?: string;
  titleEs?: string;
  category: ProductCategory;
  customCategoryName?: string;
  brand: string;
  stockType?: ProductStockType;
  source?: ProductSource;
  dedouanee?: boolean;
  price: number;
  year: number;
  modelYear?: number;
  transmission?: ProductTransmissionType;
  mileageKm?: number;
  location?: string;
  images: string[];
  catalogues?: ProductCatalogue[];
  description: string;
  descriptionFr?: string;
  descriptionEs?: string;
  status: ProductStatus;
  createdAt: string;
}

export interface ProductFormValues {
  id: string;
  title: string;
  titleFr?: string;
  titleEs?: string;
  category: ProductCategory;
  customCategoryName?: string;
  brand: string;
  price: number;
  year: number;
  modelYear?: number;
  transmission?: ProductTransmissionType;
  mileageKm?: number;
  location?: string;
  imagesText: string;
  catalogues?: ProductCatalogue[];
  description: string;
  descriptionFr?: string;
  descriptionEs?: string;
  status: ProductStatus;
}

export const PRODUCT_STATUS_OPTIONS: ProductStatus[] = ['available', 'reserved', 'sold'];
export const PRODUCT_STOCK_TYPE_OPTIONS: ProductStockType[] = ['new', 'used'];
export const PRODUCT_SOURCE_OPTIONS: ProductSource[] = ['lecitrailer', 'sakitrailer29'];
