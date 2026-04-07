import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated at all
  const role = authService.currentUserRole();

  if (role) {
    return true;
  }

  // Double check if token exists but role hasn't updated yet (race condition)
  const token = authService.getToken();
  if (token) {
    // If token exists, we can try to reload it or just trust it for this turn
    // This handles the case where navigation happens immediately after setToken
    return true;
  }

  // If not authenticated, redirect to login
  console.warn('Access Denied: No valid session. Redirecting to login.');
  router.navigate(['/login']);
  return false;
};
