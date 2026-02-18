/**
 * React Query Configuration
 * Query client configuration and default options.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create query client with default options
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time (data considered fresh for 30 seconds)
      staleTime: 30 * 1000,
      // Cache time (data remains in cache for 5 minutes after becoming inactive)
      gcTime: 5 * 60 * 1000,
      // Retry failed queries 3 times
      retry: 3,
      // Don't retry on 4xx errors (client errors)
      retryOnMount: false,
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: 'always',
      // Don't refetch on reconnect
      refetchOnReconnect: false,
      // Throw errors to be caught by error boundaries
      throwOnError: false,
    },
    mutations: {
      // Retry failed mutations 3 times
      retry: 3,
      // Don't retry on 4xx errors
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

/**
 * Query keys factory for consistent key generation
 */
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: { userId?: string } = {}) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
    saga: (id: string) => [...queryKeys.orders.detail(id), 'saga'] as const,
  },
  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (filters: { userId?: string; orderId?: string } = {}) => [...queryKeys.payments.lists(), filters] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
  },
} as const;