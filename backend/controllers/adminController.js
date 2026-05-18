const User = require('../models/User');
const Wedding = require('../models/Wedding');
const Expense = require('../models/Expense');
const Vendor = require('../models/Vendor');
const Guest = require('../models/Guest');

// Only accessible by admin users
const getAdminStats = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Admin access only' });
    }

    const [totalUsers, totalWeddings, totalExpenses, totalVendors, totalGuests] = await Promise.all([
      User.countDocuments(),
      Wedding.countDocuments(),
      Expense.countDocuments(),
      Vendor.countDocuments(),
      Guest.countDocuments(),
    ]);

    const expenseAgg = await Expense.aggregate([
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } }
    ]);
    const totalAmount = expenseAgg[0]?.totalAmount || 0;

    res.json({ totalUsers, totalWeddings, totalExpenses, totalVendors, totalGuests, totalAmount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access only' });
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllWeddings = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access only' });
    const weddings = await Wedding.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    res.json(weddings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const makeAdmin = async (req, res) => {
  try {
    if (!req.user.isAdmin) return res.status(403).json({ message: 'Admin access only' });
    const user = await User.findByIdAndUpdate(req.params.id, { isAdmin: true }, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAdminStats, getAllUsers, getAllWeddings, makeAdmin };
