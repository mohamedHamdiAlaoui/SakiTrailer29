export const SITE_URL = 'https://sakitrailer29.ma';

export const BUSINESS_PHONE = '+212 666 206 141';
export const BUSINESS_EMAIL = 'contact@sakitrailer29.com';
export const SHOWROOM_LOCATIONS = [
  {
    id: 'location-1',
    nameKey: 'showroom.locations.location1.name',
    latitude: 35.77568193917511,
    longitude: -5.796048432226565,
  },
  {
    id: 'location-2',
    nameKey: 'showroom.locations.location2.name',
    latitude: 33.44010925292969,
    longitude: -7.524048328399658,
  },
] as const;

export const SHOWROOM_COORDINATES = {
  latitude: SHOWROOM_LOCATIONS[0].latitude,
  longitude: SHOWROOM_LOCATIONS[0].longitude,
};

export function getAbsoluteSiteUrl(path = '/') {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}
