import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '@/types/product';
import {
  bootstrapProductsInApi,
  createProductInApi,
  deleteProductInApi,
  fetchProductsFromApi,
  updateProductInApi,
} from '@/lib/products-api';
import { getInitialProductCatalog, saveCachedProducts } from '@/utils/storage';

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
  const initialProducts = useMemo(() => getInitialProductCatalog(), []);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(initialProducts.length === 0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasProductsRef = useRef(initialProducts.length > 0);

  useEffect(() => {
    hasProductsRef.current = products.length > 0;
  }, [products.length]);

  const refreshProducts = useCallback(async () => {
    setIsLoading((currentIsLoading) => currentIsLoading || !hasProductsRef.current);
    setLoadError(null);

    try {
      const remoteProducts = await fetchProductsFromApi();

      if (remoteProducts.length > 0) {
        const cachedProducts = saveCachedProducts(remoteProducts);
        setProducts(cachedProducts);
        setIsLoading(false);
        return;
      }

      const seededProducts = initialProducts;
      if (seededProducts.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const bootstrappedProducts = await bootstrapProductsInApi(seededProducts);
      const nextProducts = bootstrappedProducts.length > 0 ? bootstrappedProducts : seededProducts;
      setProducts(saveCachedProducts(nextProducts));
    } catch (error) {
      const errorCode = error instanceof Error ? error.message : 'products_load_failed';
      if (!hasProductsRef.current) {
        setLoadError(errorCode);
        setProducts(initialProducts);
      }
    } finally {
      setIsLoading(false);
    }
  }, [initialProducts]);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  const value = useMemo<ProductStoreContextValue>(
    () => ({
      products,
      isLoading,
      loadError,
      refreshProducts,
      async addProduct(product) {
        try {
          const createdProduct = await createProductInApi(product);
          setProducts((currentProducts) => {
            const nextProducts = [createdProduct, ...currentProducts];
            saveCachedProducts(nextProducts);
            return nextProducts;
          });
          return { success: true };
        } catch (error) {
          return { success: false, error: normalizeProductStoreError(error, 'products_create_failed') };
        }
      },
      async updateProduct(product) {
        try {
          const updatedProduct = await updateProductInApi(product);
          setProducts((currentProducts) => {
            const nextProducts = currentProducts.map((currentProduct) =>
              currentProduct.id === updatedProduct.id ? updatedProduct : currentProduct
            );
            saveCachedProducts(nextProducts);
            return nextProducts;
          });
          return { success: true };
        } catch (error) {
          return { success: false, error: normalizeProductStoreError(error, 'products_update_failed') };
        }
      },
      async deleteProduct(productId) {
        try {
          await deleteProductInApi(productId);
          setProducts((currentProducts) => {
            const nextProducts = currentProducts.filter((product) => product.id !== productId);
            saveCachedProducts(nextProducts);
            return nextProducts;
          });
          return { success: true };
        } catch (error) {
          return { success: false, error: normalizeProductStoreError(error, 'products_delete_failed') };
        }
      },
    }),
    [isLoading, loadError, products, refreshProducts]
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
