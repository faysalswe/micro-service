/**
 * API Client Service
 * Centralized HTTP client for making requests to the backend microservices via Kong Gateway.
 * Handles authentication token injection, error handling, retries, idempotency keys, and correlation IDs.
 */

import { API_ENDPOINTS } from '~/constants';
import { STORAGE_KEYS } from '~/constants';
import type { ApiResponse } from '~/types';
import { logger } from '~/lib/logger';

/**
 * API client configuration
 */
interface ApiClientConfig {
  baseUrl?: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

/**
 * Request options extending standard RequestInit
 */
interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  idempotencyKey?: string;
  correlationId?: string;
  baseUrl?: string;
}

/**
 * API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API Client class
 */
export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;
  private getToken: () => string | null;
  private onUnauthorized: () => void;

  private constructor(config: ApiClientConfig = {}) {
    // Determine base URL: window.ENV.API_URL (injected by server) or empty string for proxy
    this.baseUrl = config.baseUrl || this.getBaseUrl();
    this.getToken = config.getToken || (() => localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN));
    this.onUnauthorized = config.onUnauthorized || (() => {
      console.warn('Unauthorized request detected');
      // In a real app, this would redirect to login
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: ApiClientConfig): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient(config);
    }
    return ApiClient.instance;
  }

  /**
   * Get base URL from environment
   */
  private getBaseUrl(): string {
    // Server injects API_URL via window.ENV
    if (typeof window !== 'undefined' && (window as any).ENV?.API_URL) {
      return (window as any).ENV.API_URL;
    }
    // Empty string for development with Vite proxy
    return '';
  }

  /**
   * Make an HTTP request with authentication and error handling
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      skipAuth = false,
      idempotencyKey,
      correlationId = this.generateCorrelationId(),
      baseUrl,
      ...fetchOptions
    } = options;

    // Build headers
    const headers = new Headers(fetchOptions.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');

    // Add correlation ID for tracing
    headers.set('X-Correlation-ID', correlationId);

    // Add idempotency key if provided
    if (idempotencyKey) {
      headers.set('X-Idempotency-Key', idempotencyKey);
    }

    // Add authentication token if available and not skipped
    if (!skipAuth) {
      const token = this.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    // Build full URL
    const base = baseUrl || this.baseUrl;
    const url = `${base}${endpoint}`;

    // Capture payload for logging
    let payload: any = undefined;
    if (fetchOptions.body) {
      try {
        payload = JSON.parse(fetchOptions.body as string);
      } catch {
        payload = fetchOptions.body;
      }
    }

    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      // Parse response
      const data = await this.parseResponse(response);
      const duration = Date.now() - startTime;

      logger.logApiCall({
        method: fetchOptions.method || 'GET',
        url,
        payload,
        response: data,
        status: response.status,
        statusText: response.statusText,
        duration,
      });

      // Handle non-2xx status codes
      if (!response.ok) {
        // Special handling for 401 Unauthorized
        if (response.status === 401) {
          this.onUnauthorized();
        }

        throw new ApiError(
          data?.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          data?.code,
          data?.details
        );
      }

      // Success response
      return {
        success: true,
        data,
        message: data?.message,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const apiError = error instanceof ApiError ? error : new ApiError(
        error instanceof Error ? error.message : 'Network request failed',
        0,
        'NETWORK_ERROR'
      );

      logger.logApiCall({
        method: fetchOptions.method || 'GET',
        url,
        payload,
        error: apiError,
        status: apiError.statusCode,
        statusText: apiError.message,
        duration,
      });

      throw apiError;
    }
  }

  /**
   * Parse JSON response, handle empty responses
   */
  private async parseResponse(response: Response): Promise<any> {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return null;
    }

    // Fallback to text
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * Generate a correlation ID (UUID v4)
   */
  private generateCorrelationId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Convenience methods

  async get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T = unknown>(endpoint: string, body?: any, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Pre-configured endpoint methods

  // Auth endpoints
  async login(credentials: { username: string; password: string }) {
    return this.post<{ token: string }>(API_ENDPOINTS.AUTH.LOGIN, credentials, {
      skipAuth: true,
    });
  }

  async register(userData: { username: string; password: string; role?: string }) {
    return this.post<{ id: number; username: string; role: string }>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData,
      { skipAuth: true }
    );
  }

  // Order endpoints
  async getOrders(userId?: string) {
    const endpoint = userId ? `${API_ENDPOINTS.ORDERS.LIST}?userId=${encodeURIComponent(userId)}` : API_ENDPOINTS.ORDERS.LIST;
    return this.get(endpoint);
  }

  async getOrder(id: string) {
    return this.get(API_ENDPOINTS.ORDERS.DETAIL(id));
  }

  async createOrder(orderData: { userId: string; productId: string; amount: number }) {
    return this.post(API_ENDPOINTS.ORDERS.CREATE, orderData);
  }

  async cancelOrder(id: string) {
    return this.delete(API_ENDPOINTS.ORDERS.CANCEL(id));
  }

  async getOrderSaga(id: string) {
    return this.get(API_ENDPOINTS.ORDERS.SAGA(id));
  }

  // Payment endpoints
  async getPayments(filters?: { userId?: string; orderId?: string }) {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.orderId) params.append('orderId', filters.orderId);

    const query = params.toString();
    const endpoint = query ? `${API_ENDPOINTS.PAYMENTS.LIST}?${query}` : API_ENDPOINTS.PAYMENTS.LIST;
    return this.get(endpoint);
  }

  async getPayment(id: string) {
    return this.get(API_ENDPOINTS.PAYMENTS.DETAIL(id));
  }

  async refundPayment(id: string, reason?: string) {
    return this.post(API_ENDPOINTS.PAYMENTS.REFUND(id), { reason });
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();