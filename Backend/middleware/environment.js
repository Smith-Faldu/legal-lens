import dotenv from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables
dotenv.config();

export const validateEnvironment = () => {
  const requiredVars = {
    'GOOGLE_CLOUD_PROJECT_ID': 'Google Cloud Project ID is required',
    'GEMINI_API_KEY': 'Gemini API key is required for AI functionality',
    'DOCUMENT_AI_PROCESSOR_ID': 'Document AI processor ID is required for OCR',
    'DOCUMENT_AI_LOCATION': 'Document AI location is required'
  };

  const warnings = [];
  const errors = [];

  // Check required variables
  for (const [envVar, message] of Object.entries(requiredVars)) {
    if (!process.env[envVar]) {
      errors.push(`${envVar}: ${message}`);
    }
  }

  // Check optional but recommended variables
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    warnings.push('GOOGLE_APPLICATION_CREDENTIALS: Service account key not set, using default credentials');
  }
  if (!process.env.FRONTEND_URL) {
    warnings.push('FRONTEND_URL: Not set, using default CORS settings');
  }

  if (errors.length > 0) {
    throw new Error(`Missing required environment variables:\n${errors.join('\n')}`);
  }

  if (warnings.length > 0) {
    console.warn('Environment warnings:', warnings.join('\n'));
  }

  console.log('✅ Environment variables validated');
};

export const getConfig = () => {
  return {
    // Server
    port: process.env.PORT || 8080,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

    // Firebase
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID
    },

    // Google Cloud
    googleCloud: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      storageBucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET,
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    },

    // AI Services
    gemini: {
      apiKey: process.env.GEMINI_API_KEY
    },

    documentAI: {
      processorId: process.env.DOCUMENT_AI_PROCESSOR_ID,
      location: process.env.DOCUMENT_AI_LOCATION || 'us'
    },

    // Security
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],

    // File Upload
    upload: {
      maxSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024, // 50MB
      allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif']
    },

    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100 // limit each IP to 100 requests per windowMs
    },

    // Logging
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true'
    }
  };
};

export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';
export const isTest = () => process.env.NODE_ENV === 'test';

export default {
  validateEnvironment,
  getConfig,
  isDevelopment,
  isProduction,
  isTest
};