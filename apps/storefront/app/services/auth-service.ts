/**
 * Authentication Service
 * Handles user authentication, token storage, and session management.
 */

import { apiClient, ApiError } from './api-client';
import { STORAGE_KEYS } from '~/constants';

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Registration data
 */
export interface RegisterData {
  username: string;
  password: string;
  confirmPassword?: string;
  role?: string;
}

/**
 * Auth user data (decoded from JWT token)
 */
export interface AuthUser {
  id: string;
  username: string;
  role: string;
  exp?: number;
  iat?: number;
}

/**
 * Authentication service class
 */
export class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: AuthUser | null = null;

  private constructor() {
    this.loadTokenFromStorage();
    this.decodeToken();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Load token from localStorage
   */
  private loadTokenFromStorage(): void {
    if (typeof window === 'undefined') return;
    this.token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Save token to localStorage
   */
  private saveTokenToStorage(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    this.token = token;
  }

  /**
   * Remove token from localStorage
   */
  private removeTokenFromStorage(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    this.token = null;
  }

  /**
   * Decode JWT token to extract user information
   */
  private decodeToken(): void {
    if (!this.token || typeof window === 'undefined') {
      this.user = null;
      return;
    }

    try {
      const payload = this.token.split('.')[1];
      if (!payload) throw new Error('Invalid token format');
      // Use window.atob safely
      const decoded = JSON.parse(window.atob(payload));
      this.user = {
        id: decoded.user_id || decoded.sub,
        username: decoded.sub,
        role: decoded.role || 'USER',
        exp: decoded.exp,
        iat: decoded.iat,
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      this.user = null;
      // Invalid token, remove it
      this.removeTokenFromStorage();
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(): boolean {
    if (!this.user?.exp || typeof window === 'undefined') return false;
    const currentTime = Math.floor(Date.now() / 1000);
    return this.user.exp < currentTime;
  }

  /**
   * Login with username and password
   */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      const response = await apiClient.login(credentials);

      if (!response.success || !response.data?.token) {
        throw new ApiError('Login failed', 401, 'LOGIN_FAILED');
      }

      const { token } = response.data;
      this.saveTokenToStorage(token);
      this.decodeToken();

      if (!this.user) {
        throw new ApiError('Failed to decode user from token', 401, 'INVALID_TOKEN');
      }

      return this.user;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Login failed due to network error', 0, 'NETWORK_ERROR');
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ id: number; username: string; role: string }> {
    // Basic validation
    if (data.password !== data.confirmPassword) {
      throw new ApiError('Passwords do not match', 400, 'PASSWORD_MISMATCH');
    }

    try {
      const response = await apiClient.register({
        username: data.username,
        password: data.password,
        role: data.role,
      });

      if (!response.success || !response.data) {
        throw new ApiError('Registration failed', 400, 'REGISTRATION_FAILED');
      }

      return response.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Registration failed due to network error', 0, 'NETWORK_ERROR');
    }
  }

  /**
   * Logout current user
   */
  logout(): void {
    this.removeTokenFromStorage();
    this.user = null;
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get current authenticated user
   */
  getUser(): AuthUser | null {
    // Check token expiration
    if (this.isTokenExpired()) {
      this.logout();
      return null;
    }
    return this.user;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getUser();
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    const user = this.getUser();
    return user?.role === role;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const user = this.getUser();
    return roles.some(role => user?.role === role);
  }

  /**
   * Refresh token (placeholder for future implementation)
   */
  async refreshToken(): Promise<void> {
    // TODO: Implement token refresh when backend supports it
    throw new ApiError('Token refresh not implemented', 501, 'NOT_IMPLEMENTED');
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();