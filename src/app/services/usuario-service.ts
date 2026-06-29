import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { STORAGE_KEYS } from '../constants/app.constants';

export interface UsuarioDTO {
  id: number;
  name: string;
  email: string;
  rolId: number;
  totalPoints?: number;
  dailyGoalMinutes?: number;
  profilePictureUrl?: string;
  specialty?: string;
  age?: number;
  clinicName?: string;
}

export interface UsuarioUpdateDTO {
  name: string;
  email: string;
  specialty?: string;
  age?: number;
  profilePictureUrl?: string;
  pauseThresholdMinutes?: number;
  dailyGoalMinutes?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private readonly API_URL = `${environment.apiUrl}/api/v1/users`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getUserById(id: number): Observable<UsuarioDTO> {
    return this.http.get<UsuarioDTO>(`${this.API_URL}/${id}`, { headers: this.getHeaders() });
  }

  updateProfile(id: number, data: UsuarioUpdateDTO): Observable<UsuarioDTO> {
    return this.http.put<UsuarioDTO>(`${this.API_URL}/${id}/profile`, data, { headers: this.getHeaders() });
  }

  changePassword(id: number, data: any): Observable<void> {
    return this.http.put<void>(`${this.API_URL}/${id}/password`, data, { headers: this.getHeaders() });
  }

  uploadProfilePicture(id: number, file: File): Observable<UsuarioDTO> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UsuarioDTO>(`${this.API_URL}/${id}/profile-picture`, formData, { headers: this.getHeaders() });
  }

  deleteProfilePicture(id: number): Observable<UsuarioDTO> {
    return this.http.delete<UsuarioDTO>(`${this.API_URL}/${id}/profile-picture`, { headers: this.getHeaders() });
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`, { headers: this.getHeaders() });
  }

  getPsychologistsDirectory(): Observable<UsuarioDTO[]> {
    return this.http.get<UsuarioDTO[]>(`${this.API_URL}/psychologists/directory`, { headers: this.getHeaders() });
  }

  assignPatientToPsychologist(psychologistId: number, patientId: number, mensajeSolicitud?: string): Observable<string> {
    const body = mensajeSolicitud ? { mensajeSolicitud } : {};
    return this.http.post(`${environment.apiUrl}/api/v1/psychologist/assign-patient?psicologoId=${psychologistId}&pacienteId=${patientId}`, body, { headers: this.getHeaders(), responseType: 'text' });
  }
}
