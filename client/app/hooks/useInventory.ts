/**
 * Inventory Hook
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '~/services/api-client';

export interface ProductInfo {
  productID: string;
  name: string;
  price: number;
  quantity: number;
}

export function useInventory() {
  return useQuery({
    queryKey: ['inventory', 'list'],
    queryFn: async () => {
      const response = await apiClient.getInventory();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch inventory');
      }
      return response.data as ProductInfo[];
    },
  });
}
