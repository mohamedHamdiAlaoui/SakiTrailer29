import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProductStore } from '@/context/ProductStoreContext';
import { useSeo } from '@/hooks/use-seo';
import { getAbsoluteSiteUrl } from '@/lib/site';
import { getLocalizedTransmissionName } from '@/utils/localization';
import {
  applyUsedProductFilters,
  defaultUsedProductFilters,
  getUsedCascadingOptions,
  type UsedProductFilters,
} from '@/utils/used-product-filters';

type SortOption = 'recent' | 'price-asc' | 'price-desc';

// Skeleton card for loading state (#3)
function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm animate-pulse">
      <div className="h-56 bg-slate-200" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-5 w-2/3 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-200" />
        <div className="h-3 w-5/6 rounded bg-slate-200" />
        <div className="mt-4 h-9 w-full rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

function getFiltersFromSearchParams(searchParams: URLSearchParams): UsedProductFilters {
  return {
    vehicleType: (searchParams.get('vehicleType') as UsedProductFilters['vehicleType']) ?? 'all',
    brand: searchParams.get('brand') ?? 'all',
    dedouanee: (searchParams.get('dedouanee') as UsedProductFilters['dedouanee']) ?? 'all',
    transmission: (searchParams.get('transmission') as UsedProductFilters['transmission']) ?? 'all',
    minKilometers: searchParams.get('minKilometers') ?? '',
    maxKilometers: searchParams.get('maxKilometers') ?? '',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
  };
}

export default function Stock() {
  const { t } = useTranslation();
  const description = t('stockUsedPage.description');

  const { products, loadError, isLoading } = useProductStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<UsedProductFilters>(() => getFiltersFromSearchParams(searchParams));
  const [sortOption, setSortOption] = useState<SortOption>('recent');

  const usedProducts = useMemo(
    () => products.filter((product) => product.stockType !== 'new'),
    [products]
  );

  const cascadingOptions = useMemo(
    () => getUsedCascadingOptions(usedProducts, filters, t),
    [filters, t, usedProducts]
  );

  useEffect(() => {
    setFilters(getFiltersFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    setFilters((currentFilters) => {
      let nextFilters = currentFilters;

      if (
        currentFilters.vehicleType !== 'all' &&
        !cascadingOptions.vehicleTypes.some((option) => option.value === currentFilters.vehicleType)
      ) {
        nextFilters = { ...nextFilters, vehicleType: 'all', brand: 'all', dedouanee: 'all', transmission: 'all' };
      }

      if (nextFilters.brand !== 'all' && !cascadingOptions.brands.includes(nextFilters.brand)) {
        nextFilters = { ...nextFilters, brand: 'all', dedouanee: 'all', transmission: 'all' };
      }

      if (
        nextFilters.dedouanee !== 'all' &&
        !cascadingOptions.dedouanee.includes(nextFilters.dedouanee)
      ) {
        nextFilters = { ...nextFilters, dedouanee: 'all', transmission: 'all' };
      }

      if (
        nextFilters.transmission !== 'all' &&
        !cascadingOptions.transmissions.includes(nextFilters.transmission)
      ) {
        nextFilters = { ...nextFilters, transmission: 'all' };
      }

      return nextFilters;
    });
  }, [cascadingOptions.brands, cascadingOptions.dedouanee, cascadingOptions.transmissions, cascadingOptions.vehicleTypes]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (filters.vehicleType !== 'all') nextParams.set('vehicleType', filters.vehicleType);
    if (filters.brand !== 'all') nextParams.set('brand', filters.brand);
    if (filters.dedouanee !== 'all') nextParams.set('dedouanee', filters.dedouanee);
    if (filters.transmission !== 'all') nextParams.set('transmission', filters.transmission);
    if (filters.minKilometers) nextParams.set('minKilometers', filters.minKilometers);
    if (filters.maxKilometers) nextParams.set('maxKilometers', filters.maxKilometers);
    if (filters.minPrice) nextParams.set('minPrice', filters.minPrice);
    if (filters.maxPrice) nextParams.set('maxPrice', filters.maxPrice);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  const filteredProducts = useMemo(() => {
    const nextProducts = applyUsedProductFilters(usedProducts, filters);
    return [...nextProducts].sort((left, right) => {
      if (sortOption === 'price-asc') return left.price - right.price;
      if (sortOption === 'price-desc') return right.price - left.price;
      // 'recent' — default
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }, [filters, usedProducts, sortOption]);

  // Count active non-default filters (#7)
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.vehicleType !== 'all') count++;
    if (filters.brand !== 'all') count++;
    if (filters.dedouanee !== 'all') count++;
    if (filters.transmission !== 'all') count++;
    if (filters.minKilometers) count++;
    if (filters.maxKilometers) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    return count;
  }, [filters]);

  const structuredData = useMemo(
    () => [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: t('stockUsedPage.seoTitle'),
        description: t('stockUsedPage.seoDescription'),
        url: getAbsoluteSiteUrl('/stock/used'),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: t('stockUsedPage.title'),
        numberOfItems: filteredProducts.length,
        itemListElement: filteredProducts.slice(0, 12).map((product, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: getAbsoluteSiteUrl(`/product/${encodeURIComponent(product.id)}`),
          name: product.title,
        })),
      },
    ],
    [filteredProducts, t]
  );

  const keywords = t('stockUsedPage.seoKeywords');

  // Dynamic SEO title with result count (#11)
  const dynamicSeoTitle = usedProducts.length > 0
    ? `${usedProducts.length} ${t('stockUsedPage.seoTitle')}`
    : t('stockUsedPage.seoTitle');

  useSeo(dynamicSeoTitle, t('stockUsedPage.seoDescription'), {
    keywords,
    canonical: getAbsoluteSiteUrl('/stock/used'),
    og: {
      title: dynamicSeoTitle,
      description: t('stockUsedPage.seoDescription'),
      type: 'website',
      url: getAbsoluteSiteUrl('/stock/used'),
    },
    structuredData,
  });

  return (
    <section className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto space-y-8 px-4 pb-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">{t('stockUsedPage.eyebrow')}</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">{t('stockUsedPage.title')}</h1>
          {description ? <p className="mt-3 text-slate-600">{description}</p> : null}
        </div>

        <div className="rounded-3xl border bg-white p-5 shadow-sm">
          {loadError && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-red-600 ring-1 ring-red-200">
              <h3 className="font-semibold">Error Loading Products</h3>
              <p className="text-sm">{loadError}</p>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">{t('usedFilters.vehicleTypeLabel')}</label>
              <Select
                value={filters.vehicleType}
                onValueChange={(value) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    vehicleType: value as UsedProductFilters['vehicleType'],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('usedFilters.vehicleTypeAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('usedFilters.vehicleTypeAll')}</SelectItem>
                  {cascadingOptions.vehicleTypes.map((vehicleType) => (
                    <SelectItem key={vehicleType.value} value={vehicleType.value}>
                      {vehicleType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">{t('usedFilters.brandLabel')}</label>
              <Select
                value={filters.brand}
                onValueChange={(value) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    brand: value,
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('usedFilters.brandAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('usedFilters.brandAll')}</SelectItem>
                  {cascadingOptions.brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">{t('usedFilters.dedouaneeLabel')}</label>
              <Select
                value={filters.dedouanee}
                onValueChange={(value) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    dedouanee: value as UsedProductFilters['dedouanee'],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('usedFilters.dedouaneeAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('usedFilters.dedouaneeAll')}</SelectItem>
                  {cascadingOptions.dedouanee.includes('yes') ? (
                    <SelectItem value="yes">{t('usedFilters.dedouaneeYes')}</SelectItem>
                  ) : null}
                  {cascadingOptions.dedouanee.includes('no') ? (
                    <SelectItem value="no">{t('usedFilters.dedouaneeNo')}</SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">{t('usedFilters.minKilometersLabel')}</label>
              <Input
                type="number"
                value={filters.minKilometers}
                onChange={(event) =>
                  setFilters((currentFilters) => ({ ...currentFilters, minKilometers: event.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">{t('usedFilters.transmissionLabel')}</label>
              <Select
                value={filters.transmission}
                onValueChange={(value) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    transmission: value as UsedProductFilters['transmission'],
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('usedFilters.transmissionAll')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('usedFilters.transmissionAll')}</SelectItem>
                  {cascadingOptions.transmissions.map((transmission) => (
                    <SelectItem key={transmission} value={transmission}>
                      {getLocalizedTransmissionName(transmission, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">{t('usedFilters.maxKilometersLabel')}</label>
              <Input
                type="number"
                value={filters.maxKilometers}
                onChange={(event) =>
                  setFilters((currentFilters) => ({ ...currentFilters, maxKilometers: event.target.value }))
                }
                placeholder="500000"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">{t('usedFilters.minPriceLabel')}</label>
              <Input
                type="number"
                value={filters.minPrice}
                onChange={(event) =>
                  setFilters((currentFilters) => ({ ...currentFilters, minPrice: event.target.value }))
                }
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">{t('usedFilters.maxPriceLabel')}</label>
              <Input
                type="number"
                value={filters.maxPrice}
                onChange={(event) =>
                  setFilters((currentFilters) => ({ ...currentFilters, maxPrice: event.target.value }))
                }
                placeholder="1000000"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFilters(defaultUsedProductFilters);
              }}
            >
              {t('filters.reset')}
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex size-5 items-center justify-center rounded-full bg-brand-blue text-[11px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>{t('stockUsedPage.showing', { filtered: filteredProducts.length, total: usedProducts.length })}</p>
          {/* Sort control (#8) */}
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t('filters.sortRecent', 'Plus récents')}</SelectItem>
              <SelectItem value="price-asc">{t('filters.sortPriceAsc', 'Prix croissant')}</SelectItem>
              <SelectItem value="price-desc">{t('filters.sortPriceDesc', 'Prix décroissant')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold text-slate-950">{t('stockUsedPage.noResultsTitle')}</h2>
            <p className="mt-2 text-slate-600">{t('stockUsedPage.noResultsDescription')}</p>
            <Button
              className="mt-6 bg-brand-blue text-white hover:bg-brand-blue/90"
              onClick={() => {
                setFilters(defaultUsedProductFilters);
              }}
            >
              {t('filters.reset')}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
