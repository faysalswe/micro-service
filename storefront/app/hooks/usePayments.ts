/**
 * Payments Data Hook
 * Custom hooks for fetching and managing payments data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/services/api-client';
import { queryKeys } from '~/lib/react-query';

/**
 * Payment data interface (adjust based on actual API response)
 */
export interface Payment {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch payments list
 */
export function usePayments(filters?: { userId?: string; orderId?: string }) {
  return useQuery({
    queryKey: queryKeys.payments.list(filters),
    queryFn: async () => {
      const response = await apiClient.getPayments(filters);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch payments');
      }
      return response.data as Payment[];
    },
    enabled: !!filters?.userId, // Only fetch if userId is provided (or allow empty filters for admin?)
  });
}

/**
 * Hook to fetch a single payment by ID
 */
export function usePayment(id: string) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: async () => {
      const response = await apiClient.getPayment(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch payment');
      }
      return response.data as Payment;
    },
    enabled: !!id,
  });
}

/**
 * Hook to refund a payment
 */
export function useRefundPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await apiClient.refundPayment(id, reason);
      if (!response.success) {
        throw new Error(response.message || 'Failed to refund payment');
      }
      return response.data as { success: boolean; message?: string };
    },
    onSuccess: (_, { id }) => {
      // Invalidate both the specific payment and the list
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
    },
  });
}