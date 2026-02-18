/**
 * Authentication Context
 * React context for managing authentication state across the application.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthUser } from '~/services/auth-service';
import type { ApiError } from '~/services/api-client';

/**
 * Auth context state
 */
interface AuthContextState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiError | null;
}

/**
 * Auth context actions
 */
interface AuthContextActions {
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: { username: string; password: string; confirmPassword?: string; role?: string }) => Promise<{ id: number; username: string; role: string }>;
  logout: () => void;
  clearError: () => void;
}

/**
 * Combined auth context type
 */
type AuthContextType = AuthContextState & AuthContextActions;

/**
 * Create context with default values
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth provider props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Auth provider component
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthContextState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = () => {
      try {
        const user = authService.getUser();
        setState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error as ApiError,
        });
      }
    };

    initAuth();
  }, []);

  /**
   * Login function
   */
  const login = async (credentials: { username: string; password: string }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const user = await authService.login(credentials);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error as ApiError,
      });
      throw error;
    }
  };

  /**
   * Register function
   */
  const register = async (data: { username: string; password: string; confirmPassword?: string; role?: string }): Promise<{ id: number; username: string; role: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await authService.register(data);
      // Registration successful, but user is not logged in automatically
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as ApiError,
      }));
      throw error;
    }
  };

  /**
   * Logout function
   */
  const logout = () => {
    authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  /**
   * Clear error function
   */
  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: string): boolean {
  const { user } = useAuth();
  return user?.role === role;
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(roles: string[]): boolean {
  const { user } = useAuth();
  return roles.some(r => user?.role === r);
}