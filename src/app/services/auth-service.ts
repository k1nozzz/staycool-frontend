import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { STORAGE_KEYS } from '../constants/app.constants';

export interface LoginResponse {
  token: string;
  userId: number;
  userName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly API_URL = `${environment.apiUrl}/api/v1/auth`;

  constructor(private http: HttpClient) { }

  register(data: any): Observable<any> {
    return this.http.post(`${this.API_URL}/register`, data);
  }

  /**
   * Envía las credenciales al backend para iniciar sesión.
   * Guarda el token en el LocalStorage automáticamente si es exitoso.
   */
  login(email: string, password: string): Observable<LoginResponse> {
    const payload = { email, password };
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, payload).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, response.token);
          localStorage.setItem(STORAGE_KEYS.USER_ID, response.userId.toString());
          if (response.userName) {
            localStorage.setItem(STORAGE_KEYS.USER_NAME, response.userName);
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
  }

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private decodeTokenPayload(): any {
    const token = this.getToken();
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64);
      return JSON.parse(decodedJson);
    } catch (e) {
      return null;
    }
  }

  getUserRole(): string | null {
    const payload = this.decodeTokenPayload();
    return payload ? payload.role : null;
  }

  getUserId(): number | null {
    const idStr = localStorage.getItem(STORAGE_KEYS.USER_ID);
    return idStr ? parseInt(idStr, 10) : null;
  }

  getUserName(): string | null {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME);
  }

  getProfilePictureUrl(): string | null {
    return localStorage.getItem('PROFILE_PIC_URL');
  }

  setProfilePictureUrl(url: string | null): void {
    if (url) {
      localStorage.setItem('PROFILE_PIC_URL', url);
    } else {
      localStorage.removeItem('PROFILE_PIC_URL');
    }
  }
}
