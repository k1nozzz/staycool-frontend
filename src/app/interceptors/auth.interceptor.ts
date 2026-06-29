import { HttpInterceptorFn } from '@angular/common/http';
import { STORAGE_KEYS } from '../constants/app.constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Omitir endpoints de autenticación o los que no requieran token
  if (req.url.includes('/api/v1/auth/login') || req.url.includes('/api/v1/auth/register')) {
    return next(req);
  }

  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  
  return next(req);
};
