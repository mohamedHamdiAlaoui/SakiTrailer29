import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { categories, categoryImages } from '@/data/products';
import { buildStockLink } from '@/lib/links';
import { getLocalizedCategoryName } from '@/utils/localization';

export default function Categories() {
  const { t } = useTranslation();

  return (
    <section id="categories" className="bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-blue">{t('categoriesSection.eyebrow')}</p>
            <h2 className="mt-2 text-4xl font-bold text-slate-950">{t('categoriesSection.title')}</h2>
          </div>
          <Link to="/stock/new" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue transition-colors hover:text-brand-red">
            {t('categoriesSection.viewAll')}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={buildStockLink({ category: category.id })}
              className="group overflow-hidden rounded-3xl border bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative h-56">
                <img
                  src={categoryImages[category.id]}
                  alt={getLocalizedCategoryName(category.id, t)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{t('categoriesSection.vehicleType')}</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{getLocalizedCategoryName(category.id, t)}</h3>
                  </div>
                  <ArrowRight className="size-5 text-white transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
