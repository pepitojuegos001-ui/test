import { Injectable, Inject, LOCALE_ID } from '@angular/core';
import { DatePipe, formatDate, registerLocaleData } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { TranslationService } from './translation.service';

// Import locale data
import localeEn from '@angular/common/locales/en';
import localeEs from '@angular/common/locales/es';
import localeFr from '@angular/common/locales/fr';
import localeIt from '@angular/common/locales/it';
import localePt from '@angular/common/locales/pt';

export interface LocaleConfig {
  code: string;
  dateFormat: string;
  shortDateFormat: string;
  longDateFormat: string;
  timeFormat: string;
  dateTimeFormat: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  dateInputFormat: string; // For form inputs
}

@Injectable({
  providedIn: 'root'
})
export class LocaleDateService {
  private currentLocaleSubject = new BehaviorSubject<string>('en-US');
  public currentLocale$ = this.currentLocaleSubject.asObservable();

  private readonly localeConfigs: Record<string, LocaleConfig> = {
    'en': {
      code: 'en-US',
      dateFormat: 'MM/dd/yyyy',
      shortDateFormat: 'M/d/yy',
      longDateFormat: 'MMMM d, yyyy',
      timeFormat: 'h:mm a',
      dateTimeFormat: 'MM/dd/yyyy h:mm a',
      firstDayOfWeek: 0, // Sunday
      dateInputFormat: 'yyyy-MM-dd'
    },
    'es': {
      code: 'es-ES',
      dateFormat: 'dd/MM/yyyy',
      shortDateFormat: 'd/M/yy',
      longDateFormat: 'd \'de\' MMMM \'de\' yyyy',
      timeFormat: 'HH:mm',
      dateTimeFormat: 'dd/MM/yyyy HH:mm',
      firstDayOfWeek: 1, // Monday
      dateInputFormat: 'yyyy-MM-dd'
    },
    'fr': {
      code: 'fr-FR',
      dateFormat: 'dd/MM/yyyy',
      shortDateFormat: 'dd/MM/yy',
      longDateFormat: 'd MMMM yyyy',
      timeFormat: 'HH:mm',
      dateTimeFormat: 'dd/MM/yyyy HH:mm',
      firstDayOfWeek: 1, // Monday
      dateInputFormat: 'yyyy-MM-dd'
    },
    'it': {
      code: 'it-IT',
      dateFormat: 'dd/MM/yyyy',
      shortDateFormat: 'dd/MM/yy',
      longDateFormat: 'd MMMM yyyy',
      timeFormat: 'HH:mm',
      dateTimeFormat: 'dd/MM/yyyy HH:mm',
      firstDayOfWeek: 1, // Monday
      dateInputFormat: 'yyyy-MM-dd'
    },
    'pt': {
      code: 'pt-BR',
      dateFormat: 'dd/MM/yyyy',
      shortDateFormat: 'dd/MM/yy',
      longDateFormat: 'd \'de\' MMMM \'de\' yyyy',
      timeFormat: 'HH:mm',
      dateTimeFormat: 'dd/MM/yyyy HH:mm',
      firstDayOfWeek: 0, // Sunday
      dateInputFormat: 'yyyy-MM-dd'
    }
  };

  constructor(
    private datePipe: DatePipe,
    private translationService: TranslationService
  ) {
    this.registerAllLocales();
    this.setupLanguageSubscription();
  }

  private registerAllLocales(): void {
    // Register all locale data
    registerLocaleData(localeEn, 'en-US');
    registerLocaleData(localeEs, 'es-ES');
    registerLocaleData(localeFr, 'fr-FR');
    registerLocaleData(localeIt, 'it-IT');
    registerLocaleData(localePt, 'pt-BR');
  }

  private setupLanguageSubscription(): void {
    this.translationService.currentLanguage$.subscribe(language => {
      this.setLocale(language);
    });
  }

  setLocale(languageCode: string): void {
    const config = this.localeConfigs[languageCode] || this.localeConfigs['en'];
    this.currentLocaleSubject.next(config.code);
  }

  getCurrentLocale(): string {
    return this.currentLocaleSubject.value;
  }

  getCurrentLocaleConfig(): LocaleConfig {
    const currentLang = this.translationService.getCurrentLanguage();
    return this.localeConfigs[currentLang] || this.localeConfigs['en'];
  }

  /**
   * Format a date according to the current locale
   */
  formatDate(date: Date | string | number, format?: 'short' | 'medium' | 'long' | 'full' | string): string {
    if (!date) return '';
    
    const locale = this.getCurrentLocale();
    const config = this.getCurrentLocaleConfig();
    
    if (format === 'short' || !format) {
      return formatDate(date, config.shortDateFormat, locale);
    } else if (format === 'medium') {
      return formatDate(date, config.dateFormat, locale);
    } else if (format === 'long') {
      return formatDate(date, config.longDateFormat, locale);
    } else if (format === 'full') {
      return formatDate(date, 'fullDate', locale);
    } else {
      return formatDate(date, format, locale);
    }
  }

  /**
   * Format a date for form input (always yyyy-MM-dd) - timezone-safe
   */
  formatDateForInput(date: Date | string | number): string {
    if (!date) return '';

    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';

    // Use local date components to avoid timezone shifts
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Parse a date string from form input (timezone-safe)
   * Handles yyyy-MM-dd format by creating local date to avoid timezone shifts
   */
  parseDateFromInput(dateString: string): Date | null {
    if (!dateString) return null;

    // Handle ISO date format (yyyy-MM-dd) to avoid timezone conversion
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-').map(Number);
      // Create local date (not UTC) to preserve the exact date selected
      const date = new Date(year, month - 1, day);
      return isNaN(date.getTime()) ? null : date;
    }

    // Fallback for other formats
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Get the date format pattern for the current locale
   */
  getDateFormat(): string {
    return this.getCurrentLocaleConfig().dateFormat;
  }

  /**
   * Get the short date format pattern for the current locale
   */
  getShortDateFormat(): string {
    return this.getCurrentLocaleConfig().shortDateFormat;
  }

  /**
   * Get first day of week for the current locale
   */
  getFirstDayOfWeek(): number {
    return this.getCurrentLocaleConfig().firstDayOfWeek;
  }

  /**
   * Convert a locale-formatted date string to ISO format for forms
   */
  convertToISODate(localeDateString: string): string {
    if (!localeDateString) return '';
    
    const config = this.getCurrentLocaleConfig();
    let day: string, month: string, year: string;
    
    // Parse based on current locale format
    if (config.dateFormat.startsWith('MM/dd')) {
      // US format: MM/dd/yyyy
      const parts = localeDateString.split('/');
      if (parts.length === 3) {
        month = parts[0].padStart(2, '0');
        day = parts[1].padStart(2, '0');
        year = parts[2];
      } else {
        return '';
      }
    } else {
      // European format: dd/MM/yyyy
      const parts = localeDateString.split('/');
      if (parts.length === 3) {
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2];
      } else {
        return '';
      }
    }
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert ISO date to locale format for display
   */
  convertFromISODate(isoDateString: string): string {
    if (!isoDateString) return '';
    
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) return '';
    
    return this.formatDate(date, 'medium');
  }

  /**
   * Get date placeholder based on current locale
   */
  getDatePlaceholder(): string {
    const config = this.getCurrentLocaleConfig();
    return config.dateFormat.toLowerCase();
  }

  /**
   * Validate date string according to current locale format
   */
  isValidDateString(dateString: string): boolean {
    if (!dateString) return false;
    
    const config = this.getCurrentLocaleConfig();
    const dateRegex = config.dateFormat.includes('MM/dd') 
      ? /^\d{1,2}\/\d{1,2}\/\d{4}$/ 
      : /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    
    if (!dateRegex.test(dateString)) return false;
    
    const isoDate = this.convertToISODate(dateString);
    const date = new Date(isoDate);
    return !isNaN(date.getTime());
  }

  /**
   * Get localized month names
   */
  getLocalizedMonths(): string[] {
    const locale = this.getCurrentLocale();
    const months: string[] = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(2000, i, 1);
      months.push(formatDate(date, 'MMMM', locale));
    }
    
    return months;
  }

  /**
   * Get localized short month names
   */
  getLocalizedShortMonths(): string[] {
    const locale = this.getCurrentLocale();
    const months: string[] = [];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(2000, i, 1);
      months.push(formatDate(date, 'MMM', locale));
    }
    
    return months;
  }

  /**
   * Get localized day names
   */
  getLocalizedDays(): string[] {
    const locale = this.getCurrentLocale();
    const days: string[] = [];
    
    // Start from Sunday (0) to Saturday (6)
    for (let i = 0; i < 7; i++) {
      const date = new Date(2000, 0, 2 + i); // January 2, 2000 was a Sunday
      days.push(formatDate(date, 'EEEE', locale));
    }
    
    return days;
  }

  /**
   * Get localized short day names
   */
  getLocalizedShortDays(): string[] {
    const locale = this.getCurrentLocale();
    const days: string[] = [];

    // Start from Sunday (0) to Saturday (6)
    for (let i = 0; i < 7; i++) {
      const date = new Date(2000, 0, 2 + i); // January 2, 2000 was a Sunday
      days.push(formatDate(date, 'EEE', locale));
    }

    return days;
  }

  /**
   * Create a timezone-safe local date string (yyyy-MM-dd)
   * Use this instead of toISOString().split('T')[0] to avoid timezone shifts
   */
  static createLocalDateString(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get today's date as a timezone-safe string
   */
  getTodayString(): string {
    return LocaleDateService.createLocalDateString();
  }
}
