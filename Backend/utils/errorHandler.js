// Centralized error handling utility
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error types
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

// Error factory functions
export const createValidationError = (message) => 
  new AppError(message, 400, true);

export const createAuthenticationError = (message = 'Authentication required') => 
  new AppError(message, 401, true);

export const createAuthorizationError = (message = 'Access denied') => 
  new AppError(message, 403, true);

export const createNotFoundError = (resource = 'Resource') => 
  new AppError(`${resource} not found`, 404, true);

export const createDuplicateError = (resource = 'Resource') => 
  new AppError(`${resource} already exists`, 409, true);

export const createExternalApiError = (service, message) => 
  new AppError(`${service} API error: ${message}`, 502, true);

export const createFileUploadError = (message) => 
  new AppError(`File upload error: ${message}`, 400, true);

export const createDatabaseError = (message) => 
  new AppError(`Database error: ${message}`, 500, true);

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Response helper
export const sendErrorResponse = (res, error) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const response = {
    success: false,
    error: error.message,
    timestamp: error.timestamp || new Date().toISOString(),
    ...(isDevelopment && { stack: error.stack })
  };

  res.status(error.statusCode || 500).json(response);
};

export default {
  AppError,
  ErrorTypes,
  createValidationError,
  createAuthenticationError,
  createAuthorizationError,
  createNotFoundError,
  createDuplicateError,
  createExternalApiError,
  createFileUploadError,
  createDatabaseError,
  asyncHandler,
  sendErrorResponse
};
