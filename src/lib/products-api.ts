import type { Product } from '@/types/product';
import { createApiHeaders, getApiEndpoint } from '@/lib/api';

interface ProductsResponse {
  success: boolean;
  products?: Product[];
  product?: Product;
  error?: string;
}

interface UploadedFileResponse {
  success: boolean;
  file?: { name: string; url: string };
  error?: string;
}

type UploadProgressHandler = (progress: { loaded: number; total: number }) => void;

async function parseProductsResponse(response: Response): Promise<ProductsResponse> {
  const payload = (await response.json()) as ProductsResponse;
  if (!response.ok || !payload.success) {
    throw new Error(payload.error || 'products_api_request_failed');
  }
  return payload;
}

export async function fetchProductsFromApi() {
  const response = await fetch(getApiEndpoint('/api/products'), { method: 'GET', cache: 'no-store' });
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

function uploadFileWithProgress(
  endpoint: string,
  fieldName: string,
  file: File,
  fallbackError: string,
  onProgress?: UploadProgressHandler
) {
  const formData = new FormData();
  formData.append(fieldName, file);

  return new Promise<{ name: string; url: string }>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', getApiEndpoint(endpoint));

    const headers = createApiHeaders({ auth: true });
    headers.forEach((value, key) => {
      request.setRequestHeader(key, value);
    });

    request.upload.addEventListener('progress', (event) => {
      if (!onProgress) {
        return;
      }

      onProgress({
        loaded: event.loaded,
        total: event.lengthComputable ? event.total : file.size,
      });
    });

    request.addEventListener('error', () => {
      reject(new Error('backend_unreachable'));
    });

    request.addEventListener('abort', () => {
      reject(new Error(fallbackError));
    });

    request.addEventListener('load', () => {
      let payload: UploadedFileResponse | null = null;

      try {
        payload = request.responseText ? (JSON.parse(request.responseText) as UploadedFileResponse) : null;
      } catch {
        reject(new Error(fallbackError));
        return;
      }

      if (request.status < 200 || request.status >= 300 || !payload?.success || !payload.file) {
        reject(new Error(payload?.error || fallbackError));
        return;
      }

      resolve(payload.file);
    });

    request.send(formData);
  });
}

export function uploadImageInApi(file: File, onProgress?: UploadProgressHandler) {
  return uploadFileWithProgress('/api/uploads/images', 'image', file, 'image_upload_failed', onProgress);
}

export function uploadCatalogueInApi(file: File, onProgress?: UploadProgressHandler) {
  return uploadFileWithProgress('/api/uploads/catalogues', 'catalogue', file, 'catalogue_upload_failed', onProgress);
}
