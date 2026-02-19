import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  // Redirect to a public page or login if not admin
  // For now, we'll just block access
  alert('Access Denied: You must be an Admin to access this tool.');
  return false;
};
