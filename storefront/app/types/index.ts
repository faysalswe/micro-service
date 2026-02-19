/**
 * Shared TypeScript Types and Interfaces
 */

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';

/**
 * Supported languages
 */
export type Language = 'en' | 'bn' | 'de';

/**
 * User role enum
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

/**
 * API error interface
 */
export interface ApiError {
  code?: string;
  message: string;
  details?: Record<string, string[]>;
  statusCode: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

/**
 * Form validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Component base props
 */
export interface BaseComponentProps {
  className?: string;
  testId?: string;
}

/**
 * Route meta information
 */
export interface RouteMeta {
  title: string;
  description?: string;
  requiresAuth?: boolean;
  roles?: UserRole[];
}

/**
 * Order interface
 */
export interface Order {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  quantity: number;
  status: string;
  createdAt: string;
  paymentId?: string;
}

/**
 * Create Order Request
 */
export interface CreateOrderRequest {
  productId: string;
  amount: number;
  quantity: number;
}
