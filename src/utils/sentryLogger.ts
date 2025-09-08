import * as Sentry from "@sentry/react";

// Initialize Sentry (you can also do this in main.tsx if you want app-wide coverage later)
export const initSentry = () => {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN, // You'll need to add this to your .env file
    environment: import.meta.env.MODE, // 'development' or 'production'
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Only send in production, or if explicitly enabled in development
      if (import.meta.env.MODE === 'development' && !import.meta.env.VITE_SENTRY_DEBUG) {
        return null;
      }
      return event;
    }
  });
};

// Custom logger for registration page
export const registrationLogger = {
  info: (message: string, extra?: any) => {
    console.log(`[Registration] ${message}`, extra);
    Sentry.addBreadcrumb({
      message: `[Registration] ${message}`,
      level: 'info',
      category: 'registration',
      data: extra
    });
  },
  
  error: (message: string, error?: Error | any, extra?: any) => {
    console.error(`[Registration] ${message}`, error, extra);
    
    // Send to Sentry with context
    Sentry.withScope((scope) => {
      scope.setTag('page', 'registration-detail');
      scope.setContext('registration_context', extra);
      
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(`[Registration] ${message}`, 'error');
      }
    });
  },
  
  warn: (message: string, extra?: any) => {
    console.warn(`[Registration] ${message}`, extra);
    Sentry.addBreadcrumb({
      message: `[Registration] ${message}`,
      level: 'warning',
      category: 'registration',
      data: extra
    });
  },
  
  // Special method for tracking registration actions
  trackAction: (action: string, registrationId?: string, details?: any) => {
    const message = `Registration action: ${action}`;
    console.log(message, { registrationId, details });
    
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      category: 'user_action',
      data: { action, registrationId, details }
    });
  }
};
