import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ThemeService, Theme } from '../../services/theme.service';

@Component({
  selector: 'app-theme-demo',
  template: `
    <mat-card class="theme-demo-card">
      <mat-card-header>
        <mat-card-title class="demo-title">Theme Demonstration</mat-card-title>
        <mat-card-subtitle class="demo-subtitle">Current theme: {{ currentTheme }}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content class="demo-content">
        <p class="demo-text-primary">This is primary text using var(--text-primary)</p>
        <p class="demo-text-secondary">This is secondary text using var(--text-secondary)</p>
        
        <div class="demo-buttons">
          <button mat-raised-button color="primary" class="demo-button">
            Primary Button
          </button>
          <button mat-raised-button color="accent" class="demo-button">
            Accent Button
          </button>
          <button mat-raised-button color="warn" class="demo-button">
            Warn Button
          </button>
        </div>
        
        <div class="demo-cards">
          <div class="demo-surface-card">
            <h4>Surface Card</h4>
            <p>Background: var(--surface-primary)</p>
          </div>
          <div class="demo-interactive-card">
            <h4>Interactive Card</h4>
            <p>Background: var(--surface-hover)</p>
          </div>
        </div>
        
        <mat-form-field appearance="outline" class="demo-form-field">
          <mat-label>Test Input</mat-label>
          <input matInput placeholder="Type something..." value="CSS Variables Theme">
        </mat-form-field>
        
        <div class="demo-status-indicators">
          <span class="status-success">Success Status</span>
          <span class="status-warning">Warning Status</span>
          <span class="status-error">Error Status</span>
        </div>
      </mat-card-content>
      
      <mat-card-actions class="demo-actions">
        <button mat-button (click)="toggleTheme()">
          <mat-icon>{{ isDarkMode ? 'light_mode' : 'dark_mode' }}</mat-icon>
          Switch to {{ isDarkMode ? 'Light' : 'Dark' }} Theme
        </button>
        <button mat-button (click)="resetToSystemTheme()">
          <mat-icon>settings_backup_restore</mat-icon>
          System Default
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrls: ['./theme-demo.component.scss']
})
export class ThemeDemoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentTheme: Theme = 'light';
  isDarkMode = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeService.currentTheme$
      .pipe(takeUntil(this.destroy$))
      .subscribe(theme => {
        this.currentTheme = theme;
        this.isDarkMode = theme === 'dark';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  resetToSystemTheme(): void {
    this.themeService.resetToSystemTheme();
  }
}
