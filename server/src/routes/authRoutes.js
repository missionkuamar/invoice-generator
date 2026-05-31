import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import {
  register,
  login,
  createRazorpayOrder,
  verifyPayment,
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  verifyBackupCode,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Regular auth
router.post('/register', register);
router.post('/login', login);

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth routes working',
    googleClientId: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Not set',
    callbackUrl: 'http://localhost:5000/auth/google/callback'
  });
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Google OAuth callback - MUST match exactly with Google Console
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: 'http://localhost:5173/login',
    session: false 
  }),
  (req, res) => {
    console.log('✅ Google callback successful for user:', req.user?.email);
    
    if (!req.user) {
      console.error('❌ No user found in callback');
      return res.redirect('http://localhost:5173/login?error=no_user');
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('✅ Token generated for user:', req.user.email);
    
    // Redirect to frontend with token
    const redirectUrl = `http://localhost:5173/oauth-callback?token=${token}`;
    console.log('🔄 Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  }
);

// Get current user (for OAuth callback)
router.get('/me', protect, async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      subscription: req.user.subscription,
      shop: shop,
      twoFactorEnabled: req.user.twoFactorEnabled || false,
    });
  } catch (error) {
    console.error('Error in /me route:', error);
    res.status(500).json({ message: error.message });
  }
});

// 2FA Routes
router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/enable', protect, enableTwoFactor);
router.post('/2fa/disable', protect, disableTwoFactor);
router.post('/2fa/verify-backup', protect, verifyBackupCode);

// Payment routes
router.post('/create-razorpay-order', protect, createRazorpayOrder);
router.post('/verify-payment', protect, verifyPayment);

export default router;