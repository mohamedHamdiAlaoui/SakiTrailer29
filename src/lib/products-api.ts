import type { Product } from '@/types/product';
import { createApiHeaders, getApiEndpoint } from '@/lib/api';

interface ProductsResponse {
  success: boolean;
  products?: Product[];
  product?: Product;
  error?: string;
}

async function parseProductsResponse(response: Response): Promise<ProductsResponse> {
  const payload = (await response.json()) as ProductsResponse;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'products_api_request_failed');
  }
  return payload;
}

export async function fetchProductsFromApi() {
  const response = await fetch(getApiEndpoint('/api/products'), { method: 'GET' });
  const payload = await parseProductsResponse(response);
  return payload.products ?? [];
}

export async function bootstrapProductsInApi(products: Product[]) {
  const response = await fetch(getApiEndpoint('/api/products/bootstrap'), {
    method: 'POST',
    headers: createApiHeaders({ json: true }),
    body: JSON.stringify({ products }),
  });

  const payload = await parseProductsResponse(response);
  return payload.products ?? [];
}

export async function createProductInApi(product: Product) {
  const response = await fetch(getApiEndpoint('/api/products'), {
    method: 'POST',
    headers: createApiHeaders({ auth: true, json: true }),
    body: JSON.stringify({ product }),
  });

  const payload = await parseProductsResponse(response);
  if (!payload.product) {
    throw new Error('products_api_missing_product');
  }
  return payload.product;
}

export async function updateProductInApi(product: Product) {
  const response = await fetch(getApiEndpoint(`/api/products/${encodeURIComponent(product.id)}`), {
    method: 'PUT',
    headers: createApiHeaders({ auth: true, json: true }),
    body: JSON.stringify({ product }),
  });

  const payload = await parseProductsResponse(response);
  if (!payload.product) {
    throw new Error('products_api_missing_product');
  }
  return payload.product;
}

export async function deleteProductInApi(productId: string) {
  const response = await fetch(getApiEndpoint(`/api/products/${encodeURIComponent(productId)}`), {
    method: 'DELETE',
    headers: createApiHeaders({ auth: true }),
  });

  await parseProductsResponse(response);
}
