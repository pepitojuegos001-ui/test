import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface ApiEndpoints {
  auth: {
    login: string;
    logout: string;
    refreshToken: string;
    changePassword: string;
  };
  financial: {
    transactions: string;
    income: string;
    expenses: string;
    summary: string;
    categories: string;
  };
  user: {
    profile: string;
    preferences: string;
    settings: string;
  };
  reports: {
    generate: string;
    export: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private readonly baseUrl: string;
  private readonly endpoints: ApiEndpoints;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
    this.endpoints = this.initializeEndpoints();
  }

  /**
   * Get the base API URL
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Get API configuration
   */
  getApiConfig() {
    return environment.api;
  }

  /**
   * Get all API endpoints
   */
  getEndpoints(): ApiEndpoints {
    return this.endpoints;
  }

  /**
   * Build a complete URL for an endpoint
   */
  buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    // Ensure baseUrl ends with /
    const cleanBaseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`;
    return `${cleanBaseUrl}${cleanEndpoint}`;
  }

  /**
   * Get specific endpoint URL
   */
  getEndpointUrl(category: keyof ApiEndpoints, endpoint: string): string {
    const categoryEndpoints = this.endpoints[category] as any;
    if (categoryEndpoints && categoryEndpoints[endpoint]) {
      return this.buildUrl(categoryEndpoints[endpoint]);
    }
    throw new Error(`Endpoint not found: ${category}.${endpoint}`);
  }

  /**
   * Check if mock fallback is enabled
   */
  isMockFallbackEnabled(): boolean {
    return environment.api.enableMockFallback;
  }

  /**
   * Get mock delay duration
   */
  getMockDelay(): number {
    return environment.api.mockDelay || 1000;
  }

  /**
   * Initialize API endpoints
   */
  private initializeEndpoints(): ApiEndpoints {
    return {
      auth: {
        login: 'auth/login',
        logout: 'auth/logout',
        refreshToken: 'auth/refresh',
        changePassword: 'auth/change-password'
      },
      financial: {
        transactions: 'financial/transactions',
        income: 'financial/income',
        expenses: 'financial/expenses',
        summary: 'financial/summary',
        categories: 'financial/categories'
      },
      user: {
        profile: 'user/profile',
        preferences: 'user/preferences',
        settings: 'user/settings'
      },
      reports: {
        generate: 'reports/generate',
        export: 'reports/export'
      }
    };
  }
}
