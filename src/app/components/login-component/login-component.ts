import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { ROLES, ROUTES } from '../../constants/app.constants';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css'
})
export class Login {
  private fb: FormBuilder = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading = false;
        const role = this.authService.getUserRole();
        if (role && ROLES.PATIENT.includes(role as any)) {
          this.router.navigate([ROUTES.PATIENT_DASHBOARD]);
        } else if (role && ROLES.PSYCHOLOGIST.includes(role as any)) {
          this.router.navigate([ROUTES.PSYCH_DASHBOARD]);
        } else {
          this.errorMessage = 'Rol no reconocido: ' + role;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales inválidías o servidor desconectado.';
        this.loginForm.reset();
        this.cdr.detectChanges();
        console.error('Error de login:', error);
      }
    });
  }
}





