import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { RecursoService } from '../../services/recurso-service';
import { EmotionService } from '../../services/emotion-service';
import { RecursoDTO } from '../../models/recurso-model';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-recursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-recursos-component.html',
  styleUrl: './patient-recursos-component.css'
})
export class Recursos implements OnInit {
  private notificationService = inject(NotificationService);
  unreadAlerts$: Observable<number> = this.notificationService.unreadCount$;
  sidebarOpen = false;
  resources: RecursoDTO[] = [];
  filteredResources: RecursoDTO[] = [];
  featuredResource: RecursoDTO | null = null;
  searchQuery = '';
  activeFilter = 'Todos';
  gamificationStatus: any = { PuntosGanados: 0 };

  get profilePictureUrl(): string | null { return this.authService.getProfilePictureUrl(); }

  get userInitial(): string {
    return this.authService.getUserName()?.charAt(0).toUpperCase() || 'U';
  }

  constructor(
    private recursoService: RecursoService,
    private authService: AuthService,
    private emotionService: EmotionService,
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadResources();
    this.loadGamificationStatus();
  }

  loadGamificationStatus() {
    const userId = this.authService.getUserId();
    if (!userId) return;
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

  loadResources() {
    const patientId = this.authService.getUserId();
    if (!patientId) return;

    this.recursoService.getAssignedResources(patientId).subscribe({
      next: (data) => {
        this.resources = data;
        this.applyFilter('Todos');
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error cargando recursos', err)
    });
  }

  applyFilter(filter: string) {
    this.activeFilter = filter;
    if (filter === 'Todos') {
      this.filteredResources = [...this.resources];
    } else if (filter === 'Relajación') {
      this.filteredResources = this.resources.filter(r => r.category === 'MEDITATION' || r.category === 'MUSIC');
    } else if (filter === 'Educación') {
      this.filteredResources = this.resources.filter(r => r.category === 'ARTICLE');
    } else if (filter === 'Hábitos') {
      this.filteredResources = this.resources.filter(r => r.category === 'ADVISORY_DOC');
    }
    this.cdr.detectChanges();
  }

  getCategoryLabel(category: string): string {
    switch(category) {
      case 'MEDITATION': case 'MUSIC': return 'Relajación';
      case 'ARTICLE': return 'Educación';
      case 'ADVISORY_DOC': return 'Hábitos';
      default: return 'Recurso';
    }
  }

  getFileType(url: string | undefined): string {
    if (!url) return 'Documento';
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.endsWith('.pdf')) return 'PDF';
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'Imagen';
    if (lowerUrl.match(/\.(mp4|webm|ogg)$/)) return 'Video';
    if (lowerUrl.match(/\.(mp3|wav)$/)) return 'Audio';
    return 'Documento';
  }

  getIconForUrl(url: string | undefined, category: string): string {
    const type = this.getFileType(url);
    if (type === 'Imagen') return '🖼️';
    if (type === 'Video' || type === 'Audio') return '▶️';
    if (type === 'PDF' || type === 'Documento') return '📄';
    return '📄';
  }

  openResource(url?: string) {
    if (url) {
      window.open(url, '_blank');
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



