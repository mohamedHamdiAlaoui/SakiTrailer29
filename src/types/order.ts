export type OrderStatus = 'created' | 'assigned' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  productId?: string;
  notes?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUS_OPTIONS: OrderStatus[] = ['created', 'assigned', 'in_progress', 'ready', 'delivered', 'cancelled'];
