import { Component, ChangeDetectorRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register-component.html',
  styleUrl: './register-component.css'
})
export class Register implements OnInit {
  private fb: FormBuilder = inject(FormBuilder);
  private authService: AuthService = inject(AuthService);
  private router: Router = inject(Router);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    age: [null, [Validators.required, Validators.min(10), Validators.max(99)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rolId: [1, Validators.required],
    specialty: [''],
    clinicName: ['']
  });

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  ngOnInit() {
    this.registerForm.get('rolId')?.valueChanges.subscribe(role => {
      const specControl = this.registerForm.get('specialty');
      const clinicControl = this.registerForm.get('clinicName');

      if (role === 2) {
        specControl?.setValidators([Validators.required, Validators.minLength(3)]);
        clinicControl?.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        specControl?.clearValidators();
        clinicControl?.clearValidators();
        specControl?.setValue('');
        clinicControl?.setValue('');
      }
      specControl?.updateValueAndValidity();
      clinicControl?.updateValueAndValidity();
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const data = {
      name: this.registerForm.value.name,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      age: this.registerForm.value.age,
      rolId: parseInt(this.registerForm.value.rolId, 10),
      specialty: this.registerForm.value.specialty,
      clinicName: this.registerForm.value.clinicName
    };

    this.authService.register(data).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = '¡Cuenta registrada con ééxito! Redirigiendo...';
        this.registerForm.disable();
        this.cdr.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al registrar la cuenta. Es posible que el correo ya exista.';
        this.cdr.detectChanges();
        console.error('Error de registro:', error);
      }
    });
  }
}





