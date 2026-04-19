import type { Product } from '@/types/product';

const MAX_IMAGE_COLUMNS = 10;
const MAX_CATALOGUE_COLUMNS = 5;

function normalizeCsvScalar(value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value === 'string') {
    // Keep CSV rows single-line for simpler tooling compatibility.
    return value.replace(/\r?\n/g, '\\n').trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function escapeCsvValue(value: unknown) {
  const stringValue = normalizeCsvScalar(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function exportProductsToCsv(products: Product[]) {
  const headers = [
    'id',
    'stockType',
    'source',
    'status',
    'brand',
    'category',
    'customCategoryName',
    'year',
    'modelYear',
    'transmission',
    'mileageKm',
    'price',
    'dedouanee',
    'location',
    'title_en',
    'title_fr',
    'title_es',
    'description_en',
    'description_fr',
    'description_es',
    ...Array.from({ length: MAX_IMAGE_COLUMNS }, (_, index) => `image_${index + 1}`),
    ...Array.from({ length: MAX_CATALOGUE_COLUMNS }, (_, index) => `catalogue_${index + 1}_name`),
    ...Array.from({ length: MAX_CATALOGUE_COLUMNS }, (_, index) => `catalogue_${index + 1}_url`),
    'images_json',
    'catalogues_json',
    'createdAt',
  ];
  const rows = products.map((product) =>
    (() => {
      const images = Array.isArray(product.images) ? product.images : [];
      const catalogues = Array.isArray(product.catalogues) ? product.catalogues : [];

      return [
      product.id,
      product.stockType,
      product.source,
      product.status,
      product.brand,
      product.category,
      product.customCategoryName,
      product.year,
      product.modelYear,
      product.transmission,
      product.mileageKm,
      product.price,
      product.dedouanee,
      product.location,
      product.title,
      product.titleFr,
      product.titleEs,
      product.description,
      product.descriptionFr,
      product.descriptionEs,
      ...Array.from({ length: MAX_IMAGE_COLUMNS }, (_, index) => images[index] ?? ''),
      ...Array.from({ length: MAX_CATALOGUE_COLUMNS }, (_, index) => catalogues[index]?.name ?? ''),
      ...Array.from({ length: MAX_CATALOGUE_COLUMNS }, (_, index) => catalogues[index]?.url ?? ''),
      images,
      catalogues,
      product.createdAt,
      ];
    })()
      .map(escapeCsvValue)
      .join(',')
  );

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'products-export.csv';
  link.click();
  URL.revokeObjectURL(url);
}
