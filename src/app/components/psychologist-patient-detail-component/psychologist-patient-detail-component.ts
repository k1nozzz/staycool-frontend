import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PsychologistService, PatientDetailDTO } from '../../services/psychologist-service';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-psychologist-patient-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './psychologist-patient-detail-component.html',
  styleUrl: './psychologist-patient-detail-component.css'
})
export class PsychologistPatientDetail implements OnInit {
    private notificationService = inject(NotificationService);
  unreadAlerts$: Observable<number> = this.notificationService.unreadCount$;
  sidebarOpen = false;
  patientId: number = 0;
  psychologistId: number = 0;
  detail: PatientDetailDTO | null = null;
  savedStatus: string = '';
  diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  get profilePictureUrl(): string | null { return this.authService.getProfilePictureUrl(); }

  get userInitial(): string {
    return this.authService.getUserName()?.charAt(0).toUpperCase() || 'U';
  }

  get maxHistorial(): number {
    return this.getMax(this.detail?.historialEmocional, 60);
  }

  get maxSueno(): number {
    return this.getMax(this.detail?.historialHorasSueno, 12);
  }

  get maxRedes(): number {
    return this.getMax(this.detail?.historialUsoRedes, 120);
  }

  private getMax(arr: number[] | undefined, defaultMax: number): number {
    if (!arr || arr.length === 0) return defaultMax;
    const max = Math.max(...arr);
    return max > 0 ? max : defaultMax;
  }

  get historialEmocionalArray(): number[] {
    return this.padarray(this.detail?.historialEmocional);
  }

  get historialHorasSuenoArray(): number[] {
    return this.padarray(this.detail?.historialHorasSueno);
  }

  get historialUsoRedesArray(): number[] {
    return this.padarray(this.detail?.historialUsoRedes);
  }

  private padarray(arr: number[] | undefined): number[] {
    if (arr && arr.length > 0) {
      let padded = [...arr];
      while (padded.length < 7) {
        padded.unshift(0);
      }
      return padded.slice(-7);
    }
    return [0, 0, 0, 0, 0, 0, 0];
  }

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private psychService: PsychologistService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.psychologistId = this.authService.getUserId()!;
    this.route.paramMap.subscribe(params => {
      this.patientId = Number(params.get('id'));
      if (this.patientId && this.psychologistId) {
        this.loadDetail();
      }
    });
  }

  loadDetail() {
    this.psychService.getPatientDetails(this.psychologistId, this.patientId).subscribe({
      next: (data) => {
        this.detail = data;
        // Pad to 7 days if not enough data
        if (this.detail.historialEmocional.length < 7) {
            const padding = new Array(7 - this.detail.historialEmocional.length).fill(0);
            this.detail.historialEmocional = [...padding, ...this.detail.historialEmocional];
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading patient detail', err);
        this.detail = {
            pacienteId: this.patientId,
            nombre: "Paciente Desconocido",
            edad: 16,
            fechaIngreso: "Reciente",
            estadoAlerta: "Estable",
            notasClinicas: "",
            historialEmocional: [0, 0, 0, 0, 0, 0, 0],
            historialHorasSueno: [0, 0, 0, 0, 0, 0, 0],
            historialUsoRedes: [0, 0, 0, 0, 0, 0, 0],
            historialEmocionalDetallado: [],
            actividadReciente: [],
            rachaActual: 0,
            logrosDesbloqueados: []
        };
        this.cdr.detectChanges();
      }
    });
  }

  saveNotes() {
    if (this.detail) {
      this.savedStatus = 'Guardando...';
      this.psychService.savePatientNotes(this.psychologistId, this.patientId, this.detail.notasClinicas).subscribe({
        next: () => {
          this.savedStatus = 'Guardado ✓';
          setTimeout(() => this.savedStatus = '', 3000);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error al guardar notas", err);
          this.savedStatus = 'Error al guardar';
          setTimeout(() => this.savedStatus = '', 3000);
          this.cdr.detectChanges();
        }
      });
    }
  }

  exportPdf() {
    this.psychService.exportPatientPdf(this.psychologistId, this.patientId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Optionally name it with the patient's name if we assume it's for this patient
        a.download = `Expediente_${this.detail?.nombre || 'Pacientes'}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => console.error('Error al exportar PDF', err)
    });
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  }
