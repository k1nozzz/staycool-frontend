import { environment } from '../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecursoDTO } from '../models/recurso-model';

@Injectable({
  providedIn: 'root'
})
export class RecursoService {
  private apiUrl = `${environment.apiUrl}/api/v1/resources`;

  constructor(private http: HttpClient) {}

  getAllResources(): Observable<RecursoDTO[]> {
    return this.http.get<RecursoDTO[]>(this.apiUrl);
  }

  getRelaxationResources(): Observable<RecursoDTO[]> {
    return this.http.get<RecursoDTO[]>(`${this.apiUrl}/relaxation`);
  }

  searchResources(query?: string): Observable<RecursoDTO[]> {
    // Current backend doesn't take parameters for search, just returns all
    return this.http.get<RecursoDTO[]>(`${this.apiUrl}/search`);
  }

  uploadResource(file: File, dto: RecursoDTO): Observable<RecursoDTO> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('recurso', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
    
    return this.http.post<RecursoDTO>(`${this.apiUrl}/upload`, formData);
  }

  assignResource(recursoId: number, psicologoId: number, patientIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${recursoId}/assign?psicologoId=${psicologoId}`, patientIds);
  }

  getAssignedPatients(recursoId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/${recursoId}/assigned-patients`);
  }

  getAssignedResources(patientId: number): Observable<RecursoDTO[]> {
    return this.http.get<RecursoDTO[]>(`${this.apiUrl}/assigned/${patientId}`);
  }
}
