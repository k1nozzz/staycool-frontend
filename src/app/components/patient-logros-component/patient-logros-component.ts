import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth-service';
import { EmotionService } from '../../services/emotion-service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-patient-logros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './patient-logros-component.html',
  styleUrls: ['./patient-logros-component.css']
})
export class PatientLogros implements OnInit {
  sidebarOpen = false;
  private authService: AuthService = inject(AuthService);
  private emotionService: EmotionService = inject(EmotionService);
  private notificationService: NotificationService = inject(NotificationService);
  router: Router = inject(Router);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  unreadAlerts$: Observable<number> = this.notificationService.unreadCount$;
  gamificationStatus: any = null;
  logrosDesbloqueados: any[] = [];
  userId: number | null = null;
  userName: string | null = null;

  get profilePictureUrl(): string | null { return this.authService.getProfilePictureUrl(); }

  get userInitial(): string {
    return this.authService.getUserName()?.charAt(0).toUpperCase() || 'U';
  }

  ngOnInit() {
    this.userId = this.authService.getUserId();
    const fullName = this.authService.getUserName() || 'Usuario';
    this.userName = fullName.split(' ')[0];
    if (this.userId) {
      this.loadGamificationStatus();
    }
  }

  get getProgressPercentage(): number {
    if (!this.gamificationStatus || this.gamificationStatus.PuntosGanados == null) return 0;
    const pts = this.gamificationStatus.PuntosGanados;
    if (pts === 0) return 0;
    return pts % 100 === 0 ? 100 : pts % 100;
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

    this.emotionService.getAchievements(this.userId).subscribe({
      next: (data) => {
        this.logrosDesbloqueados = data.achievements || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando logros:', err);
        this.logrosDesbloqueados = [];
        this.cdr.detectChanges();
      }
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



