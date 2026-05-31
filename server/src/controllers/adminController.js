import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Invoice from '../models/Invoice.js';

export const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    const usersWithShops = await Promise.all(
      users.map(async (user) => {
        const shop = await Shop.findOne({ owner: user._id });
        const invoiceCount = await Invoice.countDocuments({ shop: shop?._id });
        return { ...user.toObject(), shop, invoiceCount };
      })
    );
    
    res.json({
      users: usersWithShops,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot disable super admin' });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    res.json({ message: `User ${user.isActive ? 'enabled' : 'disabled'} successfully`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'Cannot delete super admin' });
    }
    
    const shop = await Shop.findOne({ owner: userId });
    if (shop) {
      await Invoice.deleteMany({ shop: shop._id });
      await Shop.deleteOne({ owner: userId });
    }
    await User.deleteOne({ _id: userId });
    
    res.json({ message: 'User and all associated data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'shop_owner' });
    const activeUsers = await User.countDocuments({ role: 'shop_owner', isActive: true });
    const totalInvoices = await Invoice.countDocuments();
    const totalRevenue = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$grandTotal' } } },
    ]);
    
    const recentInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('shop', 'shopName');
    
    res.json({
      totalUsers,
      activeUsers,
      totalInvoices,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentInvoices,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};