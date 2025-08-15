import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";

export type Theme = "light" | "dark";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly THEME_KEY = "app-theme";
  private currentThemeSubject = new BehaviorSubject<Theme>("light");

  public currentTheme$: Observable<Theme> = this.currentThemeSubject.asObservable();

  constructor() {
    this.initializeTheme();
  }

  private initializeTheme(): void {
    // Try to get saved theme from localStorage
    const savedTheme = this.getSavedTheme();

    // If no saved theme, detect system preference
    const initialTheme = savedTheme || this.getSystemPreference();

    this.setTheme(initialTheme, false);
  }

  private getSavedTheme(): Theme | null {
    try {
      const saved = localStorage.getItem(this.THEME_KEY);
      return saved === "light" || saved === "dark" ? saved : null;
    } catch (error) {
      console.warn("Could not access localStorage for theme:", error);
      return null;
    }
  }

  private getSystemPreference(): Theme {
    try {
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
    } catch (error) {
      console.warn("Could not detect system theme preference:", error);
    }
    return "light";
  }

  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.THEME_KEY, theme);
    } catch (error) {
      console.warn("Could not save theme to localStorage:", error);
    }
  }

  private applyTheme(theme: Theme): void {
    // Remove all theme classes
    document.body.classList.remove("light-theme", "dark-theme");

    // Add the new theme class
    document.body.classList.add(`${theme}-theme`);

    // Update the meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);

    // Dispatch custom event for components that need to react to theme changes
    window.dispatchEvent(new CustomEvent("themeChanged", { detail: { theme } }));
  }

  private updateMetaThemeColor(theme: Theme): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const color = theme === "dark" ? "#121212" : "#2196f3";
      metaThemeColor.setAttribute("content", color);
    }
  }

  public setTheme(theme: Theme, saveToStorage: boolean = true): void {
    if (theme !== this.currentThemeSubject.value) {
      this.currentThemeSubject.next(theme);
      this.applyTheme(theme);

      if (saveToStorage) {
        this.saveTheme(theme);
      }
    }
  }

  public toggleTheme(): void {
    const newTheme: Theme = this.currentThemeSubject.value === "light" ? "dark" : "light";
    this.setTheme(newTheme);
  }

  public getCurrentTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  public isDarkMode(): boolean {
    return this.currentThemeSubject.value === "dark";
  }

  public isLightMode(): boolean {
    return this.currentThemeSubject.value === "light";
  }

  // Method to listen for system theme changes
  public listenToSystemChanges(): void {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

      mediaQuery.addEventListener("change", (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!this.getSavedTheme()) {
          const systemTheme: Theme = e.matches ? "dark" : "light";
          this.setTheme(systemTheme, false);
        }
      });
    }
  }

  // Reset to system preference
  public resetToSystemTheme(): void {
    try {
      localStorage.removeItem(this.THEME_KEY);
      const systemTheme = this.getSystemPreference();
      this.setTheme(systemTheme, false);
    } catch (error) {
      console.warn("Could not reset to system theme:", error);
    }
  }
}
