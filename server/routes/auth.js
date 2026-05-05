import { Router } from 'express';
import { forgotPassword, login, logout, me, register, resetPassword, verifyEmail, updateProfile, uploadAvatar } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.patch('/profile', requireAuth, updateProfile);
router.post('/upload-avatar', requireAuth, uploadAvatar);

export default router;
