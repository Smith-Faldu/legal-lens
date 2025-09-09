import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Log error to file in production
  if (process.env.NODE_ENV === 'production') {
    logErrorToFile(err, req);
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.message,
      code: 'VALIDATION_ERROR'
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID format',
      code: 'INVALID_ID'
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      code: 'DUPLICATE_ENTRY'
    });
  }

  // Firebase/Google Cloud errors
  if (err.code && err.code.includes('auth/')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication error',
      details: err.message,
      code: err.code
    });
  }

  if (err.code && err.code.includes('storage/')) {
    return res.status(500).json({
      success: false,
      error: 'Storage error',
      details: err.message,
      code: err.code
    });
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File too large',
      details: 'Maximum file size is 50MB',
      code: 'FILE_TOO_LARGE'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: 'Unexpected file field',
      code: 'UNEXPECTED_FILE'
    });
  }

  // Rate limiting errors
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      details: 'Please try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Network/timeout errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      error: 'Service temporarily unavailable',
      details: 'Please try again later',
      code: 'SERVICE_UNAVAILABLE'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Gemini AI errors
  if (err.message?.includes('SAFETY')) {
    return res.status(400).json({
      success: false,
      error: 'Content safety violation',
      details: 'Your content was flagged by safety filters. Please try rephrasing.',
      code: 'CONTENT_SAFETY_VIOLATION'
    });
  }

  if (err.message?.includes('QUOTA_EXCEEDED')) {
    return res.status(429).json({
      success: false,
      error: 'API quota exceeded',
      details: 'Please try again later',
      code: 'QUOTA_EXCEEDED'
    });
  }

  // Document AI errors
  if (err.message?.includes('Document AI')) {
    return res.status(500).json({
      success: false,
      error: 'Document processing failed',
      details: 'Unable to process the document. Please try again or contact support.',
      code: 'DOCUMENT_PROCESSING_ERROR'
    });
  }

  // Default server error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack }),
    code: 'INTERNAL_SERVER_ERROR'
  });
};

const logErrorToFile = (err, req) => {
  try {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        message: err.message,
        stack: err.stack,
        name: err.name,
        code: err.code
      },
      request: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      user: req.user ? {
        uid: req.user.uid,
        email: req.user.email
      } : null
    };

    const logFileName = `error-${new Date().toISOString().split('T')[0]}.json`;
    const logPath = join(__dirname, '..', 'logs', logFileName);
    
    // Append to log file
    const logEntry = JSON.stringify(logData) + '\n';
    writeFileSync(logPath, logEntry, { flag: 'a' });

  } catch (logError) {
    console.error('Failed to log error to file:', logError);
  }
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND'
  });
};

export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};