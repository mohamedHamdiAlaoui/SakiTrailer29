import type { Product, ProductCategory, ProductStatus } from '@/types/product';

export type ProductSortOption = 'newest' | 'year-desc' | 'mileage-asc';

export interface ProductFilters {
  search: string;
  category: ProductCategory | 'all';
  brand: string | 'all';
  status: ProductStatus | 'all';
  minYear: string;
  maxYear: string;
}

export const defaultProductFilters: ProductFilters = {
  search: '',
  category: 'all',
  brand: 'all',
  status: 'all',
  minYear: '',
  maxYear: '',
};

export interface ProductFilterOptions {
  categories: ProductCategory[];
  brands: string[];
  statuses: ProductStatus[];
}

function matchesSearch(product: Product, searchValue: string) {
  const normalizedSearch = searchValue.trim().toLowerCase();
  const searchableContent = [product.title, product.titleFr, product.titleEs, product.brand]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map((value) => value.toLowerCase());

  return normalizedSearch === '' || searchableContent.some((value) => value.includes(normalizedSearch));
}

function uniqueValues<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}

export function filterProductsByFilters(products: Product[], filters: ProductFilters) {
  return products.filter((product) => {
    const searchMatches = matchesSearch(product, filters.search);
    const matchesCategory = filters.category === 'all' || product.category === filters.category;
    const matchesBrand = filters.brand === 'all' || product.brand === filters.brand;
    const matchesStatus = filters.status === 'all' || product.status === filters.status;
    const matchesMinYear = filters.minYear === '' || product.year >= Number(filters.minYear);
    const matchesMaxYear = filters.maxYear === '' || product.year <= Number(filters.maxYear);

    return (
      searchMatches &&
      matchesCategory &&
      matchesBrand &&
      matchesStatus &&
      matchesMinYear &&
      matchesMaxYear
    );
  });
}

export function getCascadingProductFilterOptions(products: Product[], filters: ProductFilters): ProductFilterOptions {
  const bySearch = products.filter((product) => matchesSearch(product, filters.search));
  const bySearchAndCategory = bySearch.filter(
    (product) => filters.category === 'all' || product.category === filters.category
  );
  const bySearchAndCategoryAndBrand = bySearchAndCategory.filter(
    (product) => filters.brand === 'all' || product.brand === filters.brand
  );

  return {
    categories: uniqueValues(bySearch.map((product) => product.category)),
    brands: uniqueValues(bySearchAndCategory.map((product) => product.brand)),
    statuses: uniqueValues(bySearchAndCategoryAndBrand.map((product) => product.status)),
  };
}

export function applyProductFilters(products: Product[], filters: ProductFilters, sort: ProductSortOption) {
  const filtered = filterProductsByFilters(products, filters);

  return filtered.sort((left, right) => {
    switch (sort) {
      case 'year-desc':
        return right.year - left.year;
      case 'mileage-asc':
        return (left.mileageKm ?? Number.POSITIVE_INFINITY) - (right.mileageKm ?? Number.POSITIVE_INFINITY);
      case 'newest':
      default:
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    }
  });
}
