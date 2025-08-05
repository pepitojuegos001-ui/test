import { Component, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatSidenav } from '@angular/material/sidenav';
import { Observable } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('drawer', { static: false }) drawer!: MatSidenav;

  title = 'Financial Dashboard';
  isSidebarCollapsed = false;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  constructor(private breakpointObserver: BreakpointObserver) {}

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
      }
    });
  }

  get currentDateTime(): string {
    const now = new Date();
    return now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  get sidebarWidth(): string {
    return this.isSidebarCollapsed ? '64px' : '280px';
  }
}
