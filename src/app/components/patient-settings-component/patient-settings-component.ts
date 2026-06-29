import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { UsuarioService, UsuarioDTO } from '../../services/usuario-service';
import { EmotionService } from '../../services/emotion-service';
import { NotificationService } from '../../services/notification.service';
import { Observable } from 'rxjs';
import { STORAGE_KEYS } from '../../constants/app.constants';

@Component({
  selector: 'app-patient-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './patient-settings-component.html',
  styleUrls: ['./patient-settings-component.css']
})
export class PatientSettings implements OnInit {
  private notificationService = inject(NotificationService);
  unreadAlerts$: Observable<number> = this.notificationService.unreadCount$;
  sidebarOpen = false;
  private authService: AuthService = inject(AuthService);
  private usuarioService: UsuarioService = inject(UsuarioService);
  private emotionService: EmotionService = inject(EmotionService);
  router: Router = inject(Router);
  private fb: FormBuilder = inject(FormBuilder);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  user: UsuarioDTO | null = null;

  // Formulario reactivo para el perfil
  profileForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    age: [null, [Validators.min(10), Validators.max(99)]]
  });

  // Formulario reactivo para cambio de contraseña
  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  isSaving = false;
  isChangingPassword = false;
  isUploading = false;
  successMessage = '';
  errorMessage = '';
  gamificationStatus: any = { PuntosGanados: 0 };

  get profilePictureUrl(): string | null { return this.authService.getProfilePictureUrl(); }

  get userInitial(): string {
    return this.authService.getUserName()?.charAt(0).toUpperCase() || 'U';
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId) {
      this.usuarioService.getUserById(userId).subscribe({
        next: (data) => {
          this.user = data;
          this.authService.setProfilePictureUrl(data.profilePictureUrl || null);
          this.profileForm.patchValue({
            name: data.name,
            email: data.email,
            age: data.age || null
          });
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching user info', err);
          this.errorMessage = 'No se pudo cargar la información del servidor. ¿¿Reiniciaste el backend?';
          this.cdr.detectChanges();
        }
      });
      this.loadGamificationStatus(userId);
    }
  }

  loadGamificationStatus(userId: number) {
    this.emotionService.getGamificationStatus(userId).subscribe({
      next: (data) => {
        this.gamificationStatus = data;
        this.cdr.detectChanges();
      },
      error: () => {
        this.gamificationStatus = { PuntosGanados: 0 };
        this.cdr.detectChanges();
      }
    });
  }

  saveProfile() {
    if (this.profileForm.invalid || !this.user) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';

    const emailChanged = this.user.email !== this.profileForm.value.email;

    this.usuarioService.updateProfile(this.user.id, this.profileForm.value).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.isSaving = false;

        if (emailChanged) {
          alert('Tu correo ha cambiado. Por favor inicia sesión nuevamente con tus nuevas credenciales.');
          this.logout();
          return;
        }

        this.successMessage = 'Perfil actualizado eéxitosamente.';
        localStorage.setItem(STORAGE_KEYS.USER_NAME, updatedUser.name);
        this.cdr.detectChanges();

        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error('Error updating profile', err);
        this.isSaving = false;
        this.errorMessage = 'Hubo un error al actualizar el perfil.';
        this.cdr.detectChanges();
      }
    });
  }

  changePassword() {
    if (this.passwordForm.invalid || !this.user) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.isChangingPassword = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.usuarioService.changePassword(this.user.id, {
      currentPassword: this.passwordForm.value.currentPassword,
      newPassword: this.passwordForm.value.newPassword
    }).subscribe({
      next: () => {
        alert('Contraseña actualizada con ééxito. Por seguridad, inicia sesión nuevamente.');
        this.logout();
      },
      error: (err) => {
        console.error('Password change error:', err);
        this.isChangingPassword = false;
        let msg = 'No se pudo cambiar la contraseña. Verifica tu contraseña actual.';
        if (err.error?.message) msg = err.error.message;
        else if (err.error && typeof err.error === 'string') msg = err.error;
        this.errorMessage = msg;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.detectChanges();
        }, 5000);
      }
    });
  }

  deleteAccount() {
    if (!this.user) return;
    if (confirm('¿Estás seguro de que deseas eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
      this.usuarioService.deleteUser(this.user.id).subscribe({
        next: () => {
          alert('Cuenta eliminada. Lamentamos verte partir.');
          this.logout();
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'No se pudo eliminar la cuenta.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && this.user) {
      this.isUploading = true;
      this.usuarioService.uploadProfilePicture(this.user.id, file).subscribe({
        next: (updatedUser) => {
          this.user = updatedUser;
          this.authService.setProfilePictureUrl(updatedUser.profilePictureUrl || null);
          this.isUploading = false;
          this.successMessage = 'Foto actualizada.';
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.isUploading = false;
          this.errorMessage = 'Error al subir la foto.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  removeProfilePicture() {
    if (!this.user) return;
    this.isUploading = true;
    this.usuarioService.deleteProfilePicture(this.user.id).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.authService.setProfilePictureUrl(null);
        this.isUploading = false;
        this.successMessage = 'Foto eliminada.';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isUploading = false;
        this.errorMessage = 'Error al eliminar la foto.';
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





