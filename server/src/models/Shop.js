import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  shopName: {
    type: String,
    required: true,
  },
  shopLogo: {
    type: String,
    default: '',
  },
  gstNumber: {
    type: String,
    default: '',
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  phone: String,
  email: String,
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    bankName: String,
  },
  invoicePrefix: {
    type: String,
    default: 'INV',
  },
  footerNote: {
    type: String,
    default: 'Thank you for your business!',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Shop = mongoose.model('Shop', shopSchema);
export default Shop;