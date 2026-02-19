/**
 * Protected Route Component
 * Wrapper component that restricts access to authenticated users (and optionally specific roles).
 * Redirects to login page if user is not authenticated.
 */

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '~/contexts/auth-context';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';

/**
 * Protected route props
 */
interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * Whether authentication is required (default: true)
   */
  requireAuth?: boolean;
  /**
   * Required user roles (if empty, any authenticated user can access)
   */
  roles?: string[];
  /**
   * Redirect path when authentication fails (default: '/login')
   */
  redirectTo?: string;
  /**
   * Whether to show loading spinner while checking authentication
   */
  showLoading?: boolean;
}

/**
 * Protected route component
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  roles = [],
  redirectTo = '/login',
  showLoading = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Check if user has required roles
  const hasRequiredRole = roles.length === 0 || (user && roles.includes(user.role));

  // Redirect logic (Client-side only)
  useEffect(() => {
    // Only redirect if we're done loading and authentication is required but not satisfied
    if (!isLoading && requireAuth && (!isAuthenticated || !hasRequiredRole)) {
      // Store the attempted location for post-login redirect
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
  }, [isLoading, isAuthenticated, hasRequiredRole, requireAuth, location.pathname]);

  // If authentication is NOT required (like on Login page), render children immediately
  // This ensures the login page is visible during SSR and initial hydration
  if (!requireAuth) {
    // If user is already authenticated and trying to access a guest-only page, redirect to home
    if (isAuthenticated && !isLoading) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  }

  // Show loading spinner while checking auth status for protected routes
  if (isLoading && showLoading) {
    return (
      <div className="flex-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check authentication for protected routes
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check roles for protected routes
  if (!hasRequiredRole) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has required roles
  return <>{children}</>;
}

/**
 * Helper component for role-based protection
 */
interface RoleProtectedRouteProps extends Omit<ProtectedRouteProps, 'requireAuth'> {
  /**
   * Required role(s) - single role or array of roles
   */
  role: string | string[];
}

export function RoleProtectedRoute({ role, ...props }: RoleProtectedRouteProps) {
  const roles = Array.isArray(role) ? role : [role];
  return <ProtectedRoute {...props} roles={roles} />;
}

/**
 * Helper component for admin-only routes
 */
export function AdminProtectedRoute(props: Omit<ProtectedRouteProps, 'roles'>) {
  return <ProtectedRoute {...props} roles={['Admin']} />;
}