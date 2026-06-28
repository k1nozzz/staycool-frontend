import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmotionService } from '../../services/emotion-service';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-patient-meta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatTableModule],
  templateUrl: './patient-meta-component.html',
  styleUrl: './patient-meta-component.css'
})
export class PatientMetaComponent implements OnInit {
  sidebarOpen = false;
  private fb: FormBuilder = inject(FormBuilder);
  private emotionService: EmotionService = inject(EmotionService);
  authService: AuthService = inject(AuthService);
  router: Router = inject(Router);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private notificationService: NotificationService = inject(NotificationService);

  unreadAlerts$: Observable<number> = this.notificationService.unreadCount$;

  // Formulario reactivo para la meta (igual al profesor)
  metaForm: FormGroup = this.fb.group({
    targetminutes: [60, [Validators.required, Validators.min(1), Validators.max(1440)]]
  });

  savedTargetminutes: number = 60;
  isSaving: boolean = false;
  successMessage: string = '';
  gamificationStatus: any = { PuntosGanados: 0 };

  get profilePictureUrl(): string | null { return this.authService.getProfilePictureUrl(); }

  get userInitial(): string {
    return this.authService.getUserName()?.charAt(0).toUpperCase() || 'U';
  }

  // Lista con MatTableDataSource (igual al profesor)
  displayedColumns: string[] = ['fecha', 'uso', 'estado'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>();
  isLoadingLogs: boolean = true;

  ngOnInit() {
    this.loaddailyGoal();
    this.loadLogs();
  }

  // Getter de conveniencia para acceder al valor del formulario
  get targetminutes(): number {
    return this.metaForm.get('targetminutes')?.value ?? 60;
  }

  loaddailyGoal() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.emotionService.getDailyGoal(userId).subscribe({
        next: (res: any) => {
          const minutes = res.dailyGoalminutes || 60;
          this.metaForm.patchValue({ targetminutes: minutes });
          this.savedTargetminutes = minutes;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading daily goal', err)
      });
    }
  }

  loadLogs() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.isLoadingLogs = true;
      this.emotionService.getLogs(userId).subscribe({
        next: (data: any[]) => {
          this.dataSource.data = data;
          this.dataSource._updateChangeSubscription();
          this.isLoadingLogs = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error loading logs', err);
          this.isLoadingLogs = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  saveGoal() {
    if (this.metaForm.invalid) {
      this.metaForm.markAllAsTouched();
      return;
    }

    const userId = this.authService.getUserId();
    if (userId) {
      this.isSaving = true;
      this.successMessage = '';
      this.cdr.detectChanges();

      this.emotionService.saveDailyGoal(userId, this.targetminutes).subscribe({
        next: () => {
          this.isSaving = false;
          this.savedTargetminutes = this.targetminutes;
          this.successMessage = 'Meta guardada con ééxito.';
          this.cdr.detectChanges();

          setTimeout(() => {
            this.successMessage = '';
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err) => {
          this.isSaving = false;
          console.error('Error saving daily goal', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  loadGamificationStatus(userId: number) {
    this.emotionService.getGamificationStatus(userId).subscribe({
      next: (data: any) => {
        this.gamificationStatus = data;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error', err);
        this.gamificationStatus = { PuntosGanados: 0 };
      }
    });
  }
}





