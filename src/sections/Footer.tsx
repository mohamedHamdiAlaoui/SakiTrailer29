import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { categories } from '@/data/products';
import { buildHomeSectionLink, buildStockLink } from '@/lib/links';
import { getLocalizedCategoryName } from '@/utils/localization';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer id="contact" className="bg-slate-950 text-white">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <img
            src="/logo_full_contact.png"
            alt="SakiTrailer29"
            className="h-20 w-auto max-w-full bg-slate-950 object-contain"
            loading="lazy"
          />
          <p className="max-w-md text-sm text-white/70">{t('footer.description')}</p>
          <div className="space-y-2 text-sm text-white/70">
            <p>{t('footer.phone')}</p>
            <p>{t('footer.email')}</p>
            <p>{t('footer.location')}</p>
          </div>
        </div>

        <div>
          <Link
            to={buildHomeSectionLink('categories')}
            className="mb-4 block text-sm font-semibold uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-brand-gold"
          >
            {t('footer.popularCategories')}
          </Link>
          <ul className="space-y-2 text-sm text-white/70">
            {categories.slice(0, 4).map((category) => (
              <li key={category.id}>
                <Link to={buildStockLink({ category: category.id })} className="transition-colors hover:text-brand-gold">
                  {getLocalizedCategoryName(category.id, t)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <Link to="/stock/new" className="mb-4 block text-sm font-semibold uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-brand-gold">
            {t('footer.buy')}
          </Link>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link to="/stock/new" className="transition-colors hover:text-brand-gold">
                {t('footer.viewStock')}
              </Link>
            </li>
            <li>
              <Link to={buildStockLink({ status: 'available' })} className="transition-colors hover:text-brand-gold">
                {t('footer.availableNow')}
              </Link>
            </li>
            <li>
              <Link to={buildStockLink({ category: 'rigids' })} className="transition-colors hover:text-brand-gold">
                {getLocalizedCategoryName('rigids', t)}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <Link
            to={buildHomeSectionLink('about')}
            className="mb-4 block text-sm font-semibold uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-brand-gold"
          >
            {t('footer.company')}
          </Link>
          <ul className="space-y-2 text-sm text-white/70">
            <li>
              <Link to={buildHomeSectionLink('services')} className="transition-colors hover:text-brand-gold">
                {t('footer.services')}
              </Link>
            </li>
            <li>
              <Link to={buildHomeSectionLink('about')} className="transition-colors hover:text-brand-gold">
                {t('footer.showroom')}
              </Link>
            </li>
            <li>
              <Link to={buildHomeSectionLink('contact')} className="transition-colors hover:text-brand-gold">
                {t('footer.contact')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6 text-sm text-white/50">{t('footer.copyright', { year: new Date().getFullYear() })}</div>
      </div>
    </footer>
  );
}
