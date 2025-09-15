// Error Service - Comprehensive Error Handling & Validation
// Provides centralized error management, logging, and user feedback

interface ErrorConfig {
  enableLogging: boolean;
  enableAnalytics: boolean;
  enableUserFeedback: boolean;
  maxRetries: number;
  retryDelay: number;
}

interface ErrorContext {
  component: string;
  action: string;
  data?: any;
  userId?: string;
  sessionId: string;
  timestamp: string;
  userAgent: string;
  url: string;
}

interface ValidationRule {
  field: string;
  type: 'required' | 'string' | 'number' | 'email' | 'custom';
  message: string;
  validator?: (value: any) => boolean;
  min?: number;
  max?: number;
}

interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
}

enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

enum ErrorCategory {
  NETWORK = 'network',
  API = 'api',
  VALIDATION = 'validation',
  UI = 'ui',
  PERFORMANCE = 'performance',
  SECURITY = 'security'
}

interface AppError extends Error {
  code: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: ErrorContext;
  recoverable: boolean;
  userMessage: string;
  technicalDetails: string;
}

class ErrorService {
  private config: ErrorConfig;
  private errorLog: AppError[] = [];
  private sessionId: string;
  private retryCount: Map<string, number> = new Map();

  constructor(config: ErrorConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  // Error creation and handling
  createError(
    message: string,
    code: string,
    severity: ErrorSeverity,
    category: ErrorCategory,
    context: Partial<ErrorContext>,
    recoverable = true
  ): AppError {
    const error = new Error(message) as AppError;
    error.code = code;
    error.severity = severity;
    error.category = category;
    error.recoverable = recoverable;
    error.userMessage = this.generateUserMessage(category, severity);
    error.technicalDetails = message;
    error.context = {
      ...this.getDefaultContext(),
      ...context
    };

    return error;
  }

  async handleError(error: AppError | Error): Promise<void> {
    const appError = this.normalizeError(error);
    
    // Log the error
    this.logError(appError);
    
    // Track analytics if enabled
    if (this.config.enableAnalytics) {
      this.trackError(appError);
    }
    
    // Show user feedback if appropriate
    if (this.config.enableUserFeedback && appError.severity !== ErrorSeverity.LOW) {
      this.showUserFeedback(appError);
    }
    
    // Attempt recovery if possible
    if (appError.recoverable) {
      await this.attemptRecovery(appError);
    }
  }

  // Validation
  validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    for (const rule of rules) {
      const value = data[rule.field];
      let isValid = true;

      switch (rule.type) {
        case 'required':
          isValid = value !== undefined && value !== null && value !== '';
          break;
        
        case 'string':
          isValid = typeof value === 'string';
          if (isValid && rule.min !== undefined) {
            isValid = value.length >= rule.min;
          }
          if (isValid && rule.max !== undefined) {
            isValid = value.length <= rule.max;
          }
          break;
        
        case 'number':
          isValid = typeof value === 'number' && !isNaN(value);
          if (isValid && rule.min !== undefined) {
            isValid = value >= rule.min;
          }
          if (isValid && rule.max !== undefined) {
            isValid = value <= rule.max;
          }
          break;
        
        case 'email':
          isValid = typeof value === 'string' && /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(value);
          break;
        
        case 'custom':
          isValid = rule.validator ? rule.validator(value) : true;
          break;
      }

      if (!isValid) {
        errors.push({
          field: rule.field,
          message: rule.message
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Retry mechanism
  async withRetry<T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries || this.config.maxRetries;
    const currentRetryCount = this.retryCount.get(operationId) || 0;

    try {
      const result = await operation();
      this.retryCount.delete(operationId); // Reset on success
      return result;
    } catch (error) {
      if (currentRetryCount < retries) {
        this.retryCount.set(operationId, currentRetryCount + 1);
        
        // Exponential backoff
        const delay = this.config.retryDelay * Math.pow(2, currentRetryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.withRetry(operation, operationId, maxRetries);
      } else {
        this.retryCount.delete(operationId);
        throw this.createError(
          `Operation failed after ${retries} retries: ${error.message}`,
          'RETRY_EXHAUSTED',
          ErrorSeverity.HIGH,
          ErrorCategory.API,
          { action: operationId },
          false
        );
      }
    }
  }

  // Climate-specific validations
  validateClimateData(data: any): ValidationResult {
    const rules: ValidationRule[] = [
      {
        field: 'indicator',
        type: 'required',
        message: 'Climate indicator is required'
      },
      {
        field: 'indicator',
        type: 'custom',
        message: 'Invalid climate indicator',
        validator: (value) => ['co2', 'avg_temperature', 'gdp', 'renewable_adoption'].includes(value)
      },
      {
        field: 'region',
        type: 'string',
        message: 'Region must be a valid string',
        min: 2,
        max: 100
      },
      {
        field: 'timeRange',
        type: 'custom',
        message: 'Invalid time range',
        validator: (value) => ['1y', '5y', '10y'].includes(value)
      }
    ];

    return this.validate(data, rules);
  }

  validateAPIResponse(response: any, expectedStructure: any): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    const validateStructure = (obj: any, expected: any, path = '') => {
      for (const key in expected) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj)) {
          errors.push({
            field: currentPath,
            message: `Missing required field: ${currentPath}`
          });
          continue;
        }

        const expectedType = expected[key];
        const actualValue = obj[key];

        if (typeof expectedType === 'string') {
          if (typeof actualValue !== expectedType) {
            errors.push({
              field: currentPath,
              message: `Expected ${expectedType}, got ${typeof actualValue}`
            });
          }
        } else if (typeof expectedType === 'object' && expectedType !== null) {
          if (Array.isArray(expectedType)) {
            if (!Array.isArray(actualValue)) {
              errors.push({
                field: currentPath,
                message: `Expected array, got ${typeof actualValue}`
              });
            }
          } else {
            validateStructure(actualValue, expectedType, currentPath);
          }
        }
      }
    };

    validateStructure(response, expectedStructure);

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Private methods
  private setupGlobalErrorHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = this.createError(
        event.reason?.message || 'Unhandled promise rejection',
        'UNHANDLED_PROMISE',
        ErrorSeverity.HIGH,
        ErrorCategory.API,
        { action: 'promise_rejection' },
        false
      );
      
      this.handleError(error);
      event.preventDefault();
    });

    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      const error = this.createError(
        event.message,
        'GLOBAL_ERROR',
        ErrorSeverity.MEDIUM,
        ErrorCategory.UI,
        { 
          action: 'global_error',
          data: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        },
        true
      );
      
      this.handleError(error);
    });
  }

  private normalizeError(error: Error | AppError): AppError {
    if ('code' in error && 'severity' in error) {
      return error as AppError;
    }

    // Convert regular Error to AppError
    return this.createError(
      error.message,
      'UNKNOWN_ERROR',
      ErrorSeverity.MEDIUM,
      ErrorCategory.API,
      { action: 'unknown' },
      true
    );
  }

  private logError(error: AppError): void {
    if (!this.config.enableLogging) return;

    // Add to internal log
    this.errorLog.push(error);
    
    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Console logging based on severity
    const logLevel = this.getLogLevel(error.severity);
    console[logLevel]('Climate Insight Error:', {
      code: error.code,
      message: error.message,
      severity: error.severity,
      category: error.category,
      context: error.context,
      stack: error.stack
    });
  }

  private trackError(error: AppError): void {
    // Analytics tracking would go here
    // For now, just log to console
    console.info('Error Analytics:', {
      code: error.code,
      category: error.category,
      severity: error.severity,
      sessionId: this.sessionId,
      timestamp: error.context.timestamp
    });
  }

  private showUserFeedback(error: AppError): void {
    // This would integrate with your toast/notification system
    const toastType = this.getToastType(error.severity);
    
    // For now, just console log what would be shown to user
    console.warn(`[${toastType.toUpperCase()}] ${error.userMessage}`);
    
    // In a real implementation, you'd show toast notifications here
    // toast[toastType](error.userMessage);
  }

  private async attemptRecovery(error: AppError): Promise<void> {
    switch (error.category) {
      case ErrorCategory.NETWORK:
        // Retry network operations
        console.log('Attempting network recovery...');
        break;
      
      case ErrorCategory.API:
        // Refresh auth tokens, retry API calls
        console.log('Attempting API recovery...');
        break;
      
      case ErrorCategory.VALIDATION:
        // Clear invalid data, prompt user for correct input
        console.log('Attempting validation recovery...');
        break;
      
      default:
        console.log('No automatic recovery available');
    }
  }

  private generateUserMessage(category: ErrorCategory, severity: ErrorSeverity): string {
    const messages = {
      [ErrorCategory.NETWORK]: {
        [ErrorSeverity.LOW]: 'Connection issue detected',
        [ErrorSeverity.MEDIUM]: 'Network connection problem',
        [ErrorSeverity.HIGH]: 'Unable to connect to climate data services',
        [ErrorSeverity.CRITICAL]: 'Critical network failure - please check your connection'
      },
      [ErrorCategory.API]: {
        [ErrorSeverity.LOW]: 'Data retrieval delay',
        [ErrorSeverity.MEDIUM]: 'Climate data service temporarily unavailable',
        [ErrorSeverity.HIGH]: 'Unable to fetch climate data',
        [ErrorSeverity.CRITICAL]: 'Climate data services are currently down'
      },
      [ErrorCategory.VALIDATION]: {
        [ErrorSeverity.LOW]: 'Please check your input',
        [ErrorSeverity.MEDIUM]: 'Invalid data provided',
        [ErrorSeverity.HIGH]: 'Required information is missing or incorrect',
        [ErrorSeverity.CRITICAL]: 'Critical data validation failure'
      }
    };

    return messages[category]?.[severity] || 'An unexpected error occurred';
  }

  private getDefaultContext(): ErrorContext {
    return {
      component: 'unknown',
      action: 'unknown',
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  private getLogLevel(severity: ErrorSeverity): 'log' | 'warn' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'log';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'log';
    }
  }

  private getToastType(severity: ErrorSeverity): 'info' | 'warning' | 'error' {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return 'error';
      default:
        return 'info';
    }
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Public getters
  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  getSessionId(): string {
    return this.sessionId;
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }
}

// Singleton instance
export const errorService = new ErrorService({
  enableLogging: true,
  enableAnalytics: true,
  enableUserFeedback: true,
  maxRetries: 3,
  retryDelay: 1000
});

export { ErrorSeverity, ErrorCategory };
export type { AppError, ValidationResult, ValidationRule };
export default ErrorService;
