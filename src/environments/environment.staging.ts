export const environment = {
  production: false,
  api: {
    baseUrl: 'https://staging-api.financialdashboard.com/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableMockFallback: true,
    mockDelay: 500
  },
  app: {
    name: 'Financial Dashboard (Staging)',
    version: '1.0.0'
  },
  features: {
    enableLogging: true,
    enableDebugMode: true,
    enableAnalytics: false
  }
};
