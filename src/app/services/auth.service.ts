import { Injectable, Inject, forwardRef } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

export interface User {
  username: string;
  isAuthenticated: boolean;
  preferredLanguage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Hardcoded credentials
  private readonly VALID_USERNAME = 'juan';
  private readonly VALID_PASSWORD = '123456789';
  private readonly AUTH_KEY = 'financial_dashboard_auth';

  constructor(private router: Router) {
    // Check if user was previously authenticated
    this.checkStoredAuth();
  }

  // Method to clear all auth data for debugging
  clearAllAuthData(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(this.AUTH_KEY);
    sessionStorage.removeItem(this.AUTH_KEY);
  }

  // Force logout for testing
  forceLogout(): void {
    this.logout();
  }

  private checkStoredAuth(): void {
    const storedAuth = localStorage.getItem(this.AUTH_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.isAuthenticated && authData.username) {
          this.currentUserSubject.next({
            username: authData.username,
            isAuthenticated: true
          });
        }
      } catch (error) {
        // Clear invalid stored data
        localStorage.removeItem(this.AUTH_KEY);
      }
    }
  }

  login(username: string, password: string, rememberMe: boolean = false): Observable<boolean> {
    return new Observable(observer => {
      // Simulate async login (you could add a delay here)
      setTimeout(() => {
        if (username === this.VALID_USERNAME && password === this.VALID_PASSWORD) {
          const user: User = {
            username: username,
            isAuthenticated: true
          };

          this.currentUserSubject.next(user);

          // Store authentication state
          if (rememberMe) {
            localStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
          } else {
            sessionStorage.setItem(this.AUTH_KEY, JSON.stringify(user));
          }

          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 500); // Simulate network delay
    });
  }

  logout(): void {
    // Clear user data
    this.currentUserSubject.next(null);
    
    // Clear stored authentication
    localStorage.removeItem(this.AUTH_KEY);
    sessionStorage.removeItem(this.AUTH_KEY);
    
    // Redirect to login
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.isAuthenticated || false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUsername(): string {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.username || '';
  }
}
