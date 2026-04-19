import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Order } from '@/types/order';
import { createOrderInApi, fetchOrdersFromApi, updateOrderInApi, type CreateOrderInput, type UpdateOrderInput } from '@/lib/orders-api';
import { useAuth } from '@/context/AuthContext';

type OrderError =
  | 'duplicate_order_number'
  | 'invalid_order_number'
  | 'invalid_order_status'
  | 'order_not_found'
  | 'user_not_found'
  | 'backend_unreachable'
  | 'forbidden'
  | 'unauthorized';

interface OrderActionResult {
  success: boolean;
  error?: OrderError;
  order?: Order;
}

interface OrderContextValue {
  orders: Order[];
  isLoading: boolean;
  loadError: string | null;
  refreshOrders: () => Promise<void>;
  createOrder: (input: CreateOrderInput) => Promise<OrderActionResult>;
  updateOrder: (orderId: string, input: UpdateOrderInput) => Promise<OrderActionResult>;
  findOrderByNumber: (orderNumber: string) => Order | null;
  getOrdersForUser: (userId: string) => Order[];
}

const OrderContext = createContext<OrderContextValue | null>(null);

function normalizeOrderNumber(orderNumber: string) {
  return orderNumber.trim().toUpperCase();
}

function sortOrdersByUpdateDate(orders: Order[]) {
  return [...orders].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
}

function normalizeOrderError(error: unknown, fallback: OrderError): OrderError {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const normalized = error.message.toLowerCase();
  if (normalized.includes('failed to fetch') || normalized.includes('econnrefused')) {
    return 'backend_unreachable';
  }

  switch (normalized) {
    case 'duplicate_order_number':
    case 'invalid_order_number':
    case 'invalid_order_status':
    case 'order_not_found':
    case 'user_not_found':
    case 'forbidden':
    case 'unauthorized':
      return normalized;
    default:
      return fallback;
  }
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const nextOrders = await fetchOrdersFromApi();
      setOrders(sortOrdersByUpdateDate(nextOrders));
    } catch (error) {
      setOrders([]);
      setLoadError(error instanceof Error ? error.message : 'orders_load_failed');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    void refreshOrders();
  }, [isAuthLoading, refreshOrders, user?.id]);

  const value = useMemo<OrderContextValue>(
    () => ({
      orders,
      isLoading,
      loadError,
      refreshOrders,
      async createOrder(input) {
        try {
          const nextOrder = await createOrderInApi(input);
          setOrders((currentOrders) => sortOrdersByUpdateDate([nextOrder, ...currentOrders]));
          return { success: true, order: nextOrder };
        } catch (error) {
          return { success: false, error: normalizeOrderError(error, 'backend_unreachable') };
        }
      },
      async updateOrder(orderId, input) {
        try {
          const nextOrder = await updateOrderInApi(orderId, input);
          setOrders((currentOrders) =>
            sortOrdersByUpdateDate(
              currentOrders.map((order) => (order.id === orderId ? nextOrder : order))
            )
          );
          return { success: true, order: nextOrder };
        } catch (error) {
          return { success: false, error: normalizeOrderError(error, 'backend_unreachable') };
        }
      },
      findOrderByNumber(orderNumber) {
        const normalizedOrderNumber = normalizeOrderNumber(orderNumber);
        if (!normalizedOrderNumber) {
          return null;
        }

        return orders.find((order) => normalizeOrderNumber(order.orderNumber) === normalizedOrderNumber) ?? null;
      },
      getOrdersForUser(userId) {
        return sortOrdersByUpdateDate(orders.filter((order) => order.userId === userId));
      },
    }),
    [isLoading, loadError, orders, refreshOrders]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrderStore() {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrderStore must be used inside OrderProvider');
  }
  return context;
}
