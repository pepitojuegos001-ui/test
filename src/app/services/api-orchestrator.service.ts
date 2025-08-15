import { Injectable, OnDestroy } from '@angular/core';
import { Observable, BehaviorSubject, timer, of } from 'rxjs';
import { map, catchError, switchMap, startWith } from 'rxjs/operators';
import { ApiService } from './api.service';
import { FinancialDataService } from './financial-data.service';
import { FinancialDataApiService } from './financial-data-api.service';
import { AuthService } from './auth.service';
import { AuthApiService } from './auth-api.service';
import { environment } from '../../environments/environment';

export interface ApiHealthStatus {
  isHealthy: boolean;
  lastChecked: Date;
  responseTime?: number;
  error?: string;
}

export type ServiceMode = 'api' | 'mock' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ApiOrchestratorService implements OnDestroy {
  private healthStatusSubject = new BehaviorSubject<ApiHealthStatus>({
    isHealthy: false,
    lastChecked: new Date()
  });
  
  private serviceModeSubject = new BehaviorSubject<ServiceMode>('auto');
  private healthCheckInterval$ = timer(0, 30000); // Check every 30 seconds
  private healthCheckSubscription: any;

  public healthStatus$ = this.healthStatusSubject.asObservable();
  public serviceMode$ = this.serviceModeSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private financialDataService: FinancialDataService,
    private financialDataApiService: FinancialDataApiService,
    private authService: AuthService,
    private authApiService: AuthApiService
  ) {
    this.initializeHealthChecks();
  }

  ngOnDestroy(): void {
    if (this.healthCheckSubscription) {
      this.healthCheckSubscription.unsubscribe();
    }
  }

  /**
   * Get the current financial data service (API or Mock)
   */
  getFinancialDataService(): FinancialDataService | FinancialDataApiService {
    const mode = this.getCurrentServiceMode();
    return mode === 'api' ? this.financialDataApiService : this.financialDataService;
  }

  /**
   * Get the current auth service (API or Mock)
   */
  getAuthService(): AuthService | AuthApiService {
    const mode = this.getCurrentServiceMode();
    return mode === 'api' ? this.authApiService : this.authService;
  }

  /**
   * Force service mode (useful for testing)
   */
  setServiceMode(mode: ServiceMode): void {
    this.serviceModeSubject.next(mode);
    console.log(`API Orchestrator: Service mode set to ${mode}`);
  }

  /**
   * Get current service mode
   */
  getCurrentServiceMode(): ServiceMode {
    const currentMode = this.serviceModeSubject.value;
    const healthStatus = this.healthStatusSubject.value;

    if (currentMode === 'auto') {
      return healthStatus.isHealthy ? 'api' : 'mock';
    }

    return currentMode;
  }

  /**
   * Manual health check
   */
  checkApiHealth(): Observable<ApiHealthStatus> {
    const startTime = Date.now();
    
    return this.apiService.checkApiHealth().pipe(
      map(isHealthy => {
        const responseTime = Date.now() - startTime;
        const status: ApiHealthStatus = {
          isHealthy,
          lastChecked: new Date(),
          responseTime: responseTime
        };
        
        this.healthStatusSubject.next(status);
        this.logHealthStatus(status);
        return status;
      }),
      catchError(error => {
        const status: ApiHealthStatus = {
          isHealthy: false,
          lastChecked: new Date(),
          error: error.message || 'Unknown error'
        };
        
        this.healthStatusSubject.next(status);
        this.logHealthStatus(status);
        return of(status);
      })
    );
  }

  /**
   * Get API configuration info
   */
  getApiInfo(): any {
    return {
      environment: environment.production ? 'production' : 'development',
      apiBaseUrl: environment.api.baseUrl,
      mockFallbackEnabled: environment.api.enableMockFallback,
      currentMode: this.getCurrentServiceMode(),
      healthStatus: this.healthStatusSubject.value
    };
  }

  /**
   * Initialize periodic health checks
   */
  private initializeHealthChecks(): void {
    // Only perform health checks if we're using auto mode or API mode
    this.healthCheckSubscription = this.serviceMode$.pipe(
      switchMap(mode => {
        if (mode === 'mock') {
          // Skip health checks for mock mode
          return of(null);
        }
        
        return this.healthCheckInterval$.pipe(
          switchMap(() => this.checkApiHealth()),
          startWith(null) // Start immediately
        );
      })
    ).subscribe();
  }

  /**
   * Log health status changes
   */
  private logHealthStatus(status: ApiHealthStatus): void {
    if (environment.features?.enableLogging) {
      const modeInfo = `[${this.getCurrentServiceMode().toUpperCase()} MODE]`;
      
      if (status.isHealthy) {
        console.log(`${modeInfo} API Health Check: ✓ Healthy (${status.responseTime}ms)`, status);
      } else {
        console.warn(`${modeInfo} API Health Check: ✗ Unhealthy`, status);
      }
    }
  }

  /**
   * Switch to API mode when healthy
   */
  enableApiMode(): void {
    this.checkApiHealth().subscribe(status => {
      if (status.isHealthy) {
        this.setServiceMode('api');
      } else {
        console.warn('Cannot enable API mode: API is not healthy');
      }
    });
  }

  /**
   * Switch to mock mode
   */
  enableMockMode(): void {
    this.setServiceMode('mock');
  }

  /**
   * Switch to auto mode (default)
   */
  enableAutoMode(): void {
    this.setServiceMode('auto');
  }

  /**
   * Get service status for debugging
   */
  getServiceStatus(): Observable<any> {
    return this.healthStatus$.pipe(
      map(healthStatus => ({
        mode: this.getCurrentServiceMode(),
        health: healthStatus,
        api: this.getApiInfo(),
        services: {
          financial: this.getFinancialDataService().constructor.name,
          auth: this.getAuthService().constructor.name
        }
      }))
    );
  }
}
