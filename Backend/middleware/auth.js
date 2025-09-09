import { getAuth } from '../config/firebaseAdmin.js';

// Auth middleware for protected routes
export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Authorization header is required'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authorization format. Use Bearer <token>'
      });
    }

    const idToken = authHeader.substring(7);

    if (!idToken) {
      return res.status(401).json({
        success: false,
        error: 'Token is required'
      });
    }

    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(idToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || '',
      emailVerified: decodedToken.email_verified || false,
      picture: decodedToken.picture || '',
      firebase: decodedToken
    };

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token has expired. Please login again',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.code === 'auth/id-token-revoked') {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked. Please login again',
        code: 'TOKEN_REVOKED'
      });
    } else if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Optional authentication middleware
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const idToken = authHeader.substring(7);

    if (!idToken) {
      req.user = null;
      return next();
    }

    try {
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken);

      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.name || '',
        emailVerified: decodedToken.email_verified || false,
        picture: decodedToken.picture || '',
        firebase: decodedToken
      };
    } catch (verifyError) {
      req.user = null;
    }

    next();

  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

// Admin check middleware
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.user.firebase.admin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    next();

  } catch (error) {
    console.error('Admin middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};

// Email verification check middleware
export const requireEmailVerification = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!req.user.emailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();

  } catch (error) {
    console.error('Email verification middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Email verification check failed'
    });
  }
};
