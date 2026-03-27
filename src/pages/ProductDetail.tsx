import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, FileText, Gauge, Mail, MapPin, MessageCircle, Phone, Settings2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ProductGallery from '@/components/products/ProductGallery';
import LeadForm from '@/components/products/LeadForm';
import ProductCard from '@/components/products/ProductCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useProductStore } from '@/context/ProductStoreContext';
import { useSeo } from '@/hooks/use-seo';
import { BUSINESS_EMAIL, BUSINESS_PHONE, getAbsoluteSiteUrl, SHOWROOM_COORDINATES } from '@/lib/site';
import type { ProductTransmissionType } from '@/types/product';
import { formatCurrency, formatMileage } from '@/utils/format';
import {
  getLocalizedProductDescription,
  getLocalizedProductTitle,
  getLocalizedStatusName,
  getLocalizedTransmissionName,
} from '@/utils/localization';
import { getProductCategoryFilterValue, getProductCategoryLabel } from '@/utils/product-category';

const statusClasses = {
  available: 'bg-emerald-500 text-white',
  reserved: 'bg-amber-500 text-white',
  sold: 'bg-slate-700 text-white',
};

function getSchemaAvailability(status: 'available' | 'reserved' | 'sold') {
  switch (status) {
    case 'available':
      return 'https://schema.org/InStock';
    case 'reserved':
      return 'https://schema.org/LimitedAvailability';
    case 'sold':
    default:
      return 'https://schema.org/SoldOut';
  }
}

export default function ProductDetail() {
  const { i18n, t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { products, isLoading } = useProductStore();
  const product = products.find((item) => item.id === id);
  const [activeCatalogueIndex, setActiveCatalogueIndex] = useState(0);
  const [catalogueBlobUrl, setCatalogueBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!product?.catalogues?.length || !product.catalogues[activeCatalogueIndex]) {
      setCatalogueBlobUrl(null);
      return;
    }

    const currentCatalogueUrl = product.catalogues[activeCatalogueIndex].url;

    if (currentCatalogueUrl && currentCatalogueUrl.startsWith('data:application/pdf;base64,')) {
      try {
        const base64Data = currentCatalogueUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let index = 0; index < byteCharacters.length; index++) {
          byteNumbers[index] = byteCharacters.charCodeAt(index);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        setCatalogueBlobUrl(blobUrl);

        return () => URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Failed to parse catalogue PDF base64:', error);
        setCatalogueBlobUrl(currentCatalogueUrl);
      }
    }

    setCatalogueBlobUrl(currentCatalogueUrl);
  }, [activeCatalogueIndex, product?.catalogues]);

  const localizedTitle = product ? getLocalizedProductTitle(product, i18n.language) : t('common.product');
  const localizedDescription = product ? getLocalizedProductDescription(product, i18n.language) : '';
  const stockPath = product?.stockType === 'new' ? '/stock/new' : '/stock/used';
  const canonicalUrl = product ? getAbsoluteSiteUrl(`/product/${encodeURIComponent(product.id)}`) : getAbsoluteSiteUrl('/');
  const isUsedProduct = product?.stockType === 'used';
  const seoKeywords = product
    ? t('productDetailPage.seoKeywords', {
        title: localizedTitle,
        brand: product.brand,
        category: getProductCategoryLabel(product, t),
        stockKeyword:
          product.stockType === 'new'
            ? t('productDetailPage.seoStockKeywordNew')
            : t('productDetailPage.seoStockKeywordUsed'),
      })
    : t('productDetailPage.fallbackSeoKeywords');

  useSeo(
    product ? t('productDetailPage.seoTitle', { title: localizedTitle, brand: product.brand }) : t('productDetailPage.fallbackSeoTitle'),
    product
      ? t('productDetailPage.seoDescription', { title: localizedTitle, brand: product.brand })
      : t('productDetailPage.fallbackSeoDescription'),
    {
      keywords: seoKeywords,
      canonical: canonicalUrl,
      og: {
        title: product ? t('productDetailPage.seoTitle', { title: localizedTitle, brand: product.brand }) : t('productDetailPage.fallbackSeoTitle'),
        description: product
          ? t('productDetailPage.seoDescription', { title: localizedTitle, brand: product.brand })
          : t('productDetailPage.fallbackSeoDescription'),
        image: product?.images[0],
        type: 'product',
        url: canonicalUrl,
      },
      structuredData: product
        ? [
            {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: localizedTitle,
              description: localizedDescription,
              image: product.images,
              sku: product.id,
              category: getProductCategoryLabel(product, t),
              brand: {
                '@type': 'Brand',
                name: product.brand,
              },
              offers: {
                '@type': 'Offer',
                priceCurrency: 'EUR',
                price: product.price,
                availability: getSchemaAvailability(product.status),
                url: canonicalUrl,
                seller: {
                  '@type': 'AutoDealer',
                  name: 'SAKI TRAILER 29',
                  url: getAbsoluteSiteUrl('/'),
                  telephone: BUSINESS_PHONE,
                  email: BUSINESS_EMAIL,
                  geo: {
                    '@type': 'GeoCoordinates',
                    latitude: SHOWROOM_COORDINATES.latitude,
                    longitude: SHOWROOM_COORDINATES.longitude,
                  },
                },
                itemCondition:
                  product.stockType === 'new'
                    ? 'https://schema.org/NewCondition'
                    : 'https://schema.org/UsedCondition',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: t('common.home'),
                  item: getAbsoluteSiteUrl('/'),
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: t('common.stock'),
                  item: getAbsoluteSiteUrl(stockPath),
                },
                {
                  '@type': 'ListItem',
                  position: 3,
                  name: localizedTitle,
                  item: canonicalUrl,
                },
              ],
            },
          ]
        : undefined,
    }
  );

  if (isLoading) {
    return (
      <section className="min-h-screen bg-slate-50 pt-32">
        <div className="container mx-auto px-4 pb-20">
          <Card className="rounded-3xl border-0 shadow-xl">
            <CardContent className="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-blue" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-950">{t('common.loading')}</p>
                <p className="text-sm text-slate-500">{t('productDetailPage.loadingDescription', 'Loading product details...')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!product) {
    return <Navigate to="/" replace />;
  }

  const relatedProducts = products
    .filter((item) => item.id !== product.id && getProductCategoryFilterValue(item) === getProductCategoryFilterValue(product))
    .slice(0, 3);

  const whatsappUrl = `https://wa.me/212666206141?text=${encodeURIComponent(
    t('product.whatsappMessage', { title: localizedTitle, id: product.id })
  )}`;

  return (
    <section className="min-h-screen bg-slate-50 pt-32">
      <div className="container mx-auto space-y-8 px-4 pb-20">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:text-brand-blue">
              {t('common.home')}
            </Link>
            <span>/</span>
            <Link to={stockPath} className="hover:text-brand-blue">
              {t('common.stock')}
            </Link>
            <span>/</span>
            <span className="text-slate-900">{localizedTitle}</span>
          </div>
          <Link to={stockPath}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ArrowLeft className="size-4" />
              {t('product.actions.backToStock')}
            </Button>
          </Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-8">
            <ProductGallery images={product.images} title={localizedTitle} />

            {catalogueBlobUrl && product.catalogues ? (
              <Card className="overflow-hidden rounded-3xl border-0 shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-white pb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="size-5 text-brand-blue" />
                    <h2 className="text-xl font-semibold text-slate-950">{t('product.catalogue')}</h2>
                  </div>
                  {product.catalogues.length > 1 ? (
                    <div className="w-[200px]">
                      <Select value={String(activeCatalogueIndex)} onValueChange={(value) => setActiveCatalogueIndex(Number(value))}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {product.catalogues.map((catalogue, index) => (
                            <SelectItem key={catalogue.name} value={String(index)}>
                              <span className="block max-w-[150px] truncate">{catalogue.name}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="h-[600px] bg-slate-100 p-0">
                  <object data={catalogueBlobUrl} type="application/pdf" className="h-full w-full">
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
                      <p className="mb-4">{t('product.catalogueNoPreview')}</p>
                      <a
                        href={catalogueBlobUrl}
                        download={product.catalogues[activeCatalogueIndex]?.name || 'catalogue.pdf'}
                        className="text-brand-blue hover:underline"
                      >
                        {t('product.downloadCatalogue')}
                      </a>
                    </div>
                  </object>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border-0 shadow-xl">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={statusClasses[product.status]}>{getLocalizedStatusName(product.status, t)}</Badge>
                  <Badge variant="outline">{product.brand}</Badge>
                  <Badge variant="secondary">{getProductCategoryLabel(product, t)}</Badge>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-950">{localizedTitle}</h1>
                  <p className="mt-3 text-slate-600">{localizedDescription}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-4xl font-bold text-brand-blue">{formatCurrency(product.price, i18n.language)}</p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                    <p className="flex items-center gap-2 font-medium">
                      <CalendarDays className="size-4 text-brand-blue" />
                      {t('product.specifications.year')}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{product.year}</p>
                  </div>
                  {isUsedProduct ? (
                    <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                      <p className="flex items-center gap-2 font-medium">
                        <CalendarDays className="size-4 text-brand-blue" />
                        {t('product.specifications.modelYear')}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{product.modelYear ?? t('common.notAvailable')}</p>
                    </div>
                  ) : null}
                  <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                    <p className="flex items-center gap-2 font-medium">
                      <Gauge className="size-4 text-brand-blue" />
                      {t('product.specifications.mileage')}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">
                      {formatMileage(product.mileageKm, i18n.language, t('common.notAvailable'))}
                    </p>
                  </div>
                  {isUsedProduct ? (
                    <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                      <p className="flex items-center gap-2 font-medium">
                        <Settings2 className="size-4 text-brand-blue" />
                        {t('product.specifications.transmission')}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">
                        {product.transmission
                          ? getLocalizedTransmissionName(product.transmission as ProductTransmissionType, t)
                          : t('common.notAvailable')}
                      </p>
                    </div>
                  ) : null}
                  <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700 sm:col-span-2">
                    <p className="flex items-center gap-2 font-medium">
                      <MapPin className="size-4 text-brand-blue" />
                      {t('product.specifications.location')}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{product.location ?? t('common.morocco')}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="sm:col-span-2">
                    <Button className="w-full bg-green-500 text-white hover:bg-green-600">
                      <MessageCircle className="size-4" />
                      {t('product.actions.whatsapp')}
                    </Button>
                  </a>
                  <a href="tel:+212666206141">
                    <Button variant="outline" className="w-full">
                      <Phone className="size-4" />
                      {t('product.actions.call')}
                    </Button>
                  </a>
                  <a href="mailto:contact@sakitrailer29.com">
                    <Button variant="outline" className="w-full">
                      <Mail className="size-4" />
                      {t('product.actions.email')}
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-0 shadow-xl">
              <CardHeader>
                <h2 className="text-2xl font-semibold text-slate-950">{t('leadForm.title')}</h2>
              </CardHeader>
              <CardContent>
                <LeadForm product={product} />
              </CardContent>
            </Card>
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">{t('product.relatedEyebrow')}</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-950">{t('product.relatedTitle')}</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
