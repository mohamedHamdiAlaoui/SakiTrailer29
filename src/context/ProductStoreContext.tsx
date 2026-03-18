import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '@/types/product';
import {
  bootstrapProductsInApi,
  createProductInApi,
  deleteProductInApi,
  fetchProductsFromApi,
  updateProductInApi,
} from '@/lib/products-api';
import { seedProducts } from '@/data/products';

interface ProductStoreActionResult {
  success: boolean;
  error?: string;
}

function normalizeProductStoreError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const normalizedMessage = error.message.toLowerCase();
    if (normalizedMessage.includes('failed to fetch') || normalizedMessage.includes('econnrefused')) {
      return 'backend_unreachable';
    }

    return error.message || fallback;
  }

  return fallback;
}

interface ProductStoreContextValue {
  products: Product[];
  isLoading: boolean;
  loadError: string | null;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<ProductStoreActionResult>;
  updateProduct: (product: Product) => Promise<ProductStoreActionResult>;
  deleteProduct: (productId: string) => Promise<ProductStoreActionResult>;
}

const ProductStoreContext = createContext<ProductStoreContextValue | null>(null);

export function ProductStoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshProducts = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const remoteProducts = await fetchProductsFromApi();

      if (remoteProducts.length > 0) {
        setProducts(remoteProducts);
        setIsLoading(false);
        return;
      }

      const seededProducts = seedProducts;
      if (seededProducts.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const bootstrappedProducts = await bootstrapProductsInApi(seededProducts);
      setProducts(bootstrappedProducts.length > 0 ? bootstrappedProducts : seededProducts);
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'products_load_failed';
      setLoadError(errorCode);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshProducts();
  }, []);

  const value = useMemo<ProductStoreContextValue>(
    () => ({
      products,
      isLoading,
      loadError,
      refreshProducts,
      async addProduct(product) {
        try {
          const createdProduct = await createProductInApi(product);
          setProducts((currentProducts) => [createdProduct, ...currentProducts]);
          return { success: true };
        } catch (error) {
          return { success: false, error: normalizeProductStoreError(error, 'products_create_failed') };
        }
      },
      async updateProduct(product) {
        try {
          const updatedProduct = await updateProductInApi(product);
          setProducts((currentProducts) =>
            currentProducts.map((currentProduct) =>
              currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct
            )
          );
          return { success: true };
        } catch (error) {
          return { success: false, error: normalizeProductStoreError(error, 'products_update_failed') };
        }
      },
      async deleteProduct(productId) {
        try {
          await deleteProductInApi(productId);
          setProducts((currentProducts) => currentProducts.filter((product) => product.id !== productId));
          return { success: true };
        } catch (error) {
          return { success: false, error: normalizeProductStoreError(error, 'products_delete_failed') };
        }
      },
    }),
    [isLoading, loadError, products]
  );

  return <ProductStoreContext.Provider value={value}>{children}</ProductStoreContext.Provider>;
}

export function useProductStore() {
  const context = useContext(ProductStoreContext);

  if (!context) {
    throw new Error('useProductStore must be used inside ProductStoreProvider');
  }

  return context;
}
