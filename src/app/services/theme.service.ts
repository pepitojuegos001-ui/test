import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private currentTheme: "light" | "dark" = "light";

  constructor() {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    if (savedTheme) {
      this.currentTheme = savedTheme;
    }
    this.applyTheme();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === "light" ? "dark" : "light";
    localStorage.setItem("theme", this.currentTheme);
    this.applyTheme();
  }

  private applyTheme() {
    document.body.classList.remove("light-theme", "dark-theme");
    document.body.classList.add(`${this.currentTheme}-theme`);
  }

  isDarkMode(): boolean {
    return this.currentTheme === "dark";
  }
}
