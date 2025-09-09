import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';

export interface AuthError extends Error {
  code: string;
}

// Enhanced error message mapping
export const getAuthErrorMessage = (errorCode: string): string => {
  console.log('🔍 Auth error code:', errorCode);
  
  switch (errorCode) {
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'auth/invalid-api-key':
      return 'Firebase configuration error. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please wait a moment and try again.';
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password combination.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled.';
    case 'auth/configuration-not-found':
      return 'Firebase configuration error. Please contact support.';
    case 'auth/project-not-found':
      return 'Firebase project not found. Please contact support.';
    default:
      console.error('🚨 Unhandled auth error:', errorCode);
      return `Authentication error (${errorCode}). Please try again or contact support.`;
  }
};

// Sign in function
export const signInUser = async (email: string, password: string): Promise<User> => {
  try {
    console.log('🔐 Attempting sign in for:', email);
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Sign in successful');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Sign in error:', error);
    const errorMessage = error.code ? getAuthErrorMessage(error.code) : error.message;
    throw new Error(errorMessage);
  }
};

// Sign up function
export const signUpUser = async (email: string, password: string, displayName?: string): Promise<User> => {
  try {
    console.log('📝 Attempting sign up for:', email);
    
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
      console.log('✅ Profile updated with display name');
    }
    
    console.log('✅ Sign up successful');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Sign up error:', error);
    const errorMessage = error.code ? getAuthErrorMessage(error.code) : error.message;
    throw new Error(errorMessage);
  }
};

// Sign out function
export const signOutUser = async (): Promise<void> => {
  try {
    console.log('🚪 Attempting sign out');
    await signOut(auth);
    console.log('✅ Sign out successful');
  } catch (error: any) {
    console.error('❌ Sign out error:', error);
    throw new Error('Sign out failed. Please try again.');
  }
};

// Google sign in
export const signInWithGoogle = async (): Promise<User> => {
  try {
    console.log('🔐 Attempting Google sign in');
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    const userCredential = await signInWithPopup(auth, provider);
    console.log('✅ Google sign in successful');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Google sign in error:', error);
    
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign in was cancelled');
    }
    
    const errorMessage = error.code ? getAuthErrorMessage(error.code) : error.message;
    throw new Error(errorMessage);
  }
};

// Password reset
export const resetPassword = async (email: string): Promise<void> => {
  try {
    console.log('📧 Sending password reset email to:', email);
    
    if (!email) {
      throw new Error('Email is required');
    }
    
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Password reset email sent');
  } catch (error: any) {
    console.error('❌ Password reset error:', error);
    const errorMessage = error.code ? getAuthErrorMessage(error.code) : error.message;
    throw new Error(errorMessage);
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};
