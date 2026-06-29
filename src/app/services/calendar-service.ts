import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { STORAGE_KEYS } from '../constants/app.constants';

export interface EventoDTO {
  id?: number;
  userId: number;
  type: string;
  title: string;
  description: string;
  eventDatetime: string;
  eventEndDatetime?: string;
  location?: string;
  patientId?: number;
  isRecurring: boolean;
  googleEventId?: string;
  patientGoogleEventId?: string;
  sincronizarConGoogle: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private apiUrl = `${environment.apiUrl}/api/v1/calendar/events`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getEvents(): Observable<EventoDTO[]> {
    return this.http.get<EventoDTO[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  createEvent(evento: EventoDTO): Observable<EventoDTO> {
    return this.http.post<EventoDTO>(this.apiUrl, evento, { headers: this.getHeaders() });
  }

  syncEventWithGoogle(id: number): Observable<EventoDTO> {
    return this.http.post<EventoDTO>(`${this.apiUrl}/${id}/sync`, {}, { headers: this.getHeaders() });
  }

  getAuthUrl(id: number, userId: number): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${environment.apiUrl}/api/v1/calendar/auth-url/${id}/${userId}`, { headers: this.getHeaders() });
  }

  checkSyncStatus(id: number, userId: number): Observable<{ synced: boolean }> {
    return this.http.get<{ synced: boolean }>(`${environment.apiUrl}/api/v1/calendar/events/${id}/status/${userId}`, { headers: this.getHeaders() });
  }
}
