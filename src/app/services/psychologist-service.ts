import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { STORAGE_KEYS } from '../constants/app.constants';

export interface PsicologoDashboardDTO {
  totalPacientes: number;
  alertasPendientes: number;
  promedioUsoApp: string;
  tendenciaUsoSemanal: number[];
  porcentajeUsoRedes: number;
  porcentajeHorasSueno: number;
  porcentajeUsoNocturno: number;
}

export interface PatientMonitoreoDTO {
  pacienteId: number;
  nombrePaciente: string;
  estado: string;
  ultimaActividad: string;
  tendencia: string;
  profilePictureUrl?: string;
}

export interface ActividadRecienteDTO {
  titulo: string;
  descripcion: string;
  fechaHora: string;
}

export interface ActividadEmocional {
  emocion: string;
  notas: string;
  fecha: string;
}

export interface PatientDetailDTO {
  pacienteId: number;
  nombre: string;
  edad: number;
  fechaIngreso: string;
  estadoAlerta: string;
  notasClinicas: string;
  historialEmocional: number[];
  historialHorasSueno: number[];
  historialUsoRedes: number[];
  actividadReciente: ActividadRecienteDTO[];
  historialEmocionalDetallado: ActividadEmocional[];
  rachaActual: number;
  logrosDesbloqueados: string[];
  metaDiaria?: number;
}

export interface SolicitudDTO {
  id: number;
  pacienteId: number;
  pacienteNombre: string;
  pacienteFotoUrl?: string;
  mensaje: string;
  fecha: string;
}

export interface AlertaDTO {
  id: number;
  receptorId: number;
  emisorAlertaId: number;
  tipo: string;
  mensaje: string;
  leido: boolean;
  fechaCreacion: string;
  patientId: number;
  alertLevel: string;
  excessMinutes: number;
}

@Injectable({
  providedIn: 'root'
})
export class PsychologistService {
  private apiUrl = `${environment.apiUrl}/api/v1/psychologist`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getDashboardMetrics(psychologistId: number): Observable<PsicologoDashboardDTO> {
    return this.http.get<PsicologoDashboardDTO>(`${this.apiUrl}/dashboard/metrics?psicologoId=${psychologistId}`, { headers: this.getHeaders() });
  }

  getMonitoredPatients(psychologistId: number): Observable<PatientMonitoreoDTO[]> {
    return this.http.get<PatientMonitoreoDTO[]>(`${this.apiUrl}/patients/monitoring?psicologoId=${psychologistId}`, { headers: this.getHeaders() });
  }

  getCriticalAlerts(psychologistId: number): Observable<AlertaDTO[]> {
    return this.http.get<AlertaDTO[]>(`${this.apiUrl}/alerts/critical?psychologistId=${psychologistId}`, { headers: this.getHeaders() });
  }

  getPatientDetails(psychologistId: number, patientId: number): Observable<PatientDetailDTO> {
    return this.http.get<PatientDetailDTO>(`${this.apiUrl}/patients/${patientId}/details?psicologoId=${psychologistId}`, { headers: this.getHeaders() });
  }

  savePatientNotes(psychologistId: number, patientId: number, notes: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/patients/${patientId}/notes?psicologoId=${psychologistId}`, { notes }, { headers: this.getHeaders(), responseType: 'text' });
  }

  exportPatientPdf(psychologistId: number, patientId: number): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/patients/${patientId}/export/pdf?psicologoId=${psychologistId}`, {}, { headers: this.getHeaders(), responseType: 'blob' });
  }

  getPendingRequests(psychologistId: number): Observable<SolicitudDTO[]> {
    return this.http.get<SolicitudDTO[]>(`${this.apiUrl}/requests?psicologoId=${psychologistId}`, { headers: this.getHeaders() });
  }

  acceptRequest(solicitudId: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/requests/${solicitudId}/accept`, {}, { headers: this.getHeaders(), responseType: 'text' });
  }

  rejectRequest(solicitudId: number): Observable<string> {
    return this.http.put(`${this.apiUrl}/requests/${solicitudId}/reject`, {}, { headers: this.getHeaders(), responseType: 'text' });
  }
}
