import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Hero from '@/sections/Hero';
import Categories from '@/sections/Categories';
import Services from '@/sections/Services';
import Testimonials from '@/sections/Testimonials';
import Showroom from '@/sections/Showroom';
import ProductCard from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { useProductStore } from '@/context/ProductStoreContext';
import { useSeo } from '@/hooks/use-seo';
import { getAbsoluteSiteUrl } from '@/lib/site';

export default function Home() {
  const { t } = useTranslation();
  const ogImage = 'https://lecitrailer.es/banners/a54dc1b60206b7776046588bea59d2e4.jpg';

  const structuredData = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'AutoDealer',
      name: 'SAKI TRAILER 29',
      url: 'https://www.sakitrailer29.com/',
      image: ogImage,
      description: t('home.seoDescription'),
      telephone: '+212 666 206 141',
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Casablanca',
        addressCountry: 'MA',
      },
      areaServed: {
        '@type': 'Country',
        name: 'Morocco',
      },
    }),
    [ogImage, t]
  );

  useSeo(t('home.seoTitle'), t('home.seoDescription'), {
    keywords: 'lecitrailer morocco, official lecitrailer representative morocco, used tractor heads morocco, trailers morocco, international transport services',
    canonical: getAbsoluteSiteUrl('/'),
    og: {
      title: t('home.seoTitle'),
      description: t('home.seoDescription'),
      image: ogImage,
      type: 'website',
      url: getAbsoluteSiteUrl('/'),
    },
    structuredData,
  });

  const { products } = useProductStore();
  const latestProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 9),
    [products]
  );

  return (
    <>
      <Hero />
      <Categories />

      <section className="bg-white py-20">
        <div className="container mx-auto space-y-8 px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">{t('home.inventoryEyebrow')}</p>
            <h2 className="mt-2 text-4xl font-bold text-slate-950">{t('home.inventoryTitle')}</h2>
            <p className="mt-3 text-slate-600">{t('home.inventoryDescription')}</p>
          </div>

          {latestProducts.length === 0 ? (
            <div className="rounded-3xl border border-dashed bg-slate-50 px-6 py-16 text-center">
              <h3 className="text-2xl font-semibold text-slate-950">{t('home.noResultsTitle')}</h3>
              <p className="mt-2 text-slate-600">{t('home.noResultsDescription')}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {latestProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="flex justify-center">
                <Link to="/stock/new">
                  <Button className="bg-brand-blue text-white hover:bg-brand-blue/90">{t('home.fullStockCta')}</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      <Services />
      <Testimonials />
      <Showroom />
    </>
  );
}
