import type { To } from 'react-router-dom';
import type { ProductCategory, ProductStatus } from '@/types/product';

type StockLinkFilters = {
  search?: string;
  category?: ProductCategory | ProductCategory[];
  status?: ProductStatus | ProductStatus[];
};

function appendParam(params: URLSearchParams, key: string, value?: string | string[]) {
  if (!value) return;

  const values = Array.isArray(value) ? value : [value];
  values.filter(Boolean).forEach((entry) => params.append(key, entry));
}

export function buildStockLink(filters: StockLinkFilters = {}): To {
  const params = new URLSearchParams();
  appendParam(params, 'search', filters.search);
  appendParam(params, 'category', filters.category);
  appendParam(params, 'status', filters.status);

  return {
    pathname: '/stock/new',
    search: params.toString() ? `?${params.toString()}` : '',
  };
}

export function buildHomeSectionLink(sectionId: 'categories' | 'services' | 'about' | 'contact'): To {
  return { pathname: '/', hash: `#${sectionId}` };
}
