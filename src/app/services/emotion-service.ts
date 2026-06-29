import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth-service';

export interface EmotionLogRequest {
  usuario: {
    id: number;
  };
  tipoEmocion: string;
  notasEmocion: string;
  minutosActivos: number;
  minutosDescanso: number;
}

@Injectable({
  providedIn: 'root'
})
export class EmotionService {
  private readonly API_URL = `${environment.apiUrl}/api/v1/emotions`;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  logEmotion(data: EmotionLogRequest): Observable<any> {
    return this.http.post(`${this.API_URL}/log`, data, { headers: this.getHeaders() });
  }

  saveDailyMetrics(payload: any): Observable<any> {
    return this.http.post(`${this.API_URL}/metrics`, payload, { headers: this.getHeaders() });
  }

  getGamificationStatus(userId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/gamification/status?usuarioId=${userId}&t=${new Date().getTime()}`, { headers: this.getHeaders() });
  }

  getAchievements(userId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/users/${userId}/achievements?t=${new Date().getTime()}`, { headers: this.getHeaders() });
  }

  getLogs(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/logs/${userId}?t=${new Date().getTime()}`, { headers: this.getHeaders() });
  }

  saveDailyGoal(userId: number, targetMinutes: number): Observable<any> {
    return this.http.post(`${this.API_URL}/goals/daily?usuarioId=${userId}`, { dailyGoalMinutes: targetMinutes }, { headers: this.getHeaders() });
  }

  getDailyGoal(userId: number): Observable<any> {
    return this.http.get(`${this.API_URL}/goals/daily?usuarioId=${userId}&t=${new Date().getTime()}`, { headers: this.getHeaders() });
  }
}
