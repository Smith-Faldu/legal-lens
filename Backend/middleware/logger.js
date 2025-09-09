import { createWriteStream } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, '..', 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Create log streams
const accessLogStream = createWriteStream(
  join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = createWriteStream(
  join(logsDir, 'error.log'),
  { flags: 'a' }
);

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Capture response
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log request details
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      responseTime: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      referer: req.get('Referer') || '',
      contentLength: res.get('Content-Length') || 0,
      user: req.user ? {
        uid: req.user.uid,
        email: req.user.email
      } : null
    };

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      const statusColor = getStatusColor(res.statusCode);
      console.log(
        `${new Date().toISOString()} - ${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} - ${duration}ms`
      );
    }

    // Write to access log
    if (process.env.NODE_ENV === 'production') {
      accessLogStream.write(JSON.stringify(logData) + '\n');
    }

    // Log errors
    if (res.statusCode >= 400) {
      const errorData = {
        ...logData,
        requestBody: req.body,
        requestQuery: req.query,
        requestParams: req.params
      };

      console.error('Request error:', errorData);
      
      if (process.env.NODE_ENV === 'production') {
        errorLogStream.write(JSON.stringify(errorData) + '\n');
      }
    }

    originalSend.call(this, data);
  };

  next();
};

export const apiLogger = (req, res, next) => {
  // Enhanced logging for API routes
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    endpoint: req.originalUrl,
    headers: {
      authorization: req.headers.authorization ? '[REDACTED]' : undefined,
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    },
    body: sanitizeBody(req.body),
    query: req.query,
    params: req.params,
    ip: req.ip
  };

  console.log('API Request:', JSON.stringify(logData, null, 2));
  next();
};

export const performanceLogger = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    if (duration > 1000) { // Log slow requests (> 1 second)
      console.warn(`Slow request detected: ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`);
    }

    if (process.env.NODE_ENV === 'development' && duration > 500) {
      console.log(`Performance: ${req.method} ${req.originalUrl} - ${duration.toFixed(2)}ms`);
    }
  });

  next();
};

export const securityLogger = (req, res, next) => {
  // Log security-related events
  const suspiciousPatterns = [
    /\.\./,           // Directory traversal
    /<script/i,       // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i,   // JavaScript URLs
    /on\w+=/i        // Event handlers
  ];

  const url = req.originalUrl;
  const body = JSON.stringify(req.body);
  
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body)
  );

  if (isSuspicious) {
    const securityEvent = {
      timestamp: new Date().toISOString(),
      type: 'SUSPICIOUS_REQUEST',
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      headers: req.headers
    };

    console.warn('Security Alert:', securityEvent);
    
    if (process.env.NODE_ENV === 'production') {
      errorLogStream.write(JSON.stringify(securityEvent) + '\n');
    }
  }

  next();
};

const getStatusColor = (statusCode) => {
  if (statusCode >= 500) return '\x1b[31m'; // Red
  if (statusCode >= 400) return '\x1b[33m'; // Yellow
  if (statusCode >= 300) return '\x1b[36m'; // Cyan
  if (statusCode >= 200) return '\x1b[32m'; // Green
  return '\x1b[0m'; // Reset
};

const sanitizeBody = (body) => {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
};

export { accessLogStream, errorLogStream };