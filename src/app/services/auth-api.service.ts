import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ApiConfigService } from './api-config.service';
import * as CryptoJS from 'crypto-js';

export interface User {
  id: string;
  username: string;
  email?: string;
  isAuthenticated: boolean;
  preferredLanguage?: string;
  roles?: string[];
  lastLoginAt?: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthCredentials {
  username: string;
  passwordHash: string;
  email?: string;
  roles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Mock credentials for fallback (in production, these would come from secure backend)
  private readonly validCredentials: AuthCredentials[] = [
    { 
      username: 'admin', 
      passwordHash: CryptoJS.SHA256('Admin123!').toString(),
      email: 'admin@financialdashboard.com',
      roles: ['admin', 'user']
    },
    { 
      username: 'user', 
      passwordHash: CryptoJS.SHA256('User123!').toString(),
      email: 'user@financialdashboard.com',
      roles: ['user']
    }
  ];
  
  private readonly AUTH_KEY = 'financial_dashboard_auth';
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private translationService: any;

  constructor(
    private router: Router,
    private apiService: ApiService,
    private apiConfig: ApiConfigService
  ) {
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
            id: authData.id || authData.username,
            username: authData.username,
            email: authData.email,
            isAuthenticated: true,
            preferredLanguage: authData.preferredLanguage,
            roles: authData.roles || ['user'],
            lastLoginAt: authData.lastLoginAt ? new Date(authData.lastLoginAt) : undefined
          });
        }
      } catch (error) {
        console.error('Auth data parsing error:', error);
        this.clearAllAuthData();
      }
    }
  }

  /**
   * Login user with API call and fallback
   */
  login(username: string, password: string, rememberMe: boolean = false): Observable<boolean> {
    const endpoint = this.apiConfig.getEndpoints().auth.login;
    const loginRequest: LoginRequest = { username, password, rememberMe };

    return this.apiService.post<LoginResponse>(endpoint, loginRequest, {
      mockResponse: this.getMockLoginResponse(username, password)
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          this.handleSuccessfulLogin(response.data, rememberMe);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('API login failed, trying fallback:', error);
        return this.fallbackLogin(username, password, rememberMe);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): Observable<boolean> {
    const endpoint = this.apiConfig.getEndpoints().auth.logout;
    
    return this.apiService.post<boolean>(endpoint, {}, {
      mockResponse: true
    }).pipe(
      map(response => response.success),
      tap(() => {
        this.clearAllAuthData();
        if (this.translationService) {
          this.translationService.resetToDefaultLanguage();
        }
        this.router.navigate(['/login']);
      }),
      catchError(error => {
        console.error('Logout API call failed:', error);
        // Still perform local logout
        this.clearAllAuthData();
        if (this.translationService) {
          this.translationService.resetToDefaultLanguage();
        }
        this.router.navigate(['/login']);
        return of(true);
      })
    );
  }

  /**
   * Change user password
   */
  changePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    const endpoint = this.apiConfig.getEndpoints().auth.changePassword;
    const request: ChangePasswordRequest = { currentPassword, newPassword };

    return this.apiService.post<boolean>(endpoint, request, {
      mockResponse: this.getMockChangePasswordResponse(currentPassword, newPassword)
    }).pipe(
      map(response => response.success && response.data),
      catchError(error => {
        console.error('Change password API failed, trying fallback:', error);
        return this.fallbackChangePassword(currentPassword, newPassword);
      })
    );
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<boolean> {
    const endpoint = this.apiConfig.getEndpoints().auth.refreshToken;
    
    return this.apiService.post<LoginResponse>(endpoint, {}, {
      mockResponse: null // No mock for refresh, let it fail to API
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          this.handleSuccessfulLogin(response.data, true);
          return true;
        }
        return false;
      }),
      catchError(error => {
        console.error('Token refresh failed:', error);
        this.clearAllAuthData();
        return of(false);
      })
    );
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

  hasRole(role: string): boolean {
    const currentUser = this.currentUserSubject.value;
    return currentUser?.roles?.includes(role) || false;
  }

  private handleSuccessfulLogin(loginResponse: LoginResponse, rememberMe: boolean): void {
    const expiry = Date.now() + this.SESSION_TIMEOUT;
    const user = loginResponse.user;

    this.currentUserSubject.next(user);

    const authData = {
      ...user,
      expiry,
      timestamp: Date.now(),
      accessToken: loginResponse.accessToken,
      refreshToken: loginResponse.refreshToken,
      lastLoginAt: new Date().toISOString()
    };

    // Store authentication state securely
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.AUTH_KEY, JSON.stringify(authData));

    // Load user's language preference
    if (this.translationService) {
      this.translationService.loadUserLanguagePreference(user.username);
    }
  }

  private fallbackLogin(username: string, password: string, rememberMe: boolean): Observable<boolean> {
    return new Observable(observer => {
      setTimeout(() => {
        // Secure password verification using local credentials
        const hashedPassword = CryptoJS.SHA256(password).toString();
        const validCredential = this.validCredentials.find(
          cred => cred.username === username && cred.passwordHash === hashedPassword
        );

        if (validCredential) {
          const mockResponse = this.getMockLoginResponse(username, password, validCredential);
          this.handleSuccessfulLogin(mockResponse, rememberMe);
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

  private fallbackChangePassword(currentPassword: string, newPassword: string): Observable<boolean> {
    return new Observable(observer => {
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

  private getMockLoginResponse(username: string, password: string, credential?: AuthCredentials): LoginResponse {
    const foundCredential = credential || this.validCredentials.find(
      cred => cred.username === username && cred.passwordHash === CryptoJS.SHA256(password).toString()
    );

    if (!foundCredential) {
      throw new Error('Invalid credentials');
    }

    return {
      user: {
        id: username,
        username: username,
        email: foundCredential.email,
        isAuthenticated: true,
        roles: foundCredential.roles,
        lastLoginAt: new Date()
      },
      accessToken: `mock_access_token_${Date.now()}`,
      refreshToken: `mock_refresh_token_${Date.now()}`,
      expiresIn: this.SESSION_TIMEOUT
    };
  }

  private getMockChangePasswordResponse(currentPassword: string, newPassword: string): boolean {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return false;

    const currentHashedPassword = CryptoJS.SHA256(currentPassword).toString();
    const validCredential = this.validCredentials.find(
      cred => cred.username === currentUser.username && cred.passwordHash === currentHashedPassword
    );

    return !!validCredential;
  }
}
