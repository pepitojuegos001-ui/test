import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserSettingsComponent } from '../user-settings/user-settings.component';
import { AuthService } from '../../services/auth.service';
import { TranslationService, Language } from '../../services/translation.service';

/**
 * NavbarComponent - Enhanced top navigation bar
 *
 * Features:
 * - Fixed position at top of viewport
 * - Responsive design (adapts to mobile/desktop)
 * - Sidebar toggle functionality
 * - Notification bell with badge counter
 * - Chat/feedback button
 * - User profile section with dropdown menu
 * - Configuration and logout options
 *
 * Usage:
 * <app-navbar (sidebarToggle)="onSidebarToggle()"></app-navbar>
 */
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Output() sidebarToggle = new EventEmitter<void>();

  private destroy$ = new Subject<void>();
  username = '';
  isUserMenuOpen = false;
  notifications = 3; // Sample notification count

  constructor(
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Subscribe to current user changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.username = user?.username || '';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSidebarToggle(): void {
    this.sidebarToggle.emit();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  onConfiguration(): void {
    this.isUserMenuOpen = false;

    const dialogRef = this.dialog.open(UserSettingsComponent, {
      width: '650px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'user-settings-dialog',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Settings updated:', result);
      }
    });
  }

  onLogout(): void {
    this.isUserMenuOpen = false;
    this.authService.logout();
  }

  onNotifications(): void {
    // TODO: Implement notifications logic
    console.log('Notifications clicked');
  }

  onChat(): void {
    // TODO: Implement chat/feedback logic
    console.log('Chat/Feedback clicked');
  }
}
