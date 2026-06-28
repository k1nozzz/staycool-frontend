import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { EmotionService } from '../../services/emotion-service';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-patient-notifications-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-notifications-component.html',
  styleUrls: ['./patient-notifications-component.css']
})
export class PatientNotificationsComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private emotionService = inject(EmotionService);
  public cdr = inject(ChangeDetectorRef);

  sidebarOpen = false;
  profilePictureUrl: string | null = null;
  userInitial: string = 'P';
  gamificationStatus: any = { PuntosGanados: 0 };

  alerts: any[] = [];
  filteredAlerts: any[] = [];
  filter: string = 'TODAS'; // 'TODAS', 'NO_LEIDAS', 'USO_CRITICO', 'RECOMPENSA'
  unreadAlerts$: Observable<number>;

  constructor() {
    this.unreadAlerts$ = this.notificationService.unreadCount$;
  }

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.profilePictureUrl = this.authService.getProfilePictureUrl();
    this.userInitial = this.authService.getUserName()?.charAt(0).toUpperCase() || 'P';
    
    this.loadGamificationStatus(userId);
    this.loadAlerts(userId);

    // Suscribirse a nuevas alertas en tiempo real para actualizar la lista
    this.notificationService.notifications$.subscribe(alert => {
      this.alerts.unshift(alert); // Add new alert to the top
      this.applyFilter(this.filter);
    });
  }

  loadGamificationStatus(userId: number) {
    this.emotionService.getGamificationStatus(userId).subscribe({
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

  loadAlerts(userId: number) {
    this.notificationService.getUserAlerts(userId).subscribe(alerts => {
      // Sort desc
      this.alerts = alerts.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
      
      const unreadCount = this.alerts.filter(a => !a.leido).length;
      this.notificationService.setUnreadCount(unreadCount);
      
      this.applyFilter(this.filter);
    });
  }

  setFilter(f: string) {
    this.filter = f;
    this.applyFilter(f);
  }

  applyFilter(f: string) {
    if (f === 'TODAS') {
      this.filteredAlerts = this.alerts;
    } else if (f === 'NO_LEIDAS') {
      this.filteredAlerts = this.alerts.filter(a => !a.leido);
    } else {
      this.filteredAlerts = this.alerts.filter(a => a.tipo === f);
    }
  }

  markAsRead(alert: any) {
    if (alert.leido) return;
    this.notificationService.markAsRead(alert.id).subscribe(() => {
      alert.leido = true;
      this.notificationService.decrementUnreadCount();
      // If we are in "NO_LEIDAS" tab, maybe we should remove it from the view, but user might want to still see it until they change tab.
      // So we keep it in filteredAlerts for now, just change its state.
    });
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getIconForType(tipo: string): string {
    switch (tipo) {
      case 'USO_CRITICO': return 'warning';
      case 'EMERGENCIA': return 'emergency';
      case 'RECOMPENSA': return 'emoji_events';
      case 'SISTEMA': return 'info';
      case 'RECORDATORIO': return 'self_improvement';
      default: return 'notifications';
    }
  }

  getColorClassForType(tipo: string): string {
    switch (tipo) {
      case 'USO_CRITICO': return 'icon-bg-danger';
      case 'EMERGENCIA': return 'icon-bg-danger';
      case 'RECOMPENSA': return 'icon-bg-primary';
      case 'SISTEMA': return 'icon-bg-info';
      case 'RECORDATORIO': return 'icon-bg-warning';
      default: return 'icon-bg-default';
    }
  }
}
