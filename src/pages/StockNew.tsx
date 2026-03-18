import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '@/components/products/ProductCard';
import ProductFiltersPanel from '@/components/products/ProductFilters';
import { Button } from '@/components/ui/button';
import { useProductStore } from '@/context/ProductStoreContext';
import { useSeo } from '@/hooks/use-seo';
import { getAbsoluteSiteUrl } from '@/lib/site';
import {
  applyProductFilters,
  defaultProductFilters,
  getCascadingProductFilterOptions,
  type ProductFilters,
  type ProductSortOption,
} from '@/utils/product-filters';

function getFiltersFromSearchParams(searchParams: URLSearchParams): ProductFilters {
  return {
    search: searchParams.get('search') ?? '',
    category: (searchParams.get('category') as ProductFilters['category']) ?? 'all',
    brand: searchParams.get('brand') ?? 'all',
    status: (searchParams.get('status') as ProductFilters['status']) ?? 'all',
    minPrice: searchParams.get('minPrice') ?? '',
    maxPrice: searchParams.get('maxPrice') ?? '',
    minYear: searchParams.get('minYear') ?? '',
    maxYear: searchParams.get('maxYear') ?? '',
  };
}

export default function StockNew() {
  const { t } = useTranslation();
  const description = t('stockNewPage.description');

  useSeo(t('stockNewPage.seoTitle'), t('stockNewPage.seoDescription'), {
    keywords: 'new trailers morocco, lecitrailer, trailer dealership morocco, new stock',
    canonical: getAbsoluteSiteUrl('/stock/new'),
    og: {
      title: t('stockNewPage.seoTitle'),
      description: t('stockNewPage.seoDescription'),
      type: 'website',
      url: getAbsoluteSiteUrl('/stock/new'),
    },
  });

  const { products } = useProductStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<ProductFilters>(() => getFiltersFromSearchParams(searchParams));
  const [sort, setSort] = useState<ProductSortOption>((searchParams.get('sort') as ProductSortOption) ?? 'newest');

  const newProducts = useMemo(
    () => products.filter((product) => product.stockType === 'new' && product.source === 'lecitrailer'),
    [products]
  );

  const cascadingOptions = useMemo(
    () => getCascadingProductFilterOptions(newProducts, filters),
    [filters, newProducts]
  );

  useEffect(() => {
    setFilters(getFiltersFromSearchParams(searchParams));
    setSort((searchParams.get('sort') as ProductSortOption) ?? 'newest');
  }, [searchParams]);

  useEffect(() => {
    setFilters((currentFilters) => {
      let nextFilters = currentFilters;

      if (
        currentFilters.category !== 'all' &&
        !cascadingOptions.categories.includes(currentFilters.category)
      ) {
        nextFilters = { ...nextFilters, category: 'all', brand: 'all', status: 'all' };
      }

      if (
        nextFilters.brand !== 'all' &&
        !cascadingOptions.brands.includes(nextFilters.brand)
      ) {
        nextFilters = { ...nextFilters, brand: 'all', status: 'all' };
      }

      if (
        nextFilters.status !== 'all' &&
        !cascadingOptions.statuses.includes(nextFilters.status)
      ) {
        nextFilters = { ...nextFilters, status: 'all' };
      }

      return nextFilters;
    });
  }, [cascadingOptions.brands, cascadingOptions.categories, cascadingOptions.statuses]);

  useEffect(() => {
    const nextParams = new URLSearchParams();

    if (filters.search) nextParams.set('search', filters.search);
    if (filters.category !== 'all') nextParams.set('category', filters.category);
    if (filters.brand !== 'all') nextParams.set('brand', filters.brand);
    if (filters.status !== 'all') nextParams.set('status', filters.status);
    if (filters.minPrice) nextParams.set('minPrice', filters.minPrice);
    if (filters.maxPrice) nextParams.set('maxPrice', filters.maxPrice);
    if (filters.minYear) nextParams.set('minYear', filters.minYear);
    if (filters.maxYear) nextParams.set('maxYear', filters.maxYear);
    nextParams.set('sort', sort);

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams, sort]);

  const filteredProducts = useMemo(
    () => applyProductFilters(newProducts, filters, sort),
    [filters, newProducts, sort]
  );

  return (
    <section className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto space-y-8 px-4 pb-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">{t('stockNewPage.eyebrow')}</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">{t('stockNewPage.title')}</h1>
          {description ? <p className="mt-3 text-slate-600">{description}</p> : null}
        </div>

        <ProductFiltersPanel
          filters={filters}
          sort={sort}
          availableCategories={cascadingOptions.categories}
          availableBrands={cascadingOptions.brands}
          availableStatuses={cascadingOptions.statuses}
          onFiltersChange={setFilters}
          onSortChange={setSort}
          onReset={() => {
            setFilters(defaultProductFilters);
            setSort('newest');
          }}
        />

        <div className="flex items-center justify-between text-sm text-slate-600">
          <p>{t('stockNewPage.showing', { filtered: filteredProducts.length, total: newProducts.length })}</p>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed bg-white px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold text-slate-950">{t('stockNewPage.noResultsTitle')}</h2>
            <p className="mt-2 text-slate-600">{t('stockNewPage.noResultsDescription')}</p>
            <Button
              className="mt-6 bg-brand-blue text-white hover:bg-brand-blue/90"
              onClick={() => {
                setFilters(defaultProductFilters);
                setSort('newest');
              }}
            >
              {t('filters.reset')}
            </Button>
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
