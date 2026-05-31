import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  googleId: {
    type: String,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['shop_owner', 'super_admin'],
    default: 'shop_owner',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: {
    type: String,
    default: null,
  },
  backupCodes: [{
    code: String,
    used: { type: Boolean, default: false },
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'business', 'enterprise'],
      default: 'free',
    },
    planName: String,
    invoiceLimit: {
      type: Number,
      default: 50,
    },
    invoicesUsed: {
      type: Number,
      default: 0,
    },
    expiryDate: Date,
    razorpaySubscriptionId: String,
    amount: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Plan configurations
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    invoiceLimit: 50,
    features: ['50 invoices/month', 'Basic support', 'GST included', 'PDF download']
  },
  basic: {
    name: 'Basic',
    price: 150,
    invoiceLimit: 200,
    features: ['200 invoices/month', 'Email support', 'GST included', 'PDF download', 'Logo upload']
  },
  premium: {
    name: 'Premium',
    price: 300,
    invoiceLimit: 400,
    features: ['400 invoices/month', 'Priority support', 'GST included', 'PDF download', 'Logo upload', 'Analytics']
  },
  business: {
    name: 'Business',
    price: 500,
    invoiceLimit: 700,
    features: ['700 invoices/month', '24/7 support', 'GST included', 'PDF download', 'Logo upload', 'Analytics', 'API access']
  },
  enterprise: {
    name: 'Enterprise',
    price: 800,
    invoiceLimit: 1200,
    features: ['1200 invoices/month', 'Dedicated support', 'GST included', 'PDF download', 'Logo upload', 'Analytics', 'API access', 'Custom branding']
  },
  pro_max: {
    name: 'Pro Max',
    price: 1000,
    invoiceLimit: 1500,
    features: ['1500 invoices/month', 'Premium support', 'GST included', 'All features']
  },
  ultimate: {
    name: 'Ultimate',
    price: 1500,
    invoiceLimit: 2300,
    features: ['2300 invoices/month', 'VIP support', 'All premium features']
  },
  platinum: {
    name: 'Platinum',
    price: 2000,
    invoiceLimit: 3000,
    features: ['3000 invoices/month', 'White glove support', 'Everything included']
  }
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.canCreateInvoice = function () {
  const plan = SUBSCRIPTION_PLANS[this.subscription.plan];
  if (!plan) return false;
  return this.subscription.invoicesUsed < plan.invoiceLimit;
};

userSchema.methods.getRemainingInvoices = function () {
  const plan = SUBSCRIPTION_PLANS[this.subscription.plan];
  if (!plan) return 0;
  return Math.max(0, plan.invoiceLimit - this.subscription.invoicesUsed);
};

const User = mongoose.model('User', userSchema);
export default User;