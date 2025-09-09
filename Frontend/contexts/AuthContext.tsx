// Unified Authentication Context for Legal Lens
'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Types
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Error message mapper
const getAuthErrorMessage = (errorCode: string): string => {
  if (!errorCode) {
    return 'An error occurred during authentication.';
  }
  
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and Firebase configuration.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled.';
    default:
      console.warn('Unhandled auth error code:', errorCode);
      return `Authentication error: ${errorCode}. Please try again.`;
  }
};

// Auth Provider
const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // login
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Robust error handling
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error && error.code) {
        errorMessage = getAuthErrorMessage(error.code);
      } else if (error && error.message) {
        errorMessage = error.message;
      }
      
      // Ensure errorMessage is never undefined
      if (!errorMessage || errorMessage.trim() === '') {
        errorMessage = 'Login failed. Please try again.';
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // register
  const register = async (
    email: string,
    password: string,
    displayName?: string
  ): Promise<void> => {
    try {
      setLoading(true);
      
      // Check if Firebase is properly initialized
      if (!auth) {
        throw new Error('Firebase auth not initialized');
      }
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, { displayName });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific network errors
      if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and Firebase configuration.');
      }
      
      const errorMessage = getAuthErrorMessage(error.code);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // login with Google
  const loginWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      const errorMessage = error.code
        ? getAuthErrorMessage(error.code)
        : error.message;
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // logout
  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await signOut(auth);
    } catch {
      throw new Error('Failed to logout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/login`,
        handleCodeInApp: false,
      });
    } catch (error: any) {
      const errorMessage = error.code
        ? getAuthErrorMessage(error.code)
        : error.message;
      throw new Error(errorMessage);
    }
  };

  // update profile
  const updateUserProfile = async (displayName: string): Promise<void> => {
    try {
      if (!auth.currentUser) throw new Error('No authenticated user found.');
      await updateProfile(auth.currentUser, { displayName });
      setUser(auth.currentUser); // ✅ fixed
    } catch {
      throw new Error('Failed to update profile. Please try again.');
    }
  };

  // listen for state changes
  useEffect(() => {
    let isMounted = true;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (isMounted) {
        setUser(user);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    loginWithGoogle,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? (
        <React.Fragment>{children}</React.Fragment>
      ) : (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
