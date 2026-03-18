import type { TFunction } from 'i18next';
import type { Product, ProductCategory } from '@/types/product';
import { getLocalizedCategoryName } from '@/utils/localization';

type ProductCategoryLike = Pick<Product, 'category' | 'customCategoryName'>;

export function normalizeCustomCategoryName(value?: string) {
  if (typeof value !== 'string') return undefined;

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function slugifyCategoryName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getProductCategoryFilterValue(product: ProductCategoryLike) {
  const customCategoryName = normalizeCustomCategoryName(product.customCategoryName);

  if (product.category === 'other' && customCategoryName) {
    return `other:${slugifyCategoryName(customCategoryName)}`;
  }

  return product.category;
}

export function getProductCategoryLabel(product: ProductCategoryLike, t: TFunction) {
  const customCategoryName = normalizeCustomCategoryName(product.customCategoryName);

  if (product.category === 'other' && customCategoryName) {
    return customCategoryName;
  }

  return getLocalizedCategoryName(product.category as ProductCategory, t);
}
