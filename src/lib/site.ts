export const SITE_URL = 'https://www.sakitrailer29.com';

export function getAbsoluteSiteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
