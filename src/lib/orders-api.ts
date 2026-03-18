import { createApiHeaders, getApiEndpoint } from '@/lib/api';
import type { Order, OrderStatus } from '@/types/order';

interface OrdersSuccessResponse {
  success: true;
  orders?: Order[];
  order?: Order;
}

interface OrdersErrorResponse {
  success: false;
  error: string;
}

type OrdersResponse = OrdersSuccessResponse | OrdersErrorResponse;

export interface CreateOrderInput {
  orderNumber: string;
  userId?: string;
  productId?: string;
  notes?: string;
  status?: OrderStatus;
}

export interface UpdateOrderInput {
  orderNumber?: string;
  userId?: string | null;
  productId?: string;
  notes?: string;
  status?: OrderStatus;
}

async function parseOrdersResponse(response: Response): Promise<OrdersResponse> {
  return (await response.json()) as OrdersResponse;
}

export async function fetchOrdersFromApi() {
  const response = await fetch(getApiEndpoint('/api/orders'), {
    method: 'GET',
    headers: createApiHeaders({ auth: true }),
  });

  const payload = await parseOrdersResponse(response);
  if (!response.ok || !payload.success) {
    throw new Error(payload.success ? 'orders_fetch_failed' : payload.error);
  }

  return payload.orders ?? [];
}

export async function createOrderInApi(input: CreateOrderInput) {
  const response = await fetch(getApiEndpoint('/api/orders'), {
    method: 'POST',
    headers: createApiHeaders({ auth: true, json: true }),
    body: JSON.stringify(input),
  });

  const payload = await parseOrdersResponse(response);
  if (!response.ok || !payload.success || !payload.order) {
    throw new Error(payload.success ? 'orders_create_failed' : payload.error);
  }

  return payload.order;
}

export async function updateOrderInApi(orderId: string, input: UpdateOrderInput) {
  const response = await fetch(getApiEndpoint(`/api/orders/${encodeURIComponent(orderId)}`), {
    method: 'PUT',
    headers: createApiHeaders({ auth: true, json: true }),
    body: JSON.stringify(input),
  });

  const payload = await parseOrdersResponse(response);
  if (!response.ok || !payload.success || !payload.order) {
    throw new Error(payload.success ? 'orders_update_failed' : payload.error);
  }

  return payload.order;
}
