import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslationService, Language } from '../../services/translation.service';

interface UserProfile {
  fullName: string;
  email: string;
  avatar: string;
  notificationsEnabled: boolean;
  twoFactorEnabled: boolean;
  selectedLanguage: string;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  selectedTabIndex = 0;
  isLoading = false;
  
  // Profile data
  currentUser: UserProfile = {
    fullName: 'Juan Perez',
    email: 'juan.perez@example.com',
    avatar: '',
    notificationsEnabled: true,
    twoFactorEnabled: false,
    selectedLanguage: 'en'
  };

  // Language data
  availableLanguages: Language[] = [];
  currentLanguage = 'en';
  
  // Avatar upload
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  maxFileSize = 2 * 1024 * 1024; // 2MB
  allowedTypes = ['image/jpeg', 'image/png'];
  
  // Password visibility
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserSettingsComponent>,
    private snackBar: MatSnackBar,
    private translationService: TranslationService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.profileForm = this.fb.group({
      fullName: [this.currentUser.fullName, [Validators.required, Validators.minLength(2)]],
      email: [this.currentUser.email, [Validators.required, Validators.email]],
      notificationsEnabled: [this.currentUser.notificationsEnabled],
      twoFactorEnabled: [this.currentUser.twoFactorEnabled]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, this.strongPasswordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private loadUserData(): void {
    // Simulate loading user data
    this.profileForm.patchValue(this.currentUser);
    if (this.currentUser.avatar) {
      this.imagePreview = this.currentUser.avatar;
    }
  }

  // Custom validators
  private strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;
    if (!password) return null;

    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const valid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSymbol;

    if (!valid) {
      return {
        strongPassword: {
          hasMinLength,
          hasUpperCase,
          hasLowerCase,
          hasNumber,
          hasSymbol
        }
      };
    }

    return null;
  }

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  // Avatar upload methods
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!this.allowedTypes.includes(file.type)) {
      this.showError('Please select a JPEG or PNG image file.');
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.showError('File size must be less than 2MB.');
      return;
    }

    this.selectedFile = file;
    this.createImagePreview(file);
  }

  private createImagePreview(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.imagePreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  onRemoveAvatar(): void {
    this.selectedFile = null;
    this.imagePreview = null;
    this.currentUser.avatar = '';
  }

  // Form submission methods
  onSaveProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isLoading = true;
    
    // Simulate API call
    setTimeout(() => {
      const formData = this.profileForm.value;
      this.currentUser = { ...this.currentUser, ...formData };
      
      if (this.selectedFile) {
        // In a real app, you would upload the file to a server
        this.currentUser.avatar = this.imagePreview || '';
      }
      
      this.isLoading = false;
      this.showSuccess('Profile updated successfully!');
    }, 1000);
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isLoading = true;
    
    // Simulate password change API call
    setTimeout(() => {
      const passwordData = this.passwordForm.value as PasswordChangeData;
      
      // In a real app, verify current password with backend
      if (this.verifyCurrentPassword(passwordData.currentPassword)) {
        this.passwordForm.reset();
        this.isLoading = false;
        this.showSuccess('Password changed successfully!');
      } else {
        this.isLoading = false;
        this.passwordForm.get('currentPassword')?.setErrors({ incorrect: true });
        this.showError('Current password is incorrect.');
      }
    }, 1000);
  }

  private verifyCurrentPassword(password: string): boolean {
    // Simulate password verification
    // In a real app, this would make an API call
    return password === 'currentPassword123'; // Mock validation
  }

  // UI helper methods
  getPasswordStrengthText(): string {
    const newPasswordControl = this.passwordForm.get('newPassword');
    if (!newPasswordControl?.value) return '';

    const errors = newPasswordControl.errors?.['strongPassword'];
    if (!errors) return 'Strong password';

    const missing = [];
    if (!errors.hasMinLength) missing.push('8+ characters');
    if (!errors.hasUpperCase) missing.push('uppercase letter');
    if (!errors.hasLowerCase) missing.push('lowercase letter');
    if (!errors.hasNumber) missing.push('number');
    if (!errors.hasSymbol) missing.push('symbol');

    return `Missing: ${missing.join(', ')}`;
  }

  getPasswordStrengthColor(): string {
    const newPasswordControl = this.passwordForm.get('newPassword');
    if (!newPasswordControl?.value) return '';

    const errors = newPasswordControl.errors?.['strongPassword'];
    if (!errors) return 'primary';

    const missing = Object.values(errors).filter(v => !v).length;
    if (missing >= 4) return 'warn';
    if (missing >= 2) return 'accent';
    return 'primary';
  }

  hasSpecialChar(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  }

  hasUpperCase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasLowerCase(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /[a-z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return /\d/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.passwordForm.get('newPassword')?.value || '';
    return password.length >= 8;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
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

  onCancel(): void {
    this.dialogRef.close();
  }

  onDeleteAccount(): void {
    // This would typically show a confirmation dialog
    console.log('Delete account clicked - implement confirmation dialog');
  }
}
