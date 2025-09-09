import { body, validationResult, param, query } from 'express-validator';

// Helper function to handle validation results
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Auth validation rules
export const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters'),
  
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

export const validateUpdateProfile = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be between 1 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  handleValidationErrors
];

// File upload validation
export const validateFileUpload = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/gif'
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Only PDF and image files are allowed',
        allowedTypes
      });
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 50MB',
        maxSize: '50MB'
      });
    }

    // Validate file name
    if (!req.file.originalname || req.file.originalname.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file name'
      });
    }

    next();

  } catch (error) {
    console.error('File validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'File validation failed'
    });
  }
};

// Document validation
export const validateDocumentId = [
  param('id')
    .notEmpty()
    .withMessage('Document ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Invalid document ID format'),
  
  handleValidationErrors
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'fileName', 'size'])
    .withMessage('Invalid sort field'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  
  handleValidationErrors
];

// Analysis validation
export const validateAnalysisRequest = [
  body('gcsUri')
    .optional()
    .isString()
    .withMessage('GCS URI must be a string')
    .matches(/^gs:\/\//)
    .withMessage('Invalid GCS URI format'),
  
  body('documentId')
    .optional()
    .isString()
    .withMessage('Document ID must be a string'),
  
  body('question')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be between 1 and 1000 characters'),
  
  // At least one of gcsUri or documentId must be provided
  body()
    .custom((value, { req }) => {
      if (!req.body.gcsUri && !req.body.documentId) {
        throw new Error('Either gcsUri or documentId must be provided');
      }
      return true;
    }),
  
  handleValidationErrors
];

export const validateChatRequest = [
  body('message')
    .notEmpty()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  
  body('gcsUri')
    .optional()
    .isString()
    .withMessage('GCS URI must be a string')
    .matches(/^gs:\/\//)
    .withMessage('Invalid GCS URI format'),
  
  body('documentId')
    .optional()
    .isString()
    .withMessage('Document ID must be a string'),
  
  body('conversationHistory')
    .optional()
    .isArray()
    .withMessage('Conversation history must be an array'),
  
  body('conversationHistory.*')
    .optional()
    .isObject()
    .withMessage('Each conversation item must be an object'),
  
  // At least one of gcsUri or documentId must be provided
  body()
    .custom((value, { req }) => {
      if (!req.body.gcsUri && !req.body.documentId) {
        throw new Error('Either gcsUri or documentId must be provided');
      }
      return true;
    }),
  
  handleValidationErrors
];

export const validateAnalysisId = [
  param('id')
    .notEmpty()
    .withMessage('Analysis ID is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Invalid analysis ID format'),
  
  handleValidationErrors
];

// Rate limiting validation
export const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (process.env.REQUIRE_API_KEY === 'true' && !apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key is required'
      });
    }

    if (apiKey && process.env.VALID_API_KEYS) {
      const validKeys = process.env.VALID_API_KEYS.split(',');
      if (!validKeys.includes(apiKey)) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API key'
        });
      }
    }

    next();

  } catch (error) {
    console.error('API key validation error:', error);
    return res.status(500).json({
      success: false,
      error: 'API key validation failed'
    });
  }
};