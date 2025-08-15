export const environment = {
  production: true,
  api: {
    baseUrl: 'https://api.financialdashboard.com/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableMockFallback: false,
    mockDelay: 0
  },
  app: {
    name: 'Financial Dashboard',
    version: '1.0.0'
  },
  features: {
    enableLogging: false,
    enableDebugMode: false,
    enableAnalytics: true
  }
};
