import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { EmotionService } from '../../services/emotion-service';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-patient-sos-component',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-sos-component.html',
  styleUrls: ['./patient-sos-component.css']
})
export class PatientSosComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);
  private emotionService = inject(EmotionService);
  public cdr = inject(ChangeDetectorRef);

  sidebarOpen = false;
  profilePictureUrl: string | null = null;
  userInitial: string = 'P';
  gamificationStatus: any = { PuntosGanados: 0 };

  showConfirmModal = false;
  isLoading = false;
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

    // Update unread count if needed
    this.notificationService.getUserAlerts(userId).subscribe(alerts => {
      const unreadCount = alerts.filter(a => !a.leido).length;
      this.notificationService.setUnreadCount(unreadCount);
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

  openConfirmModal() {
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
  }

  requestEmergencyChat() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.isLoading = true;
    
    // Call backend to create emergency chat and trigger alert
    this.http.post(`${environment.apiUrl}/api/v1/chats/emergency/${userId}`, {}).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.showConfirmModal = false;
        // Redirect to chat screen
        this.router.navigate(['/patient/chat']);
      },
      error: (err) => {
        console.error('Error requesting SOS', err);
        this.isLoading = false;
        // Proceed to chat anyway in case of error maybe it was already created
        this.router.navigate(['/patient/chat']);
      }
    });
  }
}
