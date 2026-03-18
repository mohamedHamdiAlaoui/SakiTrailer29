import type { Product } from '@/types/product';

function escapeCsvValue(value: string | number | undefined) {
  if (value === undefined) return '';
  const stringValue = String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function exportProductsToCsv(products: Product[]) {
  const headers = [
    'id',
    'title',
    'titleFr',
    'titleEs',
    'category',
    'customCategoryName',
    'brand',
    'price',
    'year',
    'modelYear',
    'transmission',
    'mileageKm',
    'location',
    'description',
    'descriptionFr',
    'descriptionEs',
    'status',
    'createdAt',
  ];
  const rows = products.map((product) =>
    [
      product.id,
      product.title,
      product.titleFr,
      product.titleEs,
      product.category,
      product.customCategoryName,
      product.brand,
      product.price,
      product.year,
      product.modelYear,
      product.transmission,
      product.mileageKm,
      product.location,
      product.description,
      product.descriptionFr,
      product.descriptionEs,
      product.status,
      product.createdAt,
    ]
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
