import { Component, ChangeDetectorRef, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth-service';
import { PsychologistService, PatientMonitoreoDTO } from '../../services/psychologist-service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PatientTableRow extends PatientMonitoreoDTO {
  initials: string;
}

@Component({
  selector: 'app-psychologist-patients',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './psychologist-patients-component.html',
  styleUrl: './psychologist-patients-component.css'
})
export class PsychologistPatients implements OnInit, AfterViewInit {
  private notificationService = inject(NotificationService);
  unreadAlerts$: Observable<number> = this.notificationService.unreadCount$;
  sidebarOpen = false;
  private authService: AuthService = inject(AuthService);
  private psychService: PsychologistService = inject(PsychologistService);
  router: Router = inject(Router);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  psychologistId: number | null = null;
  userName: string = '';

  get profilePictureUrl(): string | null { return this.authService.getProfilePictureUrl(); }

  get userInitial(): string {
    return this.authService.getUserName()?.charAt(0).toUpperCase() || 'U';
  }

  displayedColumns: string[] = ['paciente', 'estado', 'ultimaActividad', 'tendencia', 'acciones'];
  dataSource: MatTableDataSource<PatientTableRow> = new MatTableDataSource<PatientTableRow>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.psychologistId = this.authService.getUserId();
    this.userName = this.authService.getUserName() || 'Doctor(a)';
    if (this.psychologistId) {
      this.loadPatients();
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadPatients() {
    this.psychService.getMonitoredPatients(this.psychologistId!).subscribe({
      next: (data) => {
        const enricheddata: PatientTableRow[] = data.map(p => ({
          ...p,
          initials: p.nombrePaciente.charAt(0).toUpperCase()
        }));
        this.dataSource.data = enricheddata;
        this.dataSource._updateChangeSubscription();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading patients', err)
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    
    let currentFilter = { text: '', status: 'all' };
    try { currentFilter = JSON.parse(this.dataSource.filter); } catch(e) { }
    currentFilter.text = filterValue.trim();
    this.dataSource.filter = JSON.stringify(currentFilter);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  filterByStatus(status: string) {
    this.dataSource.filterPredicate = (data: PatientTableRow, filter: string) => {
      try {
        const searchTerms = JSON.parse(filter);
        const matchText = data.nombrePaciente.toLowerCase().includes(searchTerms.text.toLowerCase());
        const matchStatus = searchTerms.status === 'all' || 
          (searchTerms.status === 'Crítico' && (data.estado === 'CRITICAL' || data.estado === 'Crítico')) ||
          (searchTerms.status === 'Observación' && (data.estado === 'OBSERVACION' || data.estado === 'Observación')) ||
          (searchTerms.status === 'Estable' && (data.estado === 'ESTABLE' || data.estado === 'ACTIVO' || data.estado === 'Estable'));
        return matchText && matchStatus;
      } catch(e) {
        return data.nombrePaciente.toLowerCase().includes(filter.toLowerCase());
      }
    };
    
    let currentFilter = { text: '', status: 'all' };
    try { currentFilter = JSON.parse(this.dataSource.filter); } catch(e) { currentFilter.text = this.dataSource.filter; }
    currentFilter.status = status;
    this.dataSource.filter = JSON.stringify(currentFilter);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  goTo(path: string) {
    this.router.navigate([path]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}







