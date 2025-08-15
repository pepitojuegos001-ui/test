export const environment = {
  production: false,
  api: {
    baseUrl: 'https://localhost:7104/api',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    enableMockFallback: true,
    mockDelay: 1000 // Simulated delay for development
  },
  app: {
    name: 'Financial Dashboard',
    version: '1.0.0'
  },
  features: {
    enableLogging: true,
    enableDebugMode: true,
    enableAnalytics: false
  }
};
