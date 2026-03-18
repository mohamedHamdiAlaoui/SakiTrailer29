import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Globe, LogOut, Menu, ShieldCheck, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { buildHomeSectionLink } from '@/lib/links';
import { normalizeAppLanguage } from '@/utils/localization';

const languages = ['en', 'fr', 'es'] as const;
const languageMeta: Record<(typeof languages)[number], { flagSrc: string; shortLabel: string }> = {
  en: { flagSrc: '/flag-uk.svg', shortLabel: 'EN' },
  fr: { flagSrc: '/flag-fr.svg', shortLabel: 'FR' },
  es: { flagSrc: '/flag-es.svg', shortLabel: 'ES' },
};

export default function Header() {
  const { i18n, t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isStockMenuOpen, setIsStockMenuOpen] = useState(false);
  const currentLanguage = normalizeAppLanguage(i18n.resolvedLanguage ?? i18n.language);
  const currentLanguageMeta = languageMeta[currentLanguage];
  const isStockRoute = location.pathname.startsWith('/stock');

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-brand-gold' : 'text-white/80 hover:text-white'}`;

  const closeAllMenus = () => {
    setIsMenuOpen(false);
    setIsLanguageOpen(false);
    setIsStockMenuOpen(false);
  };

  const changeLanguage = (language: (typeof languages)[number]) => {
    void i18n.changeLanguage(language);
    closeAllMenus();
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-brand-blue backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-3" onClick={closeAllMenus}>
          <img
            src="/logo_full.png"
            alt="SakiTrailer29"
            className="h-12 w-auto max-w-[240px] bg-brand-blue object-contain"
          />
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <NavLink to="/" className={navLinkClass} onClick={closeAllMenus}>
            {t('nav.home')}
          </NavLink>

          <div
            className="relative"
            onMouseEnter={() => setIsStockMenuOpen(true)}
            onMouseLeave={() => setIsStockMenuOpen(false)}
            onFocusCapture={() => setIsStockMenuOpen(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsStockMenuOpen(false);
              }
            }}
          >
            <button
              type="button"
              className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
                isStockRoute ? 'text-brand-gold' : 'text-white/80 hover:text-white'
              }`}
              aria-expanded={isStockMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsStockMenuOpen((open) => !open)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setIsStockMenuOpen(false);
                }
              }}
            >
              {t('nav.stock')}
              <ChevronDown className={`size-4 transition-transform ${isStockMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <div
              className={`absolute left-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl transition-all ${
                isStockMenuOpen ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0'
              }`}
              role="menu"
              aria-label={t('nav.stock')}
            >
              <NavLink
                to="/stock/used"
                role="menuitem"
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm transition-colors ${
                    isActive ? 'bg-slate-100 text-brand-blue' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
                onClick={closeAllMenus}
              >
                {t('nav.stockUsed')}
              </NavLink>
              <NavLink
                to="/stock/new"
                role="menuitem"
                className={({ isActive }) =>
                  `block px-4 py-2 text-sm transition-colors ${
                    isActive ? 'bg-slate-100 text-brand-blue' : 'text-slate-700 hover:bg-slate-50'
                  }`
                }
                onClick={closeAllMenus}
              >
                {t('nav.stockNew')}
              </NavLink>
            </div>
          </div>



          {user?.role === 'admin' ? (
            <NavLink to="/admin" className={navLinkClass} onClick={closeAllMenus}>
              {t('nav.admin')}
            </NavLink>
          ) : null}
          <Link
            to={buildHomeSectionLink('services')}
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            onClick={closeAllMenus}
          >
            {t('nav.services')}
          </Link>
          <Link
            to={buildHomeSectionLink('contact')}
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            onClick={closeAllMenus}
          >
            {t('nav.contact')}
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <div className="relative">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              onClick={() => {
                setIsLanguageOpen((open) => !open);
                setIsMenuOpen(false);
              }}
            >
              <Globe className="size-4" />
              <img src={currentLanguageMeta.flagSrc} alt="" aria-hidden="true" className="h-4 w-6 rounded-sm object-cover" />
              {currentLanguageMeta.shortLabel}
            </Button>
            {isLanguageOpen ? (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border bg-white shadow-xl">
                {languages.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() => changeLanguage(language)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <img
                      src={languageMeta[language].flagSrc}
                      alt=""
                      aria-hidden="true"
                      className="h-4 w-6 rounded-sm object-cover"
                    />
                    {t(`nav.languages.${language}`)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {user ? (
            <>
              <Link 
                to="/dashboard" 
                onClick={closeAllMenus}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-white transition-colors hover:bg-white/20"
              >
                {user.role === 'admin' ? <ShieldCheck className="size-4" /> : <User className="size-4" />}
                {user.fullName}
              </Link>
              <Button
                variant="outline"
                className="border-white/20 bg-transparent text-white hover:bg-white hover:text-brand-blue"
                onClick={() => {
                  closeAllMenus();
                  logout();
                }}
              >
                <LogOut className="size-4" />
                {t('nav.logout')}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeAllMenus}>
                <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white hover:text-brand-blue">
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to="/signup" onClick={closeAllMenus}>
                <Button className="bg-brand-gold text-brand-blue hover:bg-brand-gold-light">{t('nav.signup')}</Button>
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hover:text-white lg:hidden"
          onClick={() => {
            setIsMenuOpen((open) => {
              const nextOpen = !open;
              if (!nextOpen) {
                setIsStockMenuOpen(false);
              }
              return nextOpen;
            });
            setIsLanguageOpen(false);
          }}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {isMenuOpen ? (
        <div className="border-t border-white/10 bg-brand-blue px-4 py-4 lg:hidden">
          <div className="container mx-auto space-y-3">
            <NavLink to="/" className="block text-white" onClick={closeAllMenus}>
              {t('nav.home')}
            </NavLink>
            <div className="space-y-2">
              <button
                type="button"
                className="flex w-full items-center justify-between text-left text-white"
                onClick={() => setIsStockMenuOpen((open) => !open)}
              >
                {t('nav.stock')}
                <ChevronDown className={`size-4 transition-transform ${isStockMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isStockMenuOpen ? (
                <div className="space-y-2 pl-4 text-white/85">
                  <NavLink to="/stock/used" className="block" onClick={closeAllMenus}>
                    {t('nav.stockUsed')}
                  </NavLink>
                  <NavLink to="/stock/new" className="block" onClick={closeAllMenus}>
                    {t('nav.stockNew')}
                  </NavLink>
                </div>
              ) : null}
            </div>
            {user ? (
              <NavLink to="/dashboard" className="flex items-center gap-2 text-white" onClick={closeAllMenus}>
                {user.role === 'admin' ? <ShieldCheck className="size-4" /> : <User className="size-4" />}
                {user.fullName}
              </NavLink>
            ) : null}
            {user?.role === 'admin' ? (
              <NavLink to="/admin" className="block text-white" onClick={closeAllMenus}>
                {t('nav.admin')}
              </NavLink>
            ) : null}
            <Link to={buildHomeSectionLink('services')} className="block text-white" onClick={closeAllMenus}>
              {t('nav.services')}
            </Link>
            <Link to={buildHomeSectionLink('contact')} className="block text-white" onClick={closeAllMenus}>
              {t('nav.contact')}
            </Link>
            <div className="flex flex-wrap gap-2 pt-2">
              {languages.map((language) => (
                <Button
                  key={language}
                  type="button"
                  variant={currentLanguage === language ? 'secondary' : 'outline'}
                  className="border-white/20 bg-transparent text-white hover:bg-white hover:text-brand-blue"
                  onClick={() => changeLanguage(language)}
                >
                  <img
                    src={languageMeta[language].flagSrc}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-6 rounded-sm object-cover"
                  />
                  {t(`nav.languages.${language}`)}
                </Button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white hover:text-brand-blue"
                  onClick={() => {
                    closeAllMenus();
                    logout();
                  }}
                >
                  {t('nav.logout')}
                </Button>
              ) : (
                <>
                  <Link to="/login" onClick={closeAllMenus}>
                    <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white hover:text-brand-blue">
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={closeAllMenus}>
                    <Button className="bg-brand-gold text-brand-blue hover:bg-brand-gold-light">{t('nav.signup')}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
