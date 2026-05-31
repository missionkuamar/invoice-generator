import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import User, { SUBSCRIPTION_PLANS } from '../models/User.js';
import razorpayInstance from '../config/razorpay.js';

const router = express.Router();

// Get all subscription plans
router.get('/plans', (req, res) => {
  res.json(SUBSCRIPTION_PLANS);
});

// Get current subscription
router.get('/current', protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    plan: user.subscription.plan,
    planDetails: SUBSCRIPTION_PLANS[user.subscription.plan],
    invoicesUsed: user.subscription.invoicesUsed,
    remainingInvoices: user.getRemainingInvoices(),
    expiryDate: user.subscription.expiryDate,
  });
});

// Create subscription order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    const planDetails = SUBSCRIPTION_PLANS[plan];
    
    if (!planDetails) {
      return res.status(400).json({ message: 'Invalid plan' });
    }
    
    const options = {
      amount: planDetails.price * 100,
      currency: 'INR',
      receipt: `subscription_${req.user._id}_${Date.now()}`,
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
});

// Verify subscription payment
router.post('/verify', protect, async (req, res) => {
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
        planName: SUBSCRIPTION_PLANS[plan].name,
        invoiceLimit: SUBSCRIPTION_PLANS[plan].invoiceLimit,
        invoicesUsed: 0,
        expiryDate: expiryDate,
        razorpaySubscriptionId: razorpay_payment_id,
        amount: SUBSCRIPTION_PLANS[plan].price,
      };
      await user.save();
      
      res.json({ success: true, message: 'Subscription activated successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;