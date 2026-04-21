export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  userId: string;
  amount: number;
  status: string;
  paymentId: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface SagaLog {
  id: string;
  step: string;
  status: string;
  payload: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}
