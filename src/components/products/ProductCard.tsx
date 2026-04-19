import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Gauge, CalendarDays, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ProductTransmissionType } from '@/types/product';
import type { Product } from '@/types/product';
import { formatCurrency, formatMileage } from '@/utils/format';
import {
  getLocalizedProductDescriptionText,
  getLocalizedProductTitle,
  getLocalizedStatusName,
  getLocalizedTransmissionName,
} from '@/utils/localization';
import { getProductCategoryLabel } from '@/utils/product-category';

const statusClasses: Record<Product['status'], string> = {
  available: 'bg-emerald-500 text-white',
  reserved: 'bg-amber-500 text-white',
  sold: 'bg-slate-700 text-white',
};

export default function ProductCard({ product }: { product: Product }) {
  const { i18n, t } = useTranslation();
  const title = getLocalizedProductTitle(product, i18n.language);
  const description = getLocalizedProductDescriptionText(product, i18n.language);
  const isUsedProduct = product.stockType === 'used';

  return (
    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative h-56 overflow-hidden">
          <img src={product.images[0]} alt={title} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <Badge className={statusClasses[product.status]}>{getLocalizedStatusName(product.status, t)}</Badge>
            <Badge variant="secondary" className="bg-white/90 text-slate-900">
              {product.brand}
            </Badge>
          </div>
          <div className="absolute bottom-4 left-4">
            {isUsedProduct ? (
              <p className="text-2xl font-bold text-white">{formatCurrency(product.price, i18n.language)}</p>
            ) : (
              <p className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-brand-blue">
                {t('product.priceOnRequest')}
              </p>
            )}
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-blue">{getProductCategoryLabel(product, t)}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{description}</p>
        </div>

        {isUsedProduct ? (
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-brand-blue" />
              {t('product.specifications.year')}: {product.year}
            </span>
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-brand-blue" />
              {t('product.specifications.modelYear')}: {product.modelYear ?? t('common.notAvailable')}
            </span>
            <span className="flex items-center gap-2">
              <Gauge className="size-4 text-brand-blue" />
              {formatMileage(product.mileageKm, i18n.language, t('common.notAvailable'))}
            </span>
            <span className="flex items-center gap-2">
              <Settings2 className="size-4 text-brand-blue" />
              {product.transmission
                ? getLocalizedTransmissionName(product.transmission as ProductTransmissionType, t)
                : t('common.notAvailable')}
            </span>
            <span className="flex items-center gap-2 sm:col-span-2">
              <MapPin className="size-4 text-brand-blue" />
              {product.location ?? t('common.morocco')}
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 text-sm text-slate-600 sm:grid-cols-3">
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-brand-blue" />
              {product.year}
            </span>
            <span className="flex items-center gap-2">
              <Gauge className="size-4 text-brand-blue" />
              {formatMileage(product.mileageKm, i18n.language, t('common.notAvailable'))}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-brand-blue" />
              {product.location ?? t('common.morocco')}
            </span>
          </div>
        )}

        <Link to={`/product/${product.id}`} className="block">
          <Button className="w-full bg-brand-blue text-white hover:bg-brand-blue/90">
            {t('product.viewDetails')}
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </div>
    </article>
  );
}
