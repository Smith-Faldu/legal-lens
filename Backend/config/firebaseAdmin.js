import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let adminApp;

export const initializeFirebaseAdmin = async () => {
  if (adminApp) return adminApp;

  let credential;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'legal-lens-52acb';

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const serviceAccountKey = readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountKey);
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    credential = admin.credential.cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else {
    credential = admin.credential.applicationDefault();
  }

  const config = {
    credential,
    projectId,
  };

  if (process.env.GOOGLE_CLOUD_STORAGE_BUCKET) {
    config.storageBucket = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
  }

  adminApp = admin.initializeApp(config);

  // Optionally test connection
  try {
    await adminApp.auth().listUsers(1);
  } catch (err) {
    console.warn('Firebase Admin test connection failed:', err.message);
  }

  return adminApp;
};

export const getFirebaseAdmin = () => {
  if (!adminApp) throw new Error('Firebase Admin not initialized');
  return adminApp;
};

export const getFirestore = () => getFirebaseAdmin().firestore();
export const getAuth = () => getFirebaseAdmin().auth();
export const getStorage = () => getFirebaseAdmin().storage();

export default admin;
