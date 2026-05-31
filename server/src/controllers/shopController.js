import Shop from '../models/Shop.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shop_logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'limit' }]
  }
});

export const uploadLogo = multer({ 
  storage, 
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

export const getShopProfile = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id }).populate('owner', 'name email');
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateShopProfile = async (req, res) => {
  try {
    const { section, data } = req.body;
    
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Update specific section
    if (section === 'basic') {
      shop.shopName = data.shopName;
      shop.phone = data.phone;
      shop.email = data.email;
      shop.gstNumber = data.gstNumber;
      shop.invoicePrefix = data.invoicePrefix;
      shop.footerNote = data.footerNote;
    } else if (section === 'address') {
      shop.address = {
        street: data.street,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      };
    } else if (section === 'bank') {
      shop.bankDetails = {
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
      };
    } else {
      // Full update
      Object.assign(shop, req.body);
    }
    
    await shop.save();
    res.json({ message: 'Shop updated successfully', shop });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadShopLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const shop = await Shop.findOneAndUpdate(
      { owner: req.user._id },
      { shopLogo: req.file.path },
      { new: true }
    );
    
    res.json({ 
      message: 'Logo uploaded successfully', 
      logoUrl: req.file.path,
      shop 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteShopLogo = async (req, res) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: 'Shop not found' });
    }
    
    // Delete from Cloudinary if exists
    if (shop.shopLogo) {
      const publicId = shop.shopLogo.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`shop_logos/${publicId}`);
    }
    
    shop.shopLogo = '';
    await shop.save();
    
    res.json({ message: 'Logo deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};