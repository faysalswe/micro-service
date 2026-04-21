export interface Payment {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  createdAt: string;
  refundedAt?: string;
  refundReason?: string;
}

export interface RefundResponse {
  success: boolean;
  paymentId: string;
  status: string;
  message: string;
}
