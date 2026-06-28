import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarService, EventoDTO } from '../../services/calendar-service';
import { AuthService } from '../../services/auth-service';
import { EmotionService } from '../../services/emotion-service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './patient-calendar-component.html',
  styleUrl: './patient-calendar-component.css'
})
export class Calendar implements OnInit {
  sidebarOpen = false;
  eventForm: FormGroup;
  events: EventoDTO[] = [];
  userId: number | null = null;
  isLoading = false;

  private notificationService = inject(NotificationService);
  unreadAlerts$: Observable<number> = this.notificationService.unreadCount$;

  get profilePictureUrl(): string | null { return this.authService.getProfilePictureUrl(); }

  get userInitial(): string {
    return this.authService.getUserName()?.charAt(0).toUpperCase() || 'U';
  }
  successMessage = '';
  errorMessage = '';
  isModalOpen = false;
  todayEvents: EventoDTO[] = [];
  gamificationStatus: any = { PuntosGanados: 0 };
  
  // Para el calendario visual
  currentDate = new Date();
  daysInMonth: { date: Date, isCurrentMonth: boolean, hasEvent: boolean, events: EventoDTO[], isToday?: boolean }[] = [];
  weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  constructor(
    private fb: FormBuilder,
    private calendarService: CalendarService,
    private authService: AuthService,
    private emotionService: EmotionService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.eventForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      date: ['', Validators.required],
      time: ['', Validators.required],
      endTime: [''],
      location: [''],
      sincronizarConGoogle: [false]
    });
  }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    if (this.userId) {
      this.loadEvents();
      this.loadGamificationStatus();
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

  loadEvents() {
    this.calendarService.getEvents().subscribe({
      next: (allEvents) => {
        // En el backend actualmente no filtra por userId, lo filtramos en el frontend por ahora.
        // Incluimos eventos donde el paciente es el creador (userId) o el asignado (patientId)
        this.events = allEvents.filter(e => e.userId === this.userId || e.patientId === this.userId).sort((a, b) => 
          new Date(a.eventDatetime).getTime() - new Date(b.eventDatetime).getTime()
        );
        this.generateCalendar();
        this.filterTodayEvents();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando eventos', err)
    });
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDayDate = new Date(year, month + 1, 0).getDate();
    
    this.daysInMonth = [];
    
    // Previous month empty days
    // JS getDay() considers Sunday=0. This exactly matches our ['Dom', 'Lun'...] layout.
    for (let i = 0; i < firstDayIndex; i++) {
      this.daysInMonth.push({ date: new Date(year, month, i - firstDayIndex + 1), isCurrentMonth: false, hasEvent: false, events: [] });
    }
    
    // Current month days
    for (let i = 1; i <= lastDayDate; i++) {
      const dayDate = new Date(year, month, i);
      const dayEvents = this.events.filter(e => {
        const d = new Date(e.eventDatetime);
        return d.getDate() === i && d.getMonth() === month && d.getFullYear() === year;
      });
      const today = new Date();
      const isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      this.daysInMonth.push({ date: dayDate, isCurrentMonth: true, hasEvent: dayEvents.length > 0, events: dayEvents, isToday });
    }
  }

  previousMonth() {
    console.log('previousMonth clicked');
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  nextMonth() {
    console.log('nextMonth clicked');
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
    this.cdr.detectChanges();
  }

  onSubmit() {
    console.log('onSubmit clicked, form valid:', this.eventForm.valid, 'userId:', this.userId);
    if (this.eventForm.invalid || !this.userId) {
        console.log('Form errors:', this.eventForm.errors);
        Object.keys(this.eventForm.controls).forEach(key => {
            const controlErrors = this.eventForm.get(key)?.errors;
            if (controlErrors) console.log('Control', key, 'errors:', controlErrors);
        });
        return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formVal = this.eventForm.value;
    const datetimeStr = `${formVal.date}T${formVal.time}:00`;

    const newEvent: EventoDTO = {
      userId: this.userId || 0,
      type: 'PERSONAL_REMINDER',
      title: formVal.title,
      description: formVal.description,
      eventDatetime: datetimeStr,
      isRecurring: false,
      sincronizarConGoogle: formVal.sincronizarConGoogle,
      eventEndDatetime: formVal.endTime ? `${formVal.date}T${formVal.endTime}:00` : undefined,
      location: formVal.location || ''
    };

    this.calendarService.createEvent(newEvent).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = '¡Evento agendado con éxito!';

        if (newEvent.sincronizarConGoogle) {
            this.syncEvent(res);
        }

        this.eventForm.reset({sincronizarConGoogle: false});
        this.closeModal();
        this.loadEvents();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error creating event:', err);
        this.errorMessage = 'Hubo un error al crear la cita.';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  filterTodayEvents() {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.todayEvents = this.events.filter(e => e.eventDatetime.startsWith(todayStr));
  }

  formatGoogleDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toISOString().replace(/-|:|\.\d\d\d/g,"");
  }


  openModal() {
    console.log('openModal clicked');
    this.isModalOpen = true;
    this.cdr.detectChanges();
  }

  closeModal() {
    console.log('closeModal clicked');
    this.isModalOpen = false;
    this.eventForm.reset();
    this.cdr.detectChanges();
  }

  syncEvent(ev: any) {
    if (!ev || !ev.id || !this.userId) return;
    
    this.calendarService.getAuthUrl(ev.id, this.userId).subscribe({
      next: (res) => {
        window.open(res.url, '_blank', 'width=600,height=700');
        
        // Polling para revisar si el backend ya terminó el callback
        const intervalId = setInterval(() => {
          this.calendarService.checkSyncStatus(ev.id, this.userId!).subscribe({
            next: (statusRes) => {
              if (statusRes.synced) {
                clearInterval(intervalId);
                this.successMessage = '¡Sincronizado con Google Calendar exitosamente!';
                this.loadEvents();
                setTimeout(() => this.successMessage = '', 3000);
              }
            }
          });
        }, 2000);
      },
      error: (err) => {
        console.error('Error getting auth url:', err);
        this.errorMessage = 'No se pudo iniciar la sincronización.';
        setTimeout(() => this.errorMessage = '', 3000);
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









