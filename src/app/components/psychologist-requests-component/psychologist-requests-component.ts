import { Component, ChangeDetectorRef, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PsychologistService, SolicitudDTO } from '../../services/psychologist-service';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth-service';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef, MatHeaderRow,
  MatHeaderRowDef, MatRow, MatRowDef,
  MatTable, MatTableDataSource, MatNoDataRow
} from '@angular/material/table';
import {MatSort, MatSortHeader} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-psychologist-requests',
  standalone: true,
  imports: [
    CommonModule,
    MatTable,
    MatSort,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    MatCellDef,
    MatHeaderCellDef,
    MatHeaderRowDef,
    MatRowDef,
    MatPaginator,
    MatSortHeader,
    MatHeaderRow,
    MatRow,
    MatButtonModule,
    MatIconModule,
    MatNoDataRow
  ],
  templateUrl: './psychologist-requests-component.html',
  styleUrl: './psychologist-requests-component.css'
})
export class PsychologistRequestsComponent implements OnInit, AfterViewInit {
  private notificationService = inject(NotificationService);
  unreadAlerts$: Observable<number> = this.notificationService.unreadCount$;
  sidebarOpen = false;
  successMessage = '';
  errorMessage = '';

  displayedColumns: string[] = ['paciente', 'fecha', 'mensaje', 'acciones'];
  dataSource: MatTableDataSource<SolicitudDTO> = new MatTableDataSource<SolicitudDTO>();
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  get profilePictureUrl(): string | null { 
    return this.authService.getProfilePictureUrl(); 
  }

  get userInitial(): string {
    return this.authService.getUserName()?.charAt(0).toUpperCase() || 'U';
  }

  constructor(
    private psychologistService: PsychologistService,
    private authService: AuthService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRequests();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  loadRequests(): void {
    const psychologistId = this.authService.getUserId();
    if (!psychologistId) return;

    this.psychologistService.getPendingRequests(psychologistId).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando solicitudes', err);
        this.errorMessage = 'No se pudieron cargar las solicitudes';
      }
    });
  }

  aceptar(solicitudId: number): void {
    this.psychologistService.acceptRequest(solicitudId).subscribe({
      next: () => {
        this.successMessage = 'Solicitud aceptada. El paciente ahora est en tu lista.';
        this.loadRequests();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error al aceptar', err);
        this.errorMessage = 'Hubo un error al aceptar la solicitud';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  rechazar(solicitudId: number): void {
    this.psychologistService.rejectRequest(solicitudId).subscribe({
      next: () => {
        this.successMessage = 'Solicitud rechazada.';
        this.loadRequests();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error al rechazar', err);
        this.errorMessage = 'Hubo un error al rechazar la solicitud';
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  goTo(path: string): void {
    this.router.navigate([path]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

