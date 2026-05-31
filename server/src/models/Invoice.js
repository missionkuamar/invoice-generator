import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  customer: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    address: String,
    gstNumber: String,
  },
  items: [{
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, default: 0 },
    amount: { type: Number, required: true },
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  totalGst: {
    type: Number,
    required: true,
  },
  grandTotal: {
    type: Number,
    required: true,
  },
  notes: String,
  terms: String,
  status: {
    type: String,
    enum: ['draft', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  dueDate: Date,
  issueDate: {
    type: Date,
    default: Date.now,
  },
  paymentDetails: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paidAt: Date,
  },
  invoiceImage: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

invoiceSchema.index({ invoiceNumber: 1, 'customer.name': 1, status: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;