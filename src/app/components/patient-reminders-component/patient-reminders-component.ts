import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { EmotionService } from '../../services/emotion-service';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-patient-reminders-component',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './patient-reminders-component.html',
  styleUrls: ['./patient-reminders-component.css']
})
export class PatientRemindersComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private emotionService = inject(EmotionService);
  public cdr = inject(ChangeDetectorRef);

  sidebarOpen = false;
  profilePictureUrl: string | null = null;
  userInitial: string = 'P';
  gamificationStatus: any = { PuntosGanados: 0 };

  reminderForm: FormGroup;
  reminders: any[] = [];
  isLoading = false;
  unreadAlerts$: Observable<number>;

  weekDays = [
    { label: 'L', value: 'L' },
    { label: 'M', value: 'M' },
    { label: 'X', value: 'X' },
    { label: 'J', value: 'J' },
    { label: 'V', value: 'V' },
    { label: 'S', value: 'S' },
    { label: 'D', value: 'D' }
  ];
  selectedDays: Set<string> = new Set();

  constructor() {
    this.unreadAlerts$ = this.notificationService.unreadCount$;
    this.reminderForm = this.fb.group({
      time: ['', Validators.required],
      message: ['']
    });
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
    this.loadReminders();
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

  loadReminders() {
    this.http.get<any[]>(`${environment.apiUrl}/api/v1/calendar/events`).subscribe(events => {
      // Filtrar los que son RECORDATORIO_PERSONAL
      this.reminders = events.filter(e => e.type === 'PERSONAL_REMINDER');
    });
  }

  saveReminder() {
    if (this.reminderForm.invalid) return;

    const userId = this.authService.getUserId();
    if (!userId) return;

    this.isLoading = true;
    const formVals = this.reminderForm.value;

    // Convert time (e.g. 21:00) to today's datetime for the event
    const today = new Date();
    const timeParts = formVals.time.split(':');
    today.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0, 0);

    // Ajustar a timezone local ISO
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today.getTime() - tzOffset)).toISOString().slice(0, -1); // remove Z

    const dto = {
      userId: userId,
      title: 'Recordatorio de Desconexión',
      description: formVals.message || 'Es momento de tomar una pausa.',
      eventDatetime: localISOTime,
      isRecurring: this.selectedDays.size > 0,
      recurringDays: Array.from(this.selectedDays).join(','),
      type: 'PERSONAL_REMINDER'
    };

    this.http.post(`${environment.apiUrl}/api/v1/reminders`, dto).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.reminderForm.reset();
        this.selectedDays.clear();
        this.loadReminders();
      },
      error: (err) => {
        console.error('Error al guardar recordatorio', err);
        this.isLoading = false;
      }
    });
  }

  deleteReminder(id: number) {
    this.http.delete(`${environment.apiUrl}/api/v1/calendar/events/${id}`).subscribe(() => {
      this.loadReminders();
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

  formatTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  toggleDay(day: string) {
    if (this.selectedDays.has(day)) {
      this.selectedDays.delete(day);
    } else {
      this.selectedDays.add(day);
    }
  }
}
