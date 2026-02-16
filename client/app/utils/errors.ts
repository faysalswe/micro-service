/**
 * Error Utilities
 * Custom error classes and error handling utilities
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  /**
   * Creates a new AppError
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code] - Error code for client handling
   * @param {boolean} [isOperational=true] - Whether error is operational
   */
  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not Found Error (404)
 */
export class NotFoundError extends AppError {
  /**
   * Creates a NotFoundError
   * @param {string} resource - Resource that was not found
   */
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Unauthorized Error (401)
 */
export class UnauthorizedError extends AppError {
  /**
   * Creates an UnauthorizedError
   * @param {string} [message='Unauthorized'] - Error message
   */
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/**
 * Forbidden Error (403)
 */
export class ForbiddenError extends AppError {
  /**
   * Creates a ForbiddenError
   * @param {string} [message='Forbidden'] - Error message
   */
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/**
 * Validation Error (400)
 */
export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  /**
   * Creates a ValidationError
   * @param {string} message - Error message
   * @param {Record<string, string[]>} [errors] - Field-specific validation errors
   */
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

/**
 * Conflict Error (409)
 */
export class ConflictError extends AppError {
  /**
   * Creates a ConflictError
   * @param {string} message - Error message
   */
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Internal Server Error (500)
 */
export class InternalServerError extends AppError {
  /**
   * Creates an InternalServerError
   * @param {string} [message='Internal server error'] - Error message
   */
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}

/**
 * Service Unavailable Error (503)
 */
export class ServiceUnavailableError extends AppError {
  /**
   * Creates a ServiceUnavailableError
   * @param {string} [message='Service unavailable'] - Error message
   */
  constructor(message: string = 'Service unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * Type guard to check if error is an AppError
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Format error for client response
 * @param {unknown} error - Error to format
 * @returns {object} Formatted error object
 */
export function formatError(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
  errors?: Record<string, string[]>;
} {
  if (isAppError(error)) {
    const formatted: {
      message: string;
      statusCode: number;
      code?: string;
      errors?: Record<string, string[]>;
    } = {
      message: error.message,
      statusCode: error.statusCode,
    };

    if (error.code) {
      formatted.code = error.code;
    }

    if (error instanceof ValidationError && error.errors) {
      formatted.errors = error.errors;
    }

    return formatted;
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
    };
  }

  return {
    message: 'An unknown error occurred',
    statusCode: 500,
    code: 'UNKNOWN_ERROR',
  };
}

/**
 * Log error (in production, this would send to logging service)
 * @param {unknown} error - Error to log
 * @param {Record<string, unknown>} [context] - Additional context
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', error);
    if (context) {
      console.error('Context:', context);
    }
  } else {
    // In production, send to logging service (e.g., Sentry, LogRocket)
    // Example: Sentry.captureException(error, { extra: context });
  }
}
