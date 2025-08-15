import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, of } from 'rxjs';
import { catchError, retry, delay, switchMap, timeout } from 'rxjs/operators';
import { ApiConfigService } from './api-config.service';
import { environment } from '../../environments/environment';

export interface ApiRequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  timeout?: number;
  retryAttempts?: number;
  enableMockFallback?: boolean;
  mockResponse?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  errors?: any[];
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly defaultHeaders: HttpHeaders;
  
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfigService
  ) {
    this.defaultHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.makeRequest<T>('GET', endpoint, null, options);
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.makeRequest<T>('POST', endpoint, body, options);
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.makeRequest<T>('PUT', endpoint, body, options);
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.makeRequest<T>('DELETE', endpoint, null, options);
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.makeRequest<T>('PATCH', endpoint, body, options);
  }

  /**
   * Make HTTP request with error handling and fallback
   */
  private makeRequest<T>(
    method: string,
    endpoint: string,
    body?: any,
    options?: ApiRequestOptions
  ): Observable<ApiResponse<T>> {
    const url = this.apiConfig.buildUrl(endpoint);
    const config = this.buildRequestConfig(options);
    
    // Create the HTTP request observable
    let request$: Observable<ApiResponse<T>>;
    
    switch (method.toUpperCase()) {
      case 'GET':
        request$ = this.http.get<ApiResponse<T>>(url, config);
        break;
      case 'POST':
        request$ = this.http.post<ApiResponse<T>>(url, body, config);
        break;
      case 'PUT':
        request$ = this.http.put<ApiResponse<T>>(url, body, config);
        break;
      case 'DELETE':
        request$ = this.http.delete<ApiResponse<T>>(url, config);
        break;
      case 'PATCH':
        request$ = this.http.patch<ApiResponse<T>>(url, body, config);
        break;
      default:
        return throwError(() => new Error(`Unsupported HTTP method: ${method}`));
    }

    const apiConfig = this.apiConfig.getApiConfig();
    const timeoutDuration = options?.timeout || apiConfig.timeout;
    const retryAttempts = options?.retryAttempts || apiConfig.retryAttempts;

    return request$.pipe(
      timeout(timeoutDuration),
      retry({
        count: retryAttempts,
        delay: (error, retryCount) => {
          console.warn(`API request failed (attempt ${retryCount}), retrying...`, error);
          return timer(apiConfig.retryDelay * retryCount);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('API request failed after retries:', error);
        
        // Check if mock fallback is enabled and available
        if (this.shouldUseMockFallback(options)) {
          console.warn('Using mock fallback response');
          return this.getMockResponse<T>(options?.mockResponse);
        }
        
        return throwError(() => this.handleError(error));
      })
    );
  }

  /**
   * Build request configuration
   */
  private buildRequestConfig(options?: ApiRequestOptions): any {
    const headers = options?.headers 
      ? new HttpHeaders(options.headers).set('Content-Type', 'application/json')
      : this.defaultHeaders;

    return {
      headers,
      params: options?.params,
      observe: 'body' as const,
      responseType: 'json' as const
    };
  }

  /**
   * Check if mock fallback should be used
   */
  private shouldUseMockFallback(options?: ApiRequestOptions): boolean {
    const globalMockEnabled = this.apiConfig.isMockFallbackEnabled();
    const requestMockEnabled = options?.enableMockFallback !== false;
    const hasMockResponse = options?.mockResponse !== undefined;
    
    return globalMockEnabled && requestMockEnabled && hasMockResponse;
  }

  /**
   * Get mock response with simulated delay
   */
  private getMockResponse<T>(mockData?: any): Observable<ApiResponse<T>> {
    const response: ApiResponse<T> = {
      data: mockData || {} as T,
      success: true,
      message: 'Mock response (API unavailable)',
      timestamp: new Date().toISOString()
    };

    const mockDelay = this.apiConfig.getMockDelay();
    
    return of(response).pipe(
      delay(mockDelay)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): any {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          break;
        case 400:
          errorMessage = 'Bad Request: The request was invalid.';
          break;
        case 401:
          errorMessage = 'Unauthorized: Please log in again.';
          break;
        case 403:
          errorMessage = 'Forbidden: You do not have permission to access this resource.';
          break;
        case 404:
          errorMessage = 'Not Found: The requested resource was not found.';
          break;
        case 500:
          errorMessage = 'Internal Server Error: Please try again later.';
          break;
        default:
          errorMessage = `Server Error: ${error.status} - ${error.message}`;
      }
    }

    return {
      message: errorMessage,
      status: error.status,
      error: error.error
    };
  }

  /**
   * Check API health
   */
  checkApiHealth(): Observable<boolean> {
    return this.get<any>('health', {
      timeout: 5000,
      retryAttempts: 1,
      enableMockFallback: false
    }).pipe(
      switchMap(() => of(true)),
      catchError(() => of(false))
    );
  }
}
