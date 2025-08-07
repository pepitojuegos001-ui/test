# Light/Dark Theme Implementation Guide

This document provides a comprehensive guide to the light/dark theme system implemented in this Angular application.

## Overview

The theme system provides:
- ✅ Global light/dark theme switching
- ✅ CSS variables for consistent theming across components
- ✅ Angular Material integration with automatic palette switching
- ✅ localStorage persistence of user preference
- ✅ System theme detection and auto-switching
- ✅ Responsive design that works with both themes
- ✅ Smooth transitions between themes

## Architecture

### 1. ThemeService (`src/app/services/theme.service.ts`)

The core service that manages theme state and persistence:

```typescript
export class ThemeService {
  // Observable theme state
  public currentTheme$: Observable<Theme>;
  
  // Toggle between light and dark
  public toggleTheme(): void;
  
  // Set specific theme
  public setTheme(theme: Theme): void;
  
  // Check current theme
  public isDarkMode(): boolean;
  public getCurrentTheme(): Theme;
  
  // System integration
  public listenToSystemChanges(): void;
  public resetToSystemTheme(): void;
}
```

**Features:**
- Automatic localStorage persistence
- System preference detection
- Theme change events
- Meta theme-color updates for mobile browsers

### 2. Global CSS Variables (`src/styles.scss`)

Comprehensive CSS variables for both themes:

```scss
// Light theme variables
.light-theme {
  --background-primary: #ffffff;
  --background-secondary: #fafafa;
  --text-primary: #212121;
  --text-secondary: #757575;
  --surface-primary: #ffffff;
  --border-primary: #e0e0e0;
  // ... and many more
}

// Dark theme variables
.dark-theme {
  --background-primary: #121212;
  --background-secondary: #1e1e1e;
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --surface-primary: #1e1e1e;
  --border-primary: #383838;
  // ... and many more
}
```

### 3. Angular Material Integration (`src/styles/material-theme.scss`)

Separate theme configurations for Material components:

```scss
// Light theme palette
$light-theme: mat.define-light-theme((
  color: (
    primary: $light-primary,
    accent: $light-accent,
    warn: $light-warn,
  ),
));

// Dark theme palette  
$dark-theme: mat.define-dark-theme((
  color: (
    primary: $dark-primary,
    accent: $dark-accent,
    warn: $dark-warn,
  ),
));

// Apply themes conditionally
.dark-theme {
  @include mat.all-component-colors($dark-theme);
}
```

## Usage Examples

### 1. Basic Component Theming

Use CSS variables in your component styles:

```scss
.my-component {
  background: var(--surface-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  
  .title {
    color: var(--text-primary);
  }
  
  .subtitle {
    color: var(--text-secondary);
  }
  
  &:hover {
    background: var(--surface-hover);
  }
}
```

### 2. Status Colors

Use consistent status colors across themes:

```scss
.success-message {
  color: var(--status-success);
  background: rgba(76, 175, 80, 0.1);
}

.error-message {
  color: var(--status-error);
  background: rgba(244, 67, 54, 0.1);
}

.warning-message {
  color: var(--status-warning);
  background: rgba(255, 152, 0, 0.1);
}
```

### 3. Theme Toggle in Components

Subscribe to theme changes in your component:

```typescript
export class MyComponent implements OnInit, OnDestroy {
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

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 4. Navbar Implementation

The navbar includes a theme toggle button:

```html
<button 
  mat-icon-button 
  class="theme-toggle-btn"
  (click)="toggleTheme()"
  [matTooltip]="getThemeTooltip()"
>
  <mat-icon>{{ getCurrentThemeIcon() }}</mat-icon>
</button>
```

```typescript
toggleTheme(): void {
  this.themeService.toggleTheme();
}

getCurrentThemeIcon(): string {
  return this.isDarkMode ? "light_mode" : "dark_mode";
}

getThemeTooltip(): string {
  return this.isDarkMode ? "Switch to light mode" : "Switch to dark mode";
}
```

## Available CSS Variables

### Background Colors
- `--background-primary`: Main background
- `--background-secondary`: Secondary background
- `--background-tertiary`: Tertiary background
- `--background-elevated`: Elevated surfaces
- `--background-overlay`: Overlay backgrounds

### Surface Colors
- `--surface-primary`: Primary surface
- `--surface-secondary`: Secondary surface
- `--surface-tertiary`: Tertiary surface
- `--surface-hover`: Hover state
- `--surface-selected`: Selected state
- `--surface-disabled`: Disabled state

### Text Colors
- `--text-primary`: Primary text
- `--text-secondary`: Secondary text
- `--text-tertiary`: Tertiary text
- `--text-disabled`: Disabled text
- `--text-inverse`: Inverse text
- `--text-on-primary`: Text on primary colors
- `--text-on-surface`: Text on surfaces

### Border Colors
- `--border-primary`: Primary borders
- `--border-secondary`: Secondary borders
- `--border-hover`: Hover borders
- `--border-focus`: Focus borders
- `--border-error`: Error borders
- `--border-success`: Success borders

### Interactive Colors
- `--interactive-primary`: Primary interactive
- `--interactive-primary-hover`: Primary hover
- `--interactive-secondary`: Secondary interactive
- `--interactive-secondary-hover`: Secondary hover

### Form Colors
- `--input-background`: Input backgrounds
- `--input-border`: Input borders
- `--input-border-focus`: Focused input borders
- `--input-text`: Input text
- `--input-placeholder`: Placeholder text

### Status Colors
- `--status-success`: Success color
- `--status-warning`: Warning color
- `--status-error`: Error color
- `--status-info`: Info color

### Navigation Colors
- `--nav-background`: Navigation background
- `--nav-text`: Navigation text
- `--nav-hover`: Navigation hover

### Card Colors
- `--card-background`: Card backgrounds
- `--card-border`: Card borders
- `--card-shadow`: Card shadows

## Implementation Checklist

### ✅ Core Implementation
- [x] ThemeService with localStorage persistence
- [x] Global CSS variables for light/dark themes
- [x] Angular Material theme integration
- [x] Body class application (.light-theme/.dark-theme)
- [x] System preference detection
- [x] Theme toggle in navbar

### ✅ UI Components
- [x] Navbar theme toggle button with icon switching
- [x] Smooth transitions between themes
- [x] CSS variables usage in all components
- [x] Material component theme integration
- [x] Responsive design compatibility

### ✅ Advanced Features
- [x] System theme change listening
- [x] Meta theme-color updates for mobile
- [x] Theme state observable for components
- [x] Reset to system theme functionality
- [x] Proper TypeScript types

### ✅ Examples and Documentation
- [x] Theme demo component showing all features
- [x] Comprehensive variable documentation
- [x] Usage examples for developers
- [x] Implementation guide

## Best Practices

1. **Always use CSS variables** instead of hardcoded colors
2. **Test both themes** during development
3. **Use semantic variable names** (e.g., `--text-primary` not `--black`)
4. **Provide hover states** with appropriate variables
5. **Consider accessibility** with sufficient contrast ratios
6. **Use transitions** for smooth theme switching
7. **Test on mobile devices** for meta theme-color support

## Browser Support

- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support) 
- ✅ Safari (full support)
- ✅ Mobile browsers (with theme-color support)
- ✅ CSS variables supported in all modern browsers

## Performance Considerations

- CSS variables are efficiently applied by browsers
- Theme switching is instant with CSS variables
- localStorage access is minimal and cached
- No JavaScript required for theme application after initial load
- Smooth transitions without layout shifts

## Future Enhancements

Potential future improvements:
- Multiple theme variants (blue, green, purple, etc.)
- User-customizable accent colors
- High contrast accessibility mode
- Theme scheduling (auto dark mode at night)
- Theme preview in settings
- Component-level theme overrides
