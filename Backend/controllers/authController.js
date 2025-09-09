import { auth } from '../services/firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createCustomToken, verifyIdToken } from '../services/firebaseAdmin.js';
import { saveUserData, getUserData, updateUserData } from '../services/firestoreService.js';

export const registerUser = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Create user with Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    // Save user data to Firestore
    await saveUserData(user.uid, {
      email: user.email,
      displayName: displayName || '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    });

    // Get ID token
    const idToken = await user.getIdToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: displayName || '',
      },
      token: idToken
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Registration failed'
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update last login
    await updateUserData(user.uid, {
      lastLogin: new Date().toISOString()
    });

    // Get ID token
    const idToken = await user.getIdToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
      },
      token: idToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    // For Firebase, logout is typically handled on the client side
    // Server can invalidate any custom tokens or sessions here
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify and refresh token logic here
    // This would typically involve Firebase Admin SDK

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: 'Token refresh failed'
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user; // From auth middleware

    const userData = await getUserData(user.uid);

    res.status(200).json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
        ...userData
      }
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data'
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const user = req.user; // From auth middleware
    const { displayName, ...otherData } = req.body;

    // Update user data in Firestore
    await updateUserData(user.uid, {
      displayName,
      ...otherData,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName,
        ...otherData
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};