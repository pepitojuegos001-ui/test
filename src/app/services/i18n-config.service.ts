import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class I18nConfigService {
  private readonly DEFAULT_LANGUAGE = 'en';
  private readonly FALLBACK_LANGUAGE = 'en';

  constructor(private translateService: TranslateService) {
    this.initializeI18nConfiguration();
  }

  private initializeI18nConfiguration(): void {
    // Configure default and fallback languages
    this.translateService.setDefaultLang(this.DEFAULT_LANGUAGE);
    this.translateService.use(this.DEFAULT_LANGUAGE);
    
    // Set fallback language for missing translations
    this.translateService.setDefaultLang(this.FALLBACK_LANGUAGE);
    
    // Configure translation loading options
    this.configureTranslationOptions();
  }

  private configureTranslationOptions(): void {
    // Configure missing translation handler
    this.translateService.onMissingTranslation.subscribe(event => {
      console.warn(`Missing translation for key: ${event.key} in language: ${event.lang}`);
      
      // Return fallback text
      return event.key;
    });

    // Handle translation load errors
    this.translateService.onTranslationChange.subscribe(event => {
      console.log(`Language changed to: ${event.lang}`);
    });
  }

  /**
   * Get the default language for the application
   */
  getDefaultLanguage(): string {
    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Get the fallback language for missing translations
   */
  getFallbackLanguage(): string {
    return this.FALLBACK_LANGUAGE;
  }

  /**
   * Check if a language is the default language
   */
  isDefaultLanguage(languageCode: string): boolean {
    return languageCode === this.DEFAULT_LANGUAGE;
  }
}
