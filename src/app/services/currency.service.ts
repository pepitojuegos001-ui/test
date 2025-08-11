import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { TranslationService } from './translation.service';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  locale: string;
  flag: string;
}

export interface CurrencyFormattingOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSymbol?: boolean;
  useGrouping?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly CURRENCY_KEY = 'financial_dashboard_currency';
  private readonly USER_CURRENCY_KEY = 'financial_dashboard_user_currency';

  // Language to Currency mapping
  private readonly languageCurrencyMap: Record<string, string> = {
    'en': 'USD', // English → US Dollar
    'es': 'ARS', // Spanish → Argentine Peso
    'pt': 'BRL', // Portuguese → Brazilian Real
    'it': 'EUR', // Italian → Euro
    'fr': 'EUR'  // French → Euro
  };

  // Base currency data (names will be translated)
  private readonly baseCurrencies = [
    {
      code: 'USD',
      locale: 'en-US',
      flag: 'assets/images/flags/us.png'
    },
    {
      code: 'ARS',
      locale: 'es-AR',
      flag: 'assets/images/flags/ar.png'
    },
    {
      code: 'BRL',
      locale: 'pt-BR',
      flag: 'assets/images/flags/br.png'
    },
    {
      code: 'EUR',
      locale: 'en-GB',
      flag: 'assets/images/flags/eu.png'
    }
  ];

  // Translation service will be injected after construction to avoid circular dependency
  private translationService?: TranslationService;

  // Reactive streams
  private currentCurrencySubject = new BehaviorSubject<string>('USD');
  private userSelectedCurrencySubject = new BehaviorSubject<string | null>(null);

  public currentCurrency$ = this.currentCurrencySubject.asObservable();
  public userSelectedCurrency$ = this.userSelectedCurrencySubject.asObservable();

  // Combined stream that provides the effective currency
  public effectiveCurrency$: Observable<Currency> = combineLatest([
    this.currentCurrency$,
    this.userSelectedCurrency$
  ]).pipe(
    map(([languageCurrency, userCurrency]) => {
      const effectiveCode = userCurrency || languageCurrency;
      const currency = this.getCurrency(effectiveCode) || this.getCurrency('USD')!;
      console.log(`Effective currency calculated: ${currency.code} (language: ${languageCurrency}, user: ${userCurrency})`);
      return currency;
    }),
    distinctUntilChanged((prev, curr) => prev.code === curr.code)
  );

  constructor() {
    this.initializeCurrency();
  }

  // Method to set translation service (called from app initialization)
  setTranslationService(translationService: TranslationService): void {
    this.translationService = translationService;
  }

  private initializeCurrency(): void {
    // Load user preference first
    const userCurrency = this.getUserSelectedCurrency();
    if (userCurrency && this.isCurrencySupported(userCurrency)) {
      this.userSelectedCurrencySubject.next(userCurrency);
    }

    // Load or set default language-based currency
    const savedLanguageCurrency = this.getSavedLanguageCurrency();
    const defaultCurrency = savedLanguageCurrency || 'USD';
    this.currentCurrencySubject.next(defaultCurrency);
  }

  /**
   * Update currency based on language change
   * This method should be called when language changes
   */
  updateCurrencyForLanguage(languageCode: string): void {
    const mappedCurrency = this.languageCurrencyMap[languageCode] || 'USD';

    // Always update the language-based currency
    this.currentCurrencySubject.next(mappedCurrency);
    this.saveLanguageCurrency(mappedCurrency);

    // Log for debugging
    console.log(`Language changed to ${languageCode}, currency updated to ${mappedCurrency}, user override: ${this.userSelectedCurrencySubject.value}`);
  }

  /**
   * Set user-selected currency (overrides language-based currency)
   */
  setUserCurrency(currencyCode: string, username?: string): void {
    if (!this.isCurrencySupported(currencyCode)) {
      console.warn(`Currency '${currencyCode}' is not supported`);
      return;
    }

    this.userSelectedCurrencySubject.next(currencyCode);
    this.saveUserCurrency(currencyCode, username);
  }

  /**
   * Clear user-selected currency (revert to language-based)
   */
  clearUserCurrency(username?: string): void {
    this.userSelectedCurrencySubject.next(null);
    this.removeUserCurrency(username);
  }

  /**
   * Get current effective currency
   */
  getCurrentCurrency(): Currency {
    const userCurrency = this.userSelectedCurrencySubject.value;
    const languageCurrency = this.currentCurrencySubject.value;
    const effectiveCode = userCurrency || languageCurrency;
    return this.getCurrency(effectiveCode) || this.getCurrency('USD')!;
  }

  /**
   * Get currency by code with translated name
   */
  getCurrency(code: string): Currency | undefined {
    const baseCurrency = this.baseCurrencies.find(currency => currency.code === code);
    if (!baseCurrency) return undefined;

    return {
      code: baseCurrency.code,
      name: this.getTranslatedCurrencyName(baseCurrency.code),
      symbol: this.getTranslatedCurrencySymbol(baseCurrency.code),
      locale: baseCurrency.locale,
      flag: baseCurrency.flag
    };
  }

  /**
   * Get all available currencies with translated names
   */
  getAvailableCurrencies(): Currency[] {
    return this.baseCurrencies.map(baseCurrency => ({
      code: baseCurrency.code,
      name: this.getTranslatedCurrencyName(baseCurrency.code),
      symbol: this.getTranslatedCurrencySymbol(baseCurrency.code),
      locale: baseCurrency.locale,
      flag: baseCurrency.flag
    }));
  }

  /**
   * Check if currency is supported
   */
  isCurrencySupported(code: string): boolean {
    return this.baseCurrencies.some(currency => currency.code === code);
  }

  /**
   * Get translated currency name
   */
  private getTranslatedCurrencyName(code: string): string {
    if (this.translationService) {
      const translated = this.translationService.instant(`CURRENCY.NAMES.${code}`);
      // Check if translation actually worked (if it returns the key, translation failed)
      if (translated && !translated.startsWith('CURRENCY.NAMES.')) {
        return translated;
      }
    }
    // Fallback to English names
    const fallbackNames: Record<string, string> = {
      'USD': 'US Dollar',
      'ARS': 'Argentine Peso',
      'BRL': 'Brazilian Real',
      'EUR': 'Euro'
    };
    return fallbackNames[code] || code;
  }

  /**
   * Get translated currency symbol
   */
  private getTranslatedCurrencySymbol(code: string): string {
    if (this.translationService) {
      const translated = this.translationService.instant(`CURRENCY.SYMBOLS.${code}`);
      // Check if translation actually worked
      if (translated && !translated.startsWith('CURRENCY.SYMBOLS.')) {
        return translated;
      }
    }
    // Fallback to default symbols
    const fallbackSymbols: Record<string, string> = {
      'USD': '$',
      'ARS': '$',
      'BRL': 'R$',
      'EUR': '€'
    };
    return fallbackSymbols[code] || code;
  }

  /**
   * Format amount with current currency
   */
  formatAmount(
    amount: number, 
    options: CurrencyFormattingOptions = {}
  ): string {
    const currency = this.getCurrentCurrency();
    return this.formatAmountWithCurrency(amount, currency, options);
  }

  /**
   * Format amount with specific currency
   */
  formatAmountWithCurrency(
    amount: number, 
    currency: Currency, 
    options: CurrencyFormattingOptions = {}
  ): string {
    const defaultOptions = {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      showSymbol: true,
      useGrouping: true
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const formatter = new Intl.NumberFormat(currency.locale, {
        style: 'currency',
        currency: currency.code,
        minimumFractionDigits: finalOptions.minimumFractionDigits,
        maximumFractionDigits: finalOptions.maximumFractionDigits,
        useGrouping: finalOptions.useGrouping
      });

      return formatter.format(Math.abs(amount));
    } catch (error) {
      console.warn(`Failed to format currency ${currency.code}:`, error);
      // Fallback formatting
      const symbol = finalOptions.showSymbol ? currency.symbol : '';
      const formatted = Math.abs(amount).toLocaleString(undefined, {
        minimumFractionDigits: finalOptions.minimumFractionDigits,
        maximumFractionDigits: finalOptions.maximumFractionDigits,
        useGrouping: finalOptions.useGrouping
      });
      return `${symbol}${formatted}`;
    }
  }

  /**
   * Get default currency for language
   */
  getDefaultCurrencyForLanguage(languageCode: string): string {
    return this.languageCurrencyMap[languageCode] || 'USD';
  }

  /**
   * Check if user has manually selected currency
   */
  hasUserSelectedCurrency(): boolean {
    return this.userSelectedCurrencySubject.value !== null;
  }

  /**
   * Force refresh of currency settings (useful for troubleshooting sync issues)
   */
  refreshCurrencySettings(username?: string): void {
    console.log('Forcing currency settings refresh');

    if (username) {
      this.loadUserCurrencyPreference(username);
    }

    // Also refresh the language-based currency
    if (this.translationService) {
      const currentLanguage = this.translationService.getCurrentLanguage();
      this.updateCurrencyForLanguage(currentLanguage);
    }
  }

  /**
   * Load user's currency preference after authentication
   */
  loadUserCurrencyPreference(username: string): void {
    const userCurrencyKey = `${this.USER_CURRENCY_KEY}_${username}`;
    const userCurrency = this.getUserCurrencyPreference(userCurrencyKey);

    console.log(`Loading user currency preference for ${username}: ${userCurrency}`);

    if (userCurrency && this.isCurrencySupported(userCurrency)) {
      this.userSelectedCurrencySubject.next(userCurrency);
    } else {
      // No user preference, ensure we're using language-based currency
      this.userSelectedCurrencySubject.next(null);
    }
  }

  /**
   * Clear user-specific currency preferences
   */
  clearUserCurrencyPreferences(username?: string): void {
    try {
      if (username) {
        const userCurrencyKey = `${this.USER_CURRENCY_KEY}_${username}`;
        localStorage.removeItem(userCurrencyKey);
      } else {
        // Clear all user currency preferences
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
          if (key.startsWith(this.USER_CURRENCY_KEY)) {
            localStorage.removeItem(key);
          }
        });
      }
      this.userSelectedCurrencySubject.next(null);
    } catch (error) {
      console.warn('Could not clear user currency preferences:', error);
    }
  }

  // Private helper methods

  private getSavedLanguageCurrency(): string | null {
    try {
      return localStorage.getItem(this.CURRENCY_KEY);
    } catch (error) {
      console.warn('Could not read currency preference from localStorage:', error);
      return null;
    }
  }

  private saveLanguageCurrency(currencyCode: string): void {
    try {
      localStorage.setItem(this.CURRENCY_KEY, currencyCode);
    } catch (error) {
      console.warn('Could not save currency preference to localStorage:', error);
    }
  }

  private getUserSelectedCurrency(): string | null {
    try {
      return localStorage.getItem(`${this.USER_CURRENCY_KEY}_default`);
    } catch (error) {
      console.warn('Could not read user currency preference:', error);
      return null;
    }
  }

  private saveUserCurrency(currencyCode: string, username?: string): void {
    try {
      const key = username 
        ? `${this.USER_CURRENCY_KEY}_${username}`
        : `${this.USER_CURRENCY_KEY}_default`;
      localStorage.setItem(key, currencyCode);
    } catch (error) {
      console.warn('Could not save user currency preference:', error);
    }
  }

  private removeUserCurrency(username?: string): void {
    try {
      const key = username 
        ? `${this.USER_CURRENCY_KEY}_${username}`
        : `${this.USER_CURRENCY_KEY}_default`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Could not remove user currency preference:', error);
    }
  }

  private getUserCurrencyPreference(userCurrencyKey: string): string | null {
    try {
      return localStorage.getItem(userCurrencyKey);
    } catch (error) {
      console.warn('Could not read user currency preference:', error);
      return null;
    }
  }
}
