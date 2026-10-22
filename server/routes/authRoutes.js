import express from 'express';
import {
  register,
  login,
  getMe,
  getAllUsers,
  updateUserByAdmin,
  updateProfile,
  getAdminHint,
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/admin-hint', getAdminHint);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Admin user management
router.get('/users', protect, authorize('admin'), getAllUsers);
router.put('/users/:id', protect, authorize('admin'), updateUserByAdmin);

export default router;
