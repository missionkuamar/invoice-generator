import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import razorpayInstance from '../config/razorpay.js';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const user = await User.create({ 
      name, 
      email, 
      password,
      isEmailVerified: false,
    });
    
    const shop = await Shop.create({
      owner: user._id,
      shopName: shopName || `${name}'s Shop`,
      email: email,
    });
    
    // Send verification email (implement this)
    // await sendVerificationEmail(email, user._id);
    
    const token = generateToken(user._id);
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      shop: shop,
      token,
      requiresTwoFactor: false,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;
    
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account disabled. Contact admin.' });
    }
    
    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({ 
          requiresTwoFactor: true, 
          userId: user._id,
          message: '2FA code required' 
        });
      }
      
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorCode,
      });
      
      if (!verified) {
        return res.status(401).json({ message: 'Invalid 2FA code' });
      }
    }
    
    const shop = await Shop.findOne({ owner: user._id });
    const token = generateToken(user._id);
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      subscription: user.subscription,
      shop: shop,
      token,
      twoFactorEnabled: user.twoFactorEnabled,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Google OAuth callbacks
export const googleAuth = (req, res) => {
  // This is handled by Passport routes
};

export const googleAuthCallback = (req, res) => {
  const token = generateToken(req.user._id);
  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
};

// 2FA Setup
export const setupTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }
    
    const secret = speakeasy.generateSecret({
      name: `InvoiceGen:${user.email}`,
    });
    
    user.twoFactorSecret = secret.base32;
    await user.save();
    
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      otpauthUrl: secret.otpauth_url,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify and enable 2FA
export const enableTwoFactor = async (req, res) => {
  try {
    const { twoFactorCode } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: '2FA not set up' });
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }
    
    // Generate backup codes
    const backupCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      backupCodes.push({ code, used: false });
    }
    
    user.twoFactorEnabled = true;
    user.backupCodes = backupCodes;
    await user.save();
    
    res.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes: backupCodes.map(b => b.code),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Disable 2FA
export const disableTwoFactor = async (req, res) => {
  try {
    const { twoFactorCode } = req.body;
    const user = await User.findById(req.user._id);
    
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: twoFactorCode,
    });
    
    if (!verified) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }
    
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.backupCodes = [];
    await user.save();
    
    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify backup code
export const verifyBackupCode = async (req, res) => {
  try {
    const { backupCode } = req.body;
    const user = await User.findById(req.user._id);
    
    const backupCodeDoc = user.backupCodes.find(
      b => b.code === backupCode && !b.used
    );
    
    if (!backupCodeDoc) {
      return res.status(400).json({ message: 'Invalid or used backup code' });
    }
    
    backupCodeDoc.used = true;
    await user.save();
    
    res.json({ success: true, message: 'Backup code verified' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resend verification email
export const resendVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }
    
    // await sendVerificationEmail(user.email, user._id);
    res.json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify email
export const verifyEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isEmailVerified = true;
    await user.save();
    
    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, plan } = req.body;
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `subscription_${req.user._id}`,
      notes: {
        userId: req.user._id.toString(),
        plan: plan,
      },
    };
    const order = await razorpayInstance.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
    
    const crypto = await import('crypto');
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');
    
    if (expectedSignature === razorpay_signature) {
      const user = await User.findById(req.user._id);
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      
      user.subscription = {
        plan: plan,
        expiryDate: expiryDate,
        razorpaySubscriptionId: razorpay_payment_id,
      };
      await user.save();
      
      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};