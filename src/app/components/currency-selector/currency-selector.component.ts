import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CurrencyService, Currency } from '../../services/currency.service';
import { TranslationService } from '../../services/translation.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-currency-selector',
  template: `
    <div class="currency-selector">
      <mat-form-field appearance="outline" class="currency-field">
        <mat-label>{{ 'CURRENCY.PREFERRED_CURRENCY' | translate }}</mat-label>
        <mat-select 
          [(value)]="selectedCurrency" 
          (selectionChange)="onCurrencyChange($event)"
          [placeholder]="'CURRENCY.SELECT_CURRENCY' | translate">
          
          <!-- Option to use automatic language-based currency -->
          <mat-option [value]="null" class="auto-option">
            <div class="currency-option auto-currency">
              <mat-icon class="auto-icon">language</mat-icon>
              <div class="currency-info">
                <span class="currency-name">{{ 'CURRENCY.AUTO_BASED_ON_LANGUAGE' | translate }}</span>
                <small class="currency-description">
                  {{ 'CURRENCY.CURRENTLY' | translate }}: {{ getLanguageBasedCurrency()?.name }}
                </small>
              </div>
            </div>
          </mat-option>

          <mat-divider></mat-divider>

          <!-- Manual currency options -->
          <mat-option 
            *ngFor="let currency of availableCurrencies" 
            [value]="currency.code"
            class="currency-option-item">
            <div class="currency-option">
              <img 
                [src]="currency.flag" 
                [alt]="currency.name"
                class="currency-flag"
                (error)="onImageError($event)">
              <div class="currency-info">
                <span class="currency-name">{{ currency.name }}</span>
                <small class="currency-code">{{ currency.code }} ({{ currency.symbol }})</small>
              </div>
            </div>
          </mat-option>
        </mat-select>
        
        <mat-icon matSuffix>account_balance</mat-icon>
        
        <mat-hint *ngIf="!hasUserSelection">
          {{ 'CURRENCY.AUTO_HINT' | translate }}
        </mat-hint>
        <mat-hint *ngIf="hasUserSelection">
          {{ 'CURRENCY.MANUAL_HINT' | translate }}
        </mat-hint>
      </mat-form-field>

      <!-- Currency preview -->
      <div class="currency-preview" *ngIf="previewAmount !== undefined">
        <mat-card class="preview-card">
          <mat-card-header>
            <mat-card-title class="preview-title">
              <mat-icon>preview</mat-icon>
              {{ 'CURRENCY.PREVIEW' | translate }}
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="preview-examples">
              <div class="preview-item">
                <span class="preview-label">{{ 'CURRENCY.INCOME_EXAMPLE' | translate }}:</span>
                <span class="preview-value income">{{ formatPreviewAmount(previewAmount) }}</span>
              </div>
              <div class="preview-item">
                <span class="preview-label">{{ 'CURRENCY.EXPENSE_EXAMPLE' | translate }}:</span>
                <span class="preview-value expense">{{ formatPreviewAmount(-previewAmount) }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Reset option -->
      <div class="currency-actions" *ngIf="hasUserSelection">
        <button 
          mat-stroked-button 
          color="accent"
          (click)="onResetToAuto()"
          class="reset-button">
          <mat-icon>restore</mat-icon>
          {{ 'CURRENCY.RESET_TO_AUTO' | translate }}
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./currency-selector.component.scss']
})
export class CurrencySelectorComponent implements OnInit, OnDestroy {
  @Input() previewAmount: number = 1500; // Default preview amount
  @Output() currencyChanged = new EventEmitter<string | null>();

  private destroy$ = new Subject<void>();

  availableCurrencies: Currency[] = [];
  selectedCurrency: string | null = null;
  hasUserSelection = false;
  currentLanguage = 'en';

  constructor(
    private currencyService: CurrencyService,
    private translationService: TranslationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    this.availableCurrencies = this.currencyService.getAvailableCurrencies();
    this.currentLanguage = this.translationService.getCurrentLanguage();
  }

  private setupSubscriptions(): void {
    // Subscribe to user-selected currency changes
    this.currencyService.userSelectedCurrency$
      .pipe(takeUntil(this.destroy$))
      .subscribe(userCurrency => {
        this.selectedCurrency = userCurrency;
        this.hasUserSelection = userCurrency !== null;
      });

    // Subscribe to language changes
    this.translationService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(language => {
        this.currentLanguage = language;
        // Refresh available currencies to get updated translated names
        this.availableCurrencies = this.currencyService.getAvailableCurrencies();
      });
  }

  onCurrencyChange(event: any): void {
    const selectedValue = event.value;
    const currentUser = this.authService.getCurrentUser();
    
    if (selectedValue === null) {
      // User chose automatic currency
      this.currencyService.clearUserCurrency(currentUser?.username);
    } else {
      // User chose specific currency
      this.currencyService.setUserCurrency(selectedValue, currentUser?.username);
    }

    this.currencyChanged.emit(selectedValue);
  }

  onResetToAuto(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currencyService.clearUserCurrency(currentUser?.username);
    this.selectedCurrency = null;
    this.currencyChanged.emit(null);
  }

  getLanguageBasedCurrency(): Currency | undefined {
    const defaultCode = this.currencyService.getDefaultCurrencyForLanguage(this.currentLanguage);
    return this.currencyService.getCurrency(defaultCode);
  }

  formatPreviewAmount(amount: number): string {
    if (this.selectedCurrency) {
      const currency = this.currencyService.getCurrency(this.selectedCurrency);
      if (currency) {
        return this.currencyService.formatAmountWithCurrency(amount, currency);
      }
    }
    
    // Use current effective currency
    return this.currencyService.formatAmount(amount);
  }

  onImageError(event: any): void {
    // Fallback to a default flag or hide the image
    event.target.style.display = 'none';
  }
}
