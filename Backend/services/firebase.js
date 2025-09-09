import { initializeFirebaseAdmin, getFirebaseAdmin, getFirestore, getAuth, getStorage } from '../config/firebaseAdmin.js';

// Ensure Firebase Admin is initialized before using any service
await initializeFirebaseAdmin();

export { initializeFirebaseAdmin, getFirebaseAdmin, getFirestore, getAuth, getStorage };

export const db = getFirestore();
export const auth = getAuth();
export const storage = getStorage();