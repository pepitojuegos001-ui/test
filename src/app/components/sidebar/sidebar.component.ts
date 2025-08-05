import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Output() sidenavToggle = new EventEmitter<void>();

  navItems: NavItem[] = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/income', icon: 'trending_up', label: 'Income' },
    { path: '/expenses', icon: 'trending_down', label: 'Expenses' },
    { path: '/reports', icon: 'assessment', label: 'Reports' }
  ];

  constructor(private router: Router) { }

  isActive(path: string): boolean {
    return this.router.url === path;
  }

  navigateTo(path: string): void {
    this.router.navigate([path]);
    this.sidenavToggle.emit();
  }

  onToggleSidenav(): void {
    this.sidenavToggle.emit();
  }
}
