import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated at all
  const role = authService.currentUserRole();
  
  if (role) {
    // If they have a role, we consider them authenticated for this specific app
    // as per the user's request that this app is for a specific role
    return true;
  }

  // If not authenticated, redirect to login
  console.warn('Access Denied: No valid role found in token. Redirecting to login.');
  router.navigate(['/login']);
  return false;
};
