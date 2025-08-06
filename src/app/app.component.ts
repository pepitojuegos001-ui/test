import { Component, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('drawer', { static: false }) drawer!: MatSidenav;

  title = 'Financial Dashboard';
  isSidebarCollapsed = this.loadSidebarState();

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  isAuthenticated$: Observable<boolean> = this.authService.currentUser$
    .pipe(
      map(user => user?.isAuthenticated || false),
      shareReplay()
    );

  constructor(
    private breakpointObserver: BreakpointObserver,
    private authService: AuthService,
    private translationService: TranslationService
  ) {
    // Connect services to avoid circular dependency
    this.authService.setTranslationService(this.translationService);
  }

  ngOnInit(): void {
    this.updateDateTime();
    this.setupResponsiveLayout();
  }

  private setupResponsiveLayout(): void {
    this.isHandset$.subscribe(isHandset => {
      if (isHandset) {
        this.isSidebarCollapsed = false; // Never collapse on mobile, just hide/show
      }
    });
  }

  private updateDateTime(): void {
    // This could be moved to a service if needed
    setInterval(() => {
      // Update logic if needed
    }, 60000);
  }

  onSidebarToggle(): void {
    this.isHandset$.pipe(
      take(1) // Take only one value and automatically unsubscribe
    ).subscribe(isHandset => {
      if (isHandset) {
        // On mobile, toggle the drawer open/close
        if (this.drawer) {
          this.drawer.toggle();
        }
      } else {
        // On desktop, toggle collapse state
        this.isSidebarCollapsed = !this.isSidebarCollapsed;
        this.saveSidebarState();
      }
    });
  }

  onNavigationCollapse(): void {
    // Auto-collapse sidebar when navigation occurs on desktop
    this.isHandset$.pipe(
      take(1)
    ).subscribe(isHandset => {
      if (!isHandset) {
        // Only collapse on desktop
        this.isSidebarCollapsed = true;
        this.saveSidebarState();
      }
    });
  }

  private saveSidebarState(): void {
    try {
      localStorage.setItem('financialDashboard_sidebarCollapsed', JSON.stringify(this.isSidebarCollapsed));
    } catch (error) {
      // Handle localStorage errors (e.g., private browsing mode)
      console.warn('Could not save sidebar state to localStorage:', error);
    }
  }

  private loadSidebarState(): boolean {
    try {
      const saved = localStorage.getItem('financialDashboard_sidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    } catch (error) {
      // Handle localStorage errors
      console.warn('Could not load sidebar state from localStorage:', error);
      return false;
    }
  }

  get currentDateTime(): string {
    const now = new Date();
    return now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  get sidebarWidth(): string {
    return this.isSidebarCollapsed ? '64px' : '280px';
  }
}
