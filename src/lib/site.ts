export const SITE_URL = 'https://sakitrailer29.ma';

export const BUSINESS_PHONE = '+212 666 206 141';
export const BUSINESS_EMAIL = 'contact@sakitrailer29.com';
export const SHOWROOM_COORDINATES = {
  latitude: 35.77568193917511,
  longitude: -5.796048432226565,
};

export function getAbsoluteSiteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
