import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-psychologist-notifications-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './psychologist-notifications-component.html',
  styleUrls: ['./psychologist-notifications-component.css']
})
export class PsychologistNotificationsComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  public cdr = inject(ChangeDetectorRef);

  sidebarOpen = false;
  profilePictureUrl: string | null = null;
  userInitial: string = 'M';
  
  alerts: any[] = [];
  unreadAlerts$: Observable<number> = this.notificationService.unreadCount$;

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.profilePictureUrl = this.authService.getProfilePictureUrl();
    this.userInitial = this.authService.getUserName()?.charAt(0).toUpperCase() || 'M';

    this.loadAlerts(userId);

    // Subscribe to real-time alerts
    this.notificationService.notifications$.subscribe(newAlert => {
      this.alerts.unshift(newAlert);
      this.cdr.detectChanges();
    });
  }

  loadAlerts(userId: number) {
    this.notificationService.getUserAlerts(userId).subscribe({
      next: (data) => {
        // Ordenar las alertas, más recientes primero
        this.alerts = data.sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime());
        const unreadCount = this.alerts.filter(a => !a.leido).length;
        this.notificationService.setUnreadCount(unreadCount);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading alerts', err)
    });
  }

  markAsRead(alert: any) {
    if (alert.leido) return;
    
    this.notificationService.markAsRead(alert.id).subscribe({
      next: () => {
        alert.leido = true;
        this.notificationService.decrementUnreadCount();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error marking as read', err)
    });
  }

  goToPatientProfile(patientId: number, alert: any) {
    this.markAsRead(alert);
    this.router.navigate(['/psychologist/patient', patientId]);
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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  }
}
