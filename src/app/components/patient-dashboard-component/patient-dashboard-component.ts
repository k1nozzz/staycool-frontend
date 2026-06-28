import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { EmotionService } from '../../services/emotion-service';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-dashboard-component.html',
  styleUrl: './patient-dashboard-component.css'
})
export class PatientDashboard implements OnInit {
  sidebarOpen = false;
  private authService: AuthService = inject(AuthService);
  private emotionService: EmotionService = inject(EmotionService);
  private router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private notificationService: NotificationService = inject(NotificationService);

  unreadAlerts$!: Observable<number>;

  emotionLogForm: FormGroup = this.fb.group({
    tipoEmocion: ['HAPPY', Validators.required],
    notasEmocion: ['', [Validators.required, Validators.minLength(3)]]
  });

  dailyMetricsForm: FormGroup = this.fb.group({
    minutosActivos: [30, [Validators.required, Validators.min(0), Validators.max(1440)]],
    minutosDescanso: [10, [Validators.required, Validators.min(0), Validators.max(1440)]],
    horasSueno: [8, [Validators.required, Validators.min(0), Validators.max(24)]],
    minutosRedesSociales: [60, [Validators.required, Validators.min(0), Validators.max(1440)]],
    minutosUsoNocturno: [0, [Validators.required, Validators.min(0), Validators.max(1440)]]
  });

  userId: number | null = null;
  userName: string | null = null;

  get profilePictureUrl(): string | null { return this.authService.getProfilePictureUrl(); }

  get userInitial(): string {
    return this.authService.getUserName()?.charAt(0).toUpperCase() || 'U';
  }
  isLoading = false;
  isEditing = true;
  successMessage = '';
  errorMessage = '';
  metricsSuccessMessage = '';
  metricsErrorMessage = '';
  isSavingMetrics = false;
  gamificationStatus: any = { PuntosGanados: 0 };

  ngOnInit() {
    this.userId = this.authService.getUserId();
    const fullName = this.authService.getUserName() || 'Usuario';
    this.userName = fullName.split(' ')[0];
    if (this.userId) {
      this.loadGamificationStatus();
      this.notificationService.connect(this.userId);
      this.unreadAlerts$ = this.notificationService.unreadCount$;
    }
  }

  loadGamificationStatus() {
    if (!this.userId) return;
    this.emotionService.getGamificationStatus(this.userId).subscribe({
      next: (data) => {
        this.gamificationStatus = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando gamificación:', err);
        this.gamificationStatus = { PuntosGanados: 0 };
        this.cdr.detectChanges();
      }
    });
  }

  onSubmitEmotion() {
    if (this.emotionLogForm.invalid || !this.userId) {
      this.emotionLogForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload = {
      usuario: { id: this.userId },
      ...this.emotionLogForm.value
    };

    this.emotionService.logEmotion(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '¡Emoción registrada con ééxito!';
        this.isEditing = false;
        this.emotionLogForm.disable();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Hubo un error al guardar tu registro.';
      }
    });
  }

  onSubmitMetrics() {
    if (this.dailyMetricsForm.invalid || !this.userId) {
      this.dailyMetricsForm.markAllAsTouched();
      return;
    }

    this.isSavingMetrics = true;
    this.metricsSuccessMessage = '';
    this.metricsErrorMessage = '';

    const payload = {
      usuario: { id: this.userId },
      ...this.dailyMetricsForm.value
    };

    this.emotionService.saveDailyMetrics(payload).subscribe({
      next: () => {
        this.isSavingMetrics = false;
        this.metricsSuccessMessage = '¡Métricas actualizadías!';
        setTimeout(() => this.metricsSuccessMessage = '', 3000);
        this.cdr.detectChanges();
      },
      error: () => {
        this.isSavingMetrics = false;
        this.metricsErrorMessage = 'Error al actualizar métricas.';
        this.cdr.detectChanges();
      }
    });
  }

  toggleEdit() {
    this.isEditing = true;
    this.emotionLogForm.enable();
    this.emotionLogForm.reset({ tipoEmocion: 'HAPPY', notasEmocion: '' });
    this.successMessage = '';
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}





