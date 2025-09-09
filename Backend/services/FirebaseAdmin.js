import { getAuth } from '../config/firebaseAdmin.js';

// Create a custom token for a user
export const createCustomToken = async (uid, additionalClaims = {}) => {
  const auth = getAuth();
  return await auth.createCustomToken(uid, additionalClaims);
};

// Verify an ID token
export const verifyIdToken = async (idToken) => {
  const auth = getAuth();
  return await auth.verifyIdToken(idToken);
};