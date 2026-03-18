import type { TFunction } from 'i18next';
import type { Product, ProductTransmissionType } from '@/types/product';
import { getProductCategoryFilterValue, getProductCategoryLabel } from '@/utils/product-category';

export type UsedVehicleTypeFilter = 'all' | ReturnType<typeof getProductCategoryFilterValue>;
export type UsedTransmissionFilter = ProductTransmissionType | 'all';

export interface UsedProductFilters {
  vehicleType: UsedVehicleTypeFilter;
  brand: string;
  dedouanee: 'all' | 'yes' | 'no';
  transmission: UsedTransmissionFilter;
  minKilometers: string;
  maxKilometers: string;
  minPrice: string;
  maxPrice: string;
}

export const defaultUsedProductFilters: UsedProductFilters = {
  vehicleType: 'all',
  brand: 'all',
  dedouanee: 'all',
  transmission: 'all',
  minKilometers: '',
  maxKilometers: '',
  minPrice: '',
  maxPrice: '',
};

export interface UsedFilterOption {
  value: string;
  label: string;
}

export interface UsedCascadingOptions {
  vehicleTypes: UsedFilterOption[];
  brands: string[];
  dedouanee: Array<'yes' | 'no'>;
  transmissions: ProductTransmissionType[];
}

function uniqueValues<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}

function isUsedProduct(product: Product) {
  return product.stockType !== 'new';
}

function matchesVehicleType(product: Product, vehicleType: UsedVehicleTypeFilter) {
  return vehicleType === 'all' || getProductCategoryFilterValue(product) === vehicleType;
}

function matchesBrand(product: Product, brand: string) {
  return brand === 'all' || product.brand === brand;
}

function matchesDedouanee(product: Product, dedouanee: UsedProductFilters['dedouanee']) {
  const dedouaneeValue = product.dedouanee === true ? 'yes' : product.dedouanee === false ? 'no' : 'all';
  return dedouanee === 'all' || dedouaneeValue === dedouanee;
}

function matchesTransmission(product: Product, transmission: UsedTransmissionFilter) {
  return transmission === 'all' || product.transmission === transmission;
}

function getUniqueVehicleTypeOptions(products: Product[], t: TFunction) {
  const optionsByValue = new Map<string, UsedFilterOption>();

  for (const product of products) {
    const value = getProductCategoryFilterValue(product);
    if (!optionsByValue.has(value)) {
      optionsByValue.set(value, {
        value,
        label: getProductCategoryLabel(product, t),
      });
    }
  }

  return [...optionsByValue.values()].sort((left, right) => left.label.localeCompare(right.label));
}

export function getUsedCascadingOptions(
  products: Product[],
  filters: UsedProductFilters,
  t: TFunction
): UsedCascadingOptions {
  const usedProducts = products.filter(isUsedProduct);
  const byVehicleType = usedProducts.filter((product) => matchesVehicleType(product, filters.vehicleType));
  const byVehicleTypeAndBrand = byVehicleType.filter((product) => matchesBrand(product, filters.brand));
  const byVehicleTypeBrandAndDedouanee = byVehicleTypeAndBrand.filter((product) =>
    matchesDedouanee(product, filters.dedouanee)
  );

  return {
    vehicleTypes: getUniqueVehicleTypeOptions(usedProducts, t),
    brands: uniqueValues(byVehicleType.map((product) => product.brand)).sort((left, right) => left.localeCompare(right)),
    dedouanee: uniqueValues(
      byVehicleTypeAndBrand
        .map((product) => (product.dedouanee === true ? 'yes' : product.dedouanee === false ? 'no' : null))
        .filter((value): value is 'yes' | 'no' => value !== null)
    ),
    transmissions: uniqueValues(
      byVehicleTypeBrandAndDedouanee
        .map((product) => product.transmission)
        .filter((value): value is ProductTransmissionType => value !== undefined)
    ),
  };
}

export function applyUsedProductFilters(products: Product[], filters: UsedProductFilters) {
  return products.filter((product) => {
    if (!isUsedProduct(product)) return false;

    const mileage = product.mileageKm ?? Number.POSITIVE_INFINITY;
    const matchesMinKilometers = filters.minKilometers === '' || mileage >= Number(filters.minKilometers);
    const matchesMaxKilometers = filters.maxKilometers === '' || mileage <= Number(filters.maxKilometers);
    const matchesMinPrice = filters.minPrice === '' || product.price >= Number(filters.minPrice);
    const matchesMaxPrice = filters.maxPrice === '' || product.price <= Number(filters.maxPrice);

    return (
      matchesVehicleType(product, filters.vehicleType) &&
      matchesBrand(product, filters.brand) &&
      matchesDedouanee(product, filters.dedouanee) &&
      matchesTransmission(product, filters.transmission) &&
      matchesMinKilometers &&
      matchesMaxKilometers &&
      matchesMinPrice &&
      matchesMaxPrice
    );
  });
}
