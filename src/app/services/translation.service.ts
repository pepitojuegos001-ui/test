import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguageSubject = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private readonly LANGUAGE_KEY = 'financial_dashboard_language';
  private readonly USER_LANGUAGE_KEY = 'financial_dashboard_user_language';

  private readonly availableLanguages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' }
  ];

  constructor(private translateService: TranslateService) {
    this.initializeTranslation();
  }

  private initializeTranslation(): void {
    // Always set English as default language
    this.translateService.setDefaultLang('en');

    // Start with English - user preference will be loaded after login
    this.setLanguage('en');
  }

  private getSavedLanguage(): string | null {
    try {
      return localStorage.getItem(this.LANGUAGE_KEY);
    } catch (error) {
      console.warn('Could not read language preference from localStorage:', error);
      return null;
    }
  }

  private getBrowserLanguage(): string {
    const browserLang = this.translateService.getBrowserLang() || 'en';
    // Check if the browser language is supported
    const supportedLang = this.availableLanguages.find(lang => 
      browserLang.toLowerCase().includes(lang.code)
    );
    return supportedLang ? supportedLang.code : 'en';
  }

  setLanguage(languageCode: string): void {
    if (this.isLanguageSupported(languageCode)) {
      this.translateService.use(languageCode);
      this.currentLanguageSubject.next(languageCode);
      this.saveLanguagePreference(languageCode);
    } else {
      console.warn(`Language '${languageCode}' is not supported. Falling back to English.`);
      this.setLanguage('en');
    }
  }

  private isLanguageSupported(languageCode: string): boolean {
    return this.availableLanguages.some(lang => lang.code === languageCode);
  }

  private saveLanguagePreference(languageCode: string): void {
    try {
      localStorage.setItem(this.LANGUAGE_KEY, languageCode);
    } catch (error) {
      console.warn('Could not save language preference to localStorage:', error);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  getAvailableLanguages(): Language[] {
    return [...this.availableLanguages];
  }

  getLanguageName(languageCode: string): string {
    const language = this.availableLanguages.find(lang => lang.code === languageCode);
    return language ? language.name : languageCode;
  }

  getLanguageFlag(languageCode: string): string {
    const language = this.availableLanguages.find(lang => lang.code === languageCode);
    return language ? language.flag : '🌐';
  }

  // Convenience method to get translation
  get(key: string, params?: any): Observable<string> {
    return this.translateService.get(key, params);
  }

  // Convenience method to get instant translation
  instant(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }

  // Method to get translated months array
  getTranslatedMonths(): string[] {
    return [
      this.instant('MONTHS.JANUARY'),
      this.instant('MONTHS.FEBRUARY'),
      this.instant('MONTHS.MARCH'),
      this.instant('MONTHS.APRIL'),
      this.instant('MONTHS.MAY'),
      this.instant('MONTHS.JUNE'),
      this.instant('MONTHS.JULY'),
      this.instant('MONTHS.AUGUST'),
      this.instant('MONTHS.SEPTEMBER'),
      this.instant('MONTHS.OCTOBER'),
      this.instant('MONTHS.NOVEMBER'),
      this.instant('MONTHS.DECEMBER')
    ];
  }

  // Methods for user-specific language management

  /**
   * Load user's preferred language after authentication
   * This should be called after successful login
   */
  loadUserLanguagePreference(username: string): void {
    const userLanguageKey = `${this.USER_LANGUAGE_KEY}_${username}`;
    const userLanguage = this.getUserLanguagePreference(userLanguageKey);

    if (userLanguage && this.isLanguageSupported(userLanguage)) {
      this.setLanguage(userLanguage);
    }
  }

  /**
   * Save user's language preference
   * This will be associated with their username
   */
  saveUserLanguagePreference(username: string, languageCode: string): void {
    if (this.isLanguageSupported(languageCode)) {
      const userLanguageKey = `${this.USER_LANGUAGE_KEY}_${username}`;
      try {
        localStorage.setItem(userLanguageKey, languageCode);
        this.setLanguage(languageCode);
      } catch (error) {
        console.warn('Could not save user language preference:', error);
      }
    }
  }

  /**
   * Get user's saved language preference
   */
  private getUserLanguagePreference(userLanguageKey: string): string | null {
    try {
      return localStorage.getItem(userLanguageKey);
    } catch (error) {
      console.warn('Could not read user language preference:', error);
      return null;
    }
  }

  /**
   * Reset to default language (English)
   * This should be called on logout
   */
  resetToDefaultLanguage(): void {
    this.setLanguage('en');
  }

  /**
   * Clear user-specific language preferences
   * This can be called on logout to clean up
   */
  clearUserLanguagePreferences(username?: string): void {
    try {
      if (username) {
        const userLanguageKey = `${this.USER_LANGUAGE_KEY}_${username}`;
        localStorage.removeItem(userLanguageKey);
      } else {
        // Clear all user language preferences
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(this.USER_LANGUAGE_KEY)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      console.warn('Could not clear user language preferences:', error);
    }
  }
}
