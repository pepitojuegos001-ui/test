import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../services/auth.service';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  loginError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    console.log('LoginComponent: ngOnInit called');
    try {
      this.initializeForm();
      console.log('LoginComponent: Form initialized successfully');
    } catch (error) {
      console.error('LoginComponent: Error initializing form:', error);
    }
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.loginError = '';

    const { username, password, rememberMe } = this.loginForm.value;

    this.authService.login(username, password, rememberMe).subscribe({
      next: (success) => {
        this.isLoading = false;
        
        if (success) {
          this.showSuccess('Login successful! Welcome back.');
          
          // Check for return URL or default to dashboard
          const returnUrl = localStorage.getItem('returnUrl') || '/dashboard';
          localStorage.removeItem('returnUrl');
          
          this.router.navigate([returnUrl]);
        } else {
          this.loginError = 'Invalid username or password. Please try again.';
          this.showError('Invalid credentials. Please check your username and password.');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.loginError = 'An error occurred during login. Please try again.';
        this.showError('Login failed. Please try again.');
        console.error('Login error:', error);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  // Helper methods for form validation display
  getUsernameErrorMessage(): string {
    const usernameControl = this.loginForm.get('username');
    if (usernameControl?.hasError('required')) {
      return 'Username is required';
    }
    if (usernameControl?.hasError('minlength')) {
      return 'Username must be at least 3 characters long';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Password is required';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  }
}
