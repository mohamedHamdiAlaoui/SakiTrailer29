import { getIntlLocale } from '@/utils/localization';

export function formatCurrency(amount: number, language?: string) {
  return new Intl.NumberFormat(getIntlLocale(language), {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMileage(value?: number, language?: string, emptyLabel = 'N/A') {
  if (!value) return emptyLabel;
  return `${new Intl.NumberFormat(getIntlLocale(language)).format(value)} km`;
}

export function formatDate(value: string, language?: string) {
  return new Intl.DateTimeFormat(getIntlLocale(language), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
