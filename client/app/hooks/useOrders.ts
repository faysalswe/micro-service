/**
 * Orders Data Hook
 * Custom hooks for fetching and managing orders data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/services/api-client';
import { queryKeys } from '~/lib/react-query';

/**
 * Order data interface (adjust based on actual API response)
 */
export interface Order {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

/**
 * Hook to fetch orders list
 */
export function useOrders(userId?: string) {
  return useQuery({
    queryKey: queryKeys.orders.list({ userId }),
    queryFn: async () => {
      const response = await apiClient.getOrders(userId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch orders');
      }
      return response.data as Order[];
    },
    enabled: !!userId, // Only fetch if userId is provided
  });
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: async () => {
      const response = await apiClient.getOrder(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch order');
      }
      return response.data as Order;
    },
    enabled: !!id, // Only fetch if ID is provided
  });
}

/**
 * Hook to create a new order
 */
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: { userId: string; productId: string; amount: number }) => {
      const response = await apiClient.createOrder(orderData);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create order');
      }
      return response.data as Order;
    },
    onSuccess: () => {
      // Invalidate orders list query to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/**
 * Hook to cancel an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.cancelOrder(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel order');
      }
      return response.data as { success: boolean; message?: string };
    },
    onSuccess: (_, id) => {
      // Invalidate both the specific order and the list
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.lists() });
    },
  });
}

/**
 * Hook to fetch order saga status
 */
export function useOrderSaga(id: string) {
  return useQuery({
    queryKey: queryKeys.orders.saga(id),
    queryFn: async () => {
      const response = await apiClient.getOrderSaga(id);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch order saga');
      }
      return response.data as { status: string; steps: Array<{ name: string; status: string }> };
    },
    enabled: !!id,
  });
}