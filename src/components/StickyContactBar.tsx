import { useLocation } from 'react-router-dom';
import { MessageCircle, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const hiddenPrefixes = ['/admin', '/dashboard', '/login', '/signup', '/forgot-password'];

export default function StickyContactBar() {
  const { t } = useTranslation();
  const location = useLocation();

  if (hiddenPrefixes.some((prefix) => location.pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/20 bg-brand-blue/95 shadow-2xl backdrop-blur">
        <a
          href="tel:+212666341519"
          className="flex flex-col items-center justify-center gap-1 border-r border-white/10 px-3 py-3 text-center text-white"
        >
          <Phone className="size-4" />
          <span className="text-xs font-semibold">{t('stickyContact.call')}</span>
        </a>
        <a
          href="https://wa.me/212666341519"
          target="_blank"
          rel="noreferrer"
          className="flex flex-col items-center justify-center gap-1 border-r border-white/10 px-3 py-3 text-center text-white"
        >
          <MessageCircle className="size-4" />
          <span className="text-xs font-semibold">{t('stickyContact.whatsapp')}</span>
        </a>
      </div>
    </div>
  );
}
