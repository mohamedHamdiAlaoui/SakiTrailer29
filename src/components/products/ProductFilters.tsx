import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PRODUCT_CATEGORY_OPTIONS, PRODUCT_STATUS_OPTIONS } from '@/types/product';
import type { ProductCategory, ProductStatus } from '@/types/product';
import type { ProductFilters, ProductSortOption } from '@/utils/product-filters';
import { getLocalizedCategoryName, getLocalizedStatusName } from '@/utils/localization';

interface ProductFiltersProps {
  filters: ProductFilters;
  sort: ProductSortOption;
  availableCategories?: readonly ProductCategory[];
  availableBrands?: string[];
  availableStatuses?: ProductStatus[];
  onFiltersChange: (filters: ProductFilters) => void;
  onSortChange: (sort: ProductSortOption) => void;
  onReset: () => void;
}

export default function ProductFiltersPanel({
  filters,
  sort,
  availableCategories = PRODUCT_CATEGORY_OPTIONS,
  availableBrands = [],
  availableStatuses = PRODUCT_STATUS_OPTIONS,
  onFiltersChange,
  onSortChange,
  onReset,
}: ProductFiltersProps) {
  const { t } = useTranslation();

  const sortOptions: Array<{ value: ProductSortOption; label: string }> = [
    { value: 'newest', label: t('filters.sortNewest') },
    { value: 'price-asc', label: t('filters.sortPriceAsc') },
    { value: 'price-desc', label: t('filters.sortPriceDesc') },
    { value: 'year-desc', label: t('filters.sortYearDesc') },
    { value: 'mileage-asc', label: t('filters.sortMileageAsc') },
  ];

  const updateField = <K extends keyof ProductFilters>(field: K, value: ProductFilters[K]) => {
    onFiltersChange({ ...filters, [field]: value });
  };

  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="xl:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('filters.searchLabel')}</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filters.search}
              onChange={(event) => updateField('search', event.target.value)}
              placeholder={t('filters.searchPlaceholder')}
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('filters.categoryLabel')}</label>
          <Select value={filters.category} onValueChange={(value) => updateField('category', value as ProductFilters['category'])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('filters.categoryAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.categoryAll')}</SelectItem>
              {availableCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {getLocalizedCategoryName(category, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('filters.brandLabel')}</label>
          <Select value={filters.brand} onValueChange={(value) => updateField('brand', value as ProductFilters['brand'])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('filters.brandAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.brandAll')}</SelectItem>
              {availableBrands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('filters.statusLabel')}</label>
          <Select value={filters.status} onValueChange={(value) => updateField('status', value as ProductFilters['status'])}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('filters.statusAll')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.statusAll')}</SelectItem>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {getLocalizedStatusName(status, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('filters.minPriceLabel')}</label>
          <Input type="number" value={filters.minPrice} onChange={(event) => updateField('minPrice', event.target.value)} placeholder="0" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('filters.maxPriceLabel')}</label>
          <Input type="number" value={filters.maxPrice} onChange={(event) => updateField('maxPrice', event.target.value)} placeholder="1000000" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('filters.minYearLabel')}</label>
          <Input type="number" value={filters.minYear} onChange={(event) => updateField('minYear', event.target.value)} placeholder="2018" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('filters.maxYearLabel')}</label>
          <Input type="number" value={filters.maxYear} onChange={(event) => updateField('maxYear', event.target.value)} placeholder="2026" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">{t('filters.sortLabel')}</label>
          <Select value={sort} onValueChange={(value) => onSortChange(value as ProductSortOption)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('filters.sortNewest')} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" onClick={onReset}>
          {t('filters.reset')}
        </Button>
      </div>
    </div>
  );
}
