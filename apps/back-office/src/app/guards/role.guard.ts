import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.currentUserRole() ?? (authService.getToken() ? 'User' : null);

  if (!role) {
    router.navigate(['/login']);
    return false;
  }

  const requiredRoles: string[] | undefined = route.data?.['roles'];
  if (requiredRoles && !requiredRoles.includes(role)) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
