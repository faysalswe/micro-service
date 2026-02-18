/**
 * Protected Route Component
 * Wrapper component that restricts access to authenticated users (and optionally specific roles).
 * Redirects to login page if user is not authenticated.
 */

import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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

  // Redirect logic
  useEffect(() => {
    // Only redirect if we're done loading and authentication is required but not satisfied
    if (!isLoading && requireAuth && (!isAuthenticated || !hasRequiredRole)) {
      // You could store the attempted location for post-login redirect
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
  }, [isLoading, isAuthenticated, hasRequiredRole, requireAuth, location]);

  // Show loading spinner
  if (isLoading && showLoading) {
    return (
      <div className="flex-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If authentication is not required, render children regardless
  if (!requireAuth) {
    return <>{children}</>;
  }

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check roles
  if (!hasRequiredRole) {
    // Optionally redirect to unauthorized page
    return <Navigate to="/unauthorized" state={{ from: location }} replace />;
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