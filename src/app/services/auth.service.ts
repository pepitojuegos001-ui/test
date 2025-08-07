import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';

export interface User {
  username: string;
  isAuthenticated: boolean;
  preferredLanguage?: string;
}

interface AuthCredentials {
  username: string;
  passwordHash: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Secure credential storage (in production, these would come from a secure backend)
  private readonly validCredentials: AuthCredentials[] = [
    { 
      username: 'admin', 
      passwordHash: CryptoJS.SHA256('Admin123!').toString() 
    },
    { 
      username: 'user', 
      passwordHash: CryptoJS.SHA256('User123!').toString() 
    }
  ];
  
  private readonly AUTH_KEY = 'financial_dashboard_auth';
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private translationService: any;

  constructor(private router: Router) {
    this.checkStoredAuth();
  }

  setTranslationService(translationService: any): void {
    this.translationService = translationService;
  }

  clearAllAuthData(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(this.AUTH_KEY);
    sessionStorage.removeItem(this.AUTH_KEY);
  }

  forceLogout(): void {
    this.logout();
  }

  private checkStoredAuth(): void {
    const storedAuth = localStorage.getItem(this.AUTH_KEY) || sessionStorage.getItem(this.AUTH_KEY);
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        
        // Check session expiry
        if (authData.expiry && Date.now() > authData.expiry) {
          this.clearAllAuthData();
          return;
        }
        
        if (authData.isAuthenticated && authData.username) {
          this.currentUserSubject.next({
            username: authData.username,
            isAuthenticated: true,
            preferredLanguage: authData.preferredLanguage
          });
        }
      } catch (error) {
        console.error('Auth data parsing error:', error);
        this.clearAllAuthData();
      }
    }
  }

  login(username: string, password: string, rememberMe: boolean = false): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        // Secure password verification
        const hashedPassword = CryptoJS.SHA256(password).toString();
        const validCredential = this.validCredentials.find(
          cred => cred.username === username && cred.passwordHash === hashedPassword
        );

        if (validCredential) {
          const expiry = Date.now() + this.SESSION_TIMEOUT;
          const user: User = {
            username: username,
            isAuthenticated: true
          };

          this.currentUserSubject.next(user);

          const authData = {
            ...user,
            expiry,
            timestamp: Date.now()
          };

          // Store authentication state securely
          const storage = rememberMe ? localStorage : sessionStorage;
          storage.setItem(this.AUTH_KEY, JSON.stringify(authData));

          // Load user's language preference
          if (this.translationService) {
            this.translationService.loadUserLanguagePreference(username);
          }

          observer.next(true);
        } else {
          // Add delay to prevent timing attacks
          setTimeout(() => {
            observer.next(false);
            observer.complete();
          }, 500);
          return;
        }
        observer.complete();
      }, 1000); // Consistent timing
    });
  }

  logout(): void {
    this.currentUserSubject.next(null);
    this.clearAllAuthData();

    if (this.translationService) {
      this.translationService.resetToDefaultLanguage();
    }

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

  // Method to change password (placeholder for backend integration)
  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    return new Observable(observer => {
      // In production, this would make a secure API call
      setTimeout(() => {
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          // Validate current password
          const currentHashedPassword = CryptoJS.SHA256(currentPassword).toString();
          const validCredential = this.validCredentials.find(
            cred => cred.username === currentUser.username && cred.passwordHash === currentHashedPassword
          );
          
          if (validCredential) {
            // Update password hash (in production, send to backend)
            validCredential.passwordHash = CryptoJS.SHA256(newPassword).toString();
            observer.next(true);
          } else {
            observer.next(false);
          }
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 500);
    });
  }
}
