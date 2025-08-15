# API Integration Guide

This guide explains how to use the new API call structure with environment-based configuration and fallback behavior.

## Overview

The application now supports three modes of operation:
- **API Mode**: Uses real API endpoints
- **Mock Mode**: Uses simulated local data with delays
- **Auto Mode**: Automatically switches between API and Mock based on API availability

## Environment Configuration

### Development Environment (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  api: {
    baseUrl: 'https://localhost:7104/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableMockFallback: true,
    mockDelay: 1000
  }
};
```

### Production Environment (`src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  api: {
    baseUrl: 'https://api.financialdashboard.com/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableMockFallback: false,
    mockDelay: 0
  }
};
```

## How to Use the New API Services

### 1. Using the Financial Data API Service

```typescript
import { FinancialDataApiService } from './services/financial-data-api.service';

@Component({...})
export class MyComponent {
  constructor(private financialApi: FinancialDataApiService) {}

  loadExpenses() {
    this.financialApi.getExpenseEntries().subscribe(
      expenses => {
        console.log('Expenses loaded:', expenses);
      },
      error => {
        console.error('Failed to load expenses:', error);
      }
    );
  }

  createExpense(expenseData: any) {
    this.financialApi.createExpenseEntry(expenseData).subscribe(
      newExpense => {
        console.log('Expense created:', newExpense);
      },
      error => {
        console.error('Failed to create expense:', error);
      }
    );
  }
}
```

### 2. Using the Auth API Service

```typescript
import { AuthApiService } from './services/auth-api.service';

@Component({...})
export class LoginComponent {
  constructor(private authApi: AuthApiService) {}

  login(username: string, password: string) {
    this.authApi.login(username, password, false).subscribe(
      success => {
        if (success) {
          console.log('Login successful');
        } else {
          console.log('Login failed');
        }
      },
      error => {
        console.error('Login error:', error);
      }
    );
  }
}
```

### 3. Using the API Orchestrator (Recommended)

The API Orchestrator automatically chooses the best service based on API availability:

```typescript
import { ApiOrchestratorService } from './services/api-orchestrator.service';

@Component({...})
export class MyComponent {
  constructor(private apiOrchestrator: ApiOrchestratorService) {}

  ngOnInit() {
    // Get the appropriate service (API or Mock)
    const financialService = this.apiOrchestrator.getFinancialDataService();
    
    // Use it normally - the orchestrator handles the rest
    financialService.getExpenseEntries().subscribe(expenses => {
      console.log('Expenses:', expenses);
    });
  }

  // Check service status
  checkApiStatus() {
    this.apiOrchestrator.getServiceStatus().subscribe(status => {
      console.log('Service Status:', status);
    });
  }

  // Force API mode (for testing)
  useApiMode() {
    this.apiOrchestrator.setServiceMode('api');
  }

  // Force Mock mode (for offline development)
  useMockMode() {
    this.apiOrchestrator.setServiceMode('mock');
  }
}
```

## API Response Format

All API responses follow this standardized format:

```typescript
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: any[];
  timestamp: string;
}
```

## Error Handling and Fallbacks

### Automatic Fallback
When `enableMockFallback` is true and an API call fails:
1. The service automatically retries the request (configurable)
2. If all retries fail, it falls back to mock data
3. The user experience remains seamless

### Manual Fallback Control
```typescript
// Disable fallback for a specific request
this.apiService.get('/endpoint', {
  enableMockFallback: false
}).subscribe(...);

// Provide custom mock data
this.apiService.get('/endpoint', {
  mockResponse: { custom: 'mock data' }
}).subscribe(...);
```

## Health Monitoring

### API Health Checks
The system automatically monitors API health every 30 seconds:

```typescript
// Manual health check
this.apiOrchestrator.checkApiHealth().subscribe(status => {
  console.log('API Health:', status);
});

// Subscribe to health status changes
this.apiOrchestrator.healthStatus$.subscribe(status => {
  if (status.isHealthy) {
    console.log('API is healthy');
  } else {
    console.log('API is down, using fallback');
  }
});
```

### Development Debug Widget

In development mode, an API status widget appears in the bottom-right corner showing:
- Current service mode (API/Mock/Auto)
- API health status
- Response times
- Active services
- Configuration details

## Building for Different Environments

```bash
# Development (uses environment.ts)
ng build

# Production (uses environment.prod.ts)
ng build --configuration=production

# Staging (uses environment.staging.ts)
ng build --configuration=staging
```

## Best Practices

### 1. Always Use Observable Patterns
```typescript
// Good
this.financialApi.getExpenses().subscribe(expenses => {
  this.expenses = expenses;
});

// Better - handle errors
this.financialApi.getExpenses().subscribe({
  next: expenses => this.expenses = expenses,
  error: error => this.handleError(error)
});
```

### 2. Leverage the Orchestrator
```typescript
// Instead of importing multiple services
constructor(
  private financialApi: FinancialDataApiService,
  private financialMock: FinancialDataService
) {}

// Use the orchestrator
constructor(private apiOrchestrator: ApiOrchestratorService) {}
```

### 3. Environment-Specific Configuration
```typescript
// Don't hardcode URLs
const apiUrl = 'https://localhost:7104/api'; // Bad

// Use environment configuration
const apiUrl = environment.api.baseUrl; // Good
```

### 4. Graceful Degradation
Always design your UI to work with both real and mock data:

```typescript
loadData() {
  this.loading = true;
  
  this.getDataService().getData().subscribe({
    next: data => {
      this.data = data;
      this.loading = false;
    },
    error: error => {
      this.showErrorMessage('Failed to load data');
      this.loading = false;
      // App still works with empty state
    }
  });
}
```

## Migration from Old Services

To migrate existing components:

1. Replace service injections:
```typescript
// Old
constructor(private financialData: FinancialDataService) {}

// New
constructor(private apiOrchestrator: ApiOrchestratorService) {}
```

2. Update service calls:
```typescript
// Old
this.financialData.getExpenses()

// New
this.apiOrchestrator.getFinancialDataService().getExpenseEntries()
```

3. The method signatures are mostly compatible, but check the new API service interfaces for any changes.

## Troubleshooting

### API Not Connecting
1. Check the API status widget (development mode)
2. Verify the base URL in environment configuration
3. Check browser network tab for failed requests
4. Ensure CORS is configured on the API server

### Mock Fallback Not Working
1. Verify `enableMockFallback` is true in environment
2. Check that mock responses are provided in the service
3. Look for console warnings about fallback usage

### Service Mode Issues
1. Use the API status widget to manually switch modes
2. Check the orchestrator service logs in browser console
3. Verify health check endpoints are responding correctly
