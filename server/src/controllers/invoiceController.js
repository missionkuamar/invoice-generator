import Invoice from '../models/Invoice.js';
import Shop from '../models/Shop.js';
import { generateInvoiceNumber } from '../utils/generateInvoiceNumber.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import User from '../models/User.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';



// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const dir = 'uploads/invoices/';
//     if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//     cb(null, dir);
//   },
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   },
// });

// export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// export const createInvoice = async (req, res) => {
//   try {
//     const shop = await Shop.findOne({ owner: req.user._id });
//     if (!shop) {
//       return res.status(404).json({ message: 'Shop not found' });
//     }
    
//     const { customer, items, notes, terms, dueDate, invoiceImage, status } = req.body;
    
//     let subtotal = 0;
//     let totalGst = 0;
    
//     const processedItems = items.map(item => {
//       const amount = item.quantity * item.unitPrice;
//       const gstAmount = (amount * item.gstRate) / 100;
//       subtotal += amount;
//       totalGst += gstAmount;
//       return {
//         ...item,
//         amount: amount + gstAmount,
//       };
//     });
    
//     const grandTotal = subtotal + totalGst;
    
//     const invoiceNumber = await generateInvoiceNumber(shop._id);
    
//     const invoice = await Invoice.create({
//       invoiceNumber,
//       shop: shop._id,
//       customer,
//       items: processedItems,
//       subtotal,
//       totalGst,
//       grandTotal,
//       notes,
//       terms,
//       dueDate,
//       status: status || 'draft',
//       invoiceImage: req.file ? `/uploads/invoices/${req.file.filename}` : (invoiceImage || ''),
//     });
    
//     res.status(201).json(invoice);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

export const getInvoices = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const status = req.query.status || '';
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    let query = { shop: shop._id };
    
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate && endDate) {
      query.issueDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    res.json({
      invoices,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    const invoice = await Invoice.findOne({ _id: req.params.id, shop: shop._id });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, shop: shop._id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, shop: shop._id });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRandomInvoice = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    const count = await Invoice.countDocuments({ shop: shop._id });
    const random = Math.floor(Math.random() * count);
    const invoice = await Invoice.findOne({ shop: shop._id }).skip(random);
    
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



















// Configure Cloudinary storage for invoices
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'invoice_images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
  }
});

export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Calculate GST based on item type
const calculateGST = (amount, gstRate, isIGST = false) => {
  const gstAmount = (amount * gstRate) / 100;
  if (isIGST) {
    return { igst: gstAmount, cgst: 0, sgst: 0 };
  } else {
    return { cgst: gstAmount / 2, sgst: gstAmount / 2, igst: 0 };
  }
};

export const createInvoice = async (req, res) => {
  try {
    // Check subscription limits
    const user = await User.findById(req.user._id);
    if (!user.canCreateInvoice()) {
      return res.status(403).json({ 
        message: 'Invoice limit reached. Please upgrade your subscription plan.',
        remaining: 0,
        limit: SUBSCRIPTION_PLANS[user.subscription.plan].invoiceLimit
      });
    }
    
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    const { 
      customer, 
      items, 
      notes, 
      terms, 
      dueDate, 
      status,
      discountType,
      discountValue,
      shippingCharge,
      taxType 
    } = req.body;
    
    let subtotal = 0;
    let totalGst = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    
    const processedItems = items.map(item => {
      const amount = item.quantity * item.unitPrice;
      const gstCalculation = calculateGST(amount, item.gstRate || 0, taxType === 'IGST');
      
      subtotal += amount;
      totalGst += gstCalculation.cgst + gstCalculation.sgst + gstCalculation.igst;
      totalCgst += gstCalculation.cgst;
      totalSgst += gstCalculation.sgst;
      totalIgst += gstCalculation.igst;
      
      return {
        ...item,
        amount: amount,
        gstAmount: gstCalculation.cgst + gstCalculation.sgst + gstCalculation.igst,
        cgst: gstCalculation.cgst,
        sgst: gstCalculation.sgst,
        igst: gstCalculation.igst,
      };
    });
    
    // Apply discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
      discountAmount = discountValue || 0;
    }
    
    const taxableAmount = subtotal - discountAmount;
    const grandTotal = taxableAmount + totalGst + (shippingCharge || 0);
    
    const invoiceNumber = await generateInvoiceNumber(shop._id);
    
    const invoice = await Invoice.create({
      invoiceNumber,
      shop: shop._id,
      customer,
      items: processedItems,
      subtotal,
      discount: {
        type: discountType,
        value: discountValue,
        amount: discountAmount,
      },
      shippingCharge: shippingCharge || 0,
      totalGst,
      totalCgst,
      totalSgst,
      totalIgst,
      grandTotal,
      notes,
      terms,
      dueDate,
      status: status || 'draft',
      invoiceImage: req.file ? req.file.path : null,
      taxType: taxType || 'CGST/SGST',
    });
    
    // Update invoice count
    user.subscription.invoicesUsed += 1;
    await user.save();
    
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getInvoiceStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const shop = await Shop.findOne({ owner: req.user._id });
    
    const totalInvoices = await Invoice.countDocuments({ shop: shop._id });
    const paidInvoices = await Invoice.countDocuments({ shop: shop._id, status: 'paid' });
    const totalRevenue = await Invoice.aggregate([
      { $match: { shop: shop._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    
    res.json({
      subscription: {
        plan: user.subscription.plan,
        planName: SUBSCRIPTION_PLANS[user.subscription.plan].name,
        invoicesUsed: user.subscription.invoicesUsed,
        invoiceLimit: SUBSCRIPTION_PLANS[user.subscription.plan].invoiceLimit,
        remainingInvoices: user.getRemainingInvoices(),
        expiryDate: user.subscription.expiryDate,
      },
      stats: {
        totalInvoices,
        paidInvoices,
        totalRevenue: totalRevenue[0]?.total || 0,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ... rest of the existing controller functions (getInvoices, getInvoiceById, etc.)