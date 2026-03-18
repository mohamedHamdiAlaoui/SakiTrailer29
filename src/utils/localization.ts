import type { TFunction } from 'i18next';
import type { Product, ProductCategory, ProductStatus, ProductTransmissionType } from '@/types/product';

export type AppLanguage = 'en' | 'fr' | 'es';

export function normalizeAppLanguage(language?: string): AppLanguage {
  const normalized = (language ?? 'en').toLowerCase();

  if (normalized.startsWith('fr')) return 'fr';
  if (normalized.startsWith('es')) return 'es';

  return 'en';
}

export function getIntlLocale(language?: string) {
  switch (normalizeAppLanguage(language)) {
    case 'fr':
      return 'fr-MA';
    case 'es':
      return 'es-ES';
    case 'en':
    default:
      return 'en-US';
  }
}

export function getLocalizedProductTitle(product: Product, language?: string) {
  switch (normalizeAppLanguage(language)) {
    case 'fr':
      return product.titleFr ?? product.title;
    case 'es':
      return product.titleEs ?? product.title;
    case 'en':
    default:
      return product.title;
  }
}

export function getLocalizedProductDescription(product: Product, language?: string) {
  switch (normalizeAppLanguage(language)) {
    case 'fr':
      return product.descriptionFr ?? product.description;
    case 'es':
      return product.descriptionEs ?? product.description;
    case 'en':
    default:
      return product.description;
  }
}

export function getLocalizedCategoryName(category: ProductCategory, t: TFunction) {
  return t(`product.categories.${category}`);
}

export function getLocalizedStatusName(status: ProductStatus, t: TFunction) {
  return t(`product.status.${status}`);
}

export function getLocalizedTransmissionName(transmission: ProductTransmissionType, t: TFunction) {
  switch (transmission) {
    case 'semi-automatic':
      return t('product.transmission.semiAutomatic');
    case 'manual':
    case 'automatic':
    default:
      return t(`product.transmission.${transmission}`);
  }
}
