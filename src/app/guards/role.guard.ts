import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { ROLES, ROUTES } from '../constants/app.constants';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['expectedRoles'] as string[];
  const userRole = authService.getUserRole();

  if (authService.isAuthenticated() && expectedRoles && userRole && expectedRoles.includes(userRole)) {
    return true;
  } else {
    if (!authService.isAuthenticated()) {
      router.navigate([ROUTES.LOGIN]);
    } else {
      if (userRole && ROLES.PATIENT.includes(userRole as any)) {
        router.navigate([ROUTES.PATIENT_DASHBOARD]);
      } else if (userRole && ROLES.PSYCHOLOGIST.includes(userRole as any)) {
        router.navigate([ROUTES.PSYCH_DASHBOARD]);
      } else {
        router.navigate([ROUTES.LOGIN]);
      }
    }
    return false;
  }
};
