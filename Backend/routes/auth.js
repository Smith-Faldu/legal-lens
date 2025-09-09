import express from 'express';
import { 
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshToken,
  getCurrentUser,
  updateUserProfile 
} from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/refresh', refreshToken);

// Protected routes
router.use(authMiddleware);
router.get('/me', getCurrentUser);
router.put('/profile', updateUserProfile);
router.post('/logout', logoutUser);

export default router;