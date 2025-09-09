import { initializeFirestore } from '../services/firestoreService.js';
import { initializeGoogleCloud } from '../services/googleCloud.js';
import { initializeFirebaseAdmin } from '../services/firebaseAdmin.js';

export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database connections...');

    // Initialize Firebase Admin (for authentication)
    await initializeFirebaseAdmin();
    console.log('✅ Firebase Admin initialized');

    // Initialize Google Cloud services
    await initializeGoogleCloud();
    console.log('✅ Google Cloud Storage initialized');

    // Note: Firestore is initialized with Firebase Admin
    console.log('✅ Database initialization completed');

    return true;

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

export const getDatabaseHealth = async () => {
  try {
    const health = {
      firebase: false,
      googleCloud: false,
      timestamp: new Date().toISOString()
    };

    // Check Firebase Admin connection
    try {
      const { getFirebaseAdmin } = await import('../services/firebaseAdmin.js');
      const admin = getFirebaseAdmin();
      await admin.auth().listUsers(1); // Test call
      health.firebase = true;
    } catch (error) {
      console.warn('Firebase health check failed:', error.message);
    }

    // Check Google Cloud Storage connection
    try {
      const { bucket } = await import('../services/googleCloud.js');
      if (bucket) {
        const [exists] = await bucket.exists();
        health.googleCloud = exists;
      }
    } catch (error) {
      console.warn('Google Cloud health check failed:', error.message);
    }

    return health;

  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      firebase: false,
      googleCloud: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export default {
  initializeDatabase,
  getDatabaseHealth
};