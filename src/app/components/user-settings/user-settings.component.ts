import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslationService, Language } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';
import { CurrencyService, Currency } from '../../services/currency.service';

interface UserProfile {
  fullName: string;
  email: string;
  avatar: string;
  notificationsEnabled: boolean;
  twoFactorEnabled: boolean;
  selectedLanguage: string;
  selectedCurrency?: string;
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

  // Currency data
  availableCurrencies: Currency[] = [];
  currentCurrency?: Currency;
  hasUserSelectedCurrency = false;

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
    private translationService: TranslationService,
    private authService: AuthService,
    private currencyService: CurrencyService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.initializeLanguageData();
    this.initializeCurrencyData();
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
      twoFactorEnabled: [this.currentUser.twoFactorEnabled],
      selectedLanguage: [this.currentUser.selectedLanguage, [Validators.required]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, this.strongPasswordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  private loadUserData(): void {
    // Get current language from translation service
    this.currentUser.selectedLanguage = this.translationService.getCurrentLanguage();

    // Update form with user data
    this.profileForm.patchValue(this.currentUser);
    if (this.currentUser.avatar) {
      this.imagePreview = this.currentUser.avatar;
    }
  }

  private initializeLanguageData(): void {
    // Get available languages
    this.availableLanguages = this.translationService.getAvailableLanguages();

    // Subscribe to current language changes
    this.translationService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
        this.currentUser.selectedLanguage = language;
        this.profileForm.patchValue({ selectedLanguage: language });
      });
  }

  private initializeCurrencyData(): void {
    // Get available currencies
    this.availableCurrencies = this.currencyService.getAvailableCurrencies();

    // Subscribe to effective currency changes
    this.currencyService.effectiveCurrency$
      .pipe(takeUntil(this.destroy$))
      .subscribe(currency => {
        this.currentCurrency = currency;
        this.currentUser.selectedCurrency = currency.code;
      });

    // Subscribe to user currency selection status
    this.currencyService.userSelectedCurrency$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userCurrency => {
        this.hasUserSelectedCurrency = userCurrency !== null;
      });
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
      const previousLanguage = this.currentUser.selectedLanguage;

      this.currentUser = { ...this.currentUser, ...formData };

      if (this.selectedFile) {
        // In a real app, you would upload the file to a server
        this.currentUser.avatar = this.imagePreview || '';
      }

      // Handle language change
      if (formData.selectedLanguage !== previousLanguage) {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.username) {
          this.translationService.saveUserLanguagePreference(
            currentUser.username,
            formData.selectedLanguage
          );
        } else {
          this.translationService.setLanguage(formData.selectedLanguage);
        }
      }

      this.isLoading = false;
      this.showSuccess(this.translationService.instant('USER_SETTINGS.PROFILE_UPDATED'));
    }, 1000);
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isLoading = true;
    const passwordData = this.passwordForm.value as PasswordChangeData;

    // Use secure AuthService method
    this.authService.changePassword(passwordData.currentPassword, passwordData.newPassword)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (success) => {
          this.isLoading = false;
          if (success) {
            this.passwordForm.reset();
            this.showSuccess(this.translationService.instant('USER_SETTINGS.PASSWORD_CHANGED'));
          } else {
            this.passwordForm.get('currentPassword')?.setErrors({ incorrect: true });
            this.showError(this.translationService.instant('USER_SETTINGS.CURRENT_PASSWORD_INCORRECT'));
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.showError(this.translationService.instant('USER_SETTINGS.PASSWORD_CHANGE_FAILED'));
          console.error('Password change error:', error);
        }
      });
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

  onCurrencyChanged(currencyCode: string | null): void {
    // Currency change is handled by the currency selector component
    // and the currency service, but we can show a success message
    const message = currencyCode
      ? this.translationService.instant('USER_SETTINGS.CURRENCY_UPDATED')
      : this.translationService.instant('USER_SETTINGS.CURRENCY_AUTO_ENABLED');

    this.showSuccess(message);
  }

  getCurrentCurrencyDisplayName(): string {
    if (!this.currentCurrency) return '';

    if (this.hasUserSelectedCurrency) {
      return `${this.currentCurrency.name} (${this.currentCurrency.code})`;
    } else {
      return `${this.currentCurrency.name} (${this.translationService.instant('CURRENCY.AUTO_FROM_LANGUAGE')})`;
    }
  }
}
