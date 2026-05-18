const Expense = require('../models/Expense');
const Wedding = require('../models/Wedding');
const Vendor = require('../models/Vendor');



const addExpense = async (req, res) => {
  try {
    const { weddingId, category, amount, vendor, vendorId, note, paymentStatus, paymentMethod, expenseDate, billUrl, paidBy, paidAmount } = req.body;
    
    // Optional: check if wedding belongs to user or if user is a member
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    const isOwner = wedding.userId.toString() === req.user._id.toString();
    const isMember = wedding.members && wedding.members.some(m => m.user.toString() === req.user._id.toString() && ['Admin', 'Editor', 'Contributor'].includes(m.role));

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Unauthorized to add expenses' });
    }

    let parsedPaidAmount = Number(paidAmount) || 0;
    if (paymentStatus === 'Paid') {
      parsedPaidAmount = Number(amount);
    } else if (paymentStatus === 'Pending') {
      parsedPaidAmount = 0;
    }
    const remainingAmount = Number(amount) - parsedPaidAmount;

    const paymentHistory = [];
    if (parsedPaidAmount > 0) {
      paymentHistory.push({
        amountPaid: parsedPaidAmount,
        paymentMethod: paymentMethod || 'Other',
        paidAt: new Date()
      });
    }

    const expense = await Expense.create({
      weddingId, category, amount, vendor, note, paymentStatus, paymentMethod, expenseDate, billUrl, paidBy: paidBy || 'Self', addedBy: req.user._id, paidAmount: parsedPaidAmount, remainingAmount, paymentHistory
    });
    
    const populatedExpense = await Expense.findById(expense._id).populate('addedBy', 'name').populate('vendorId');
    
    // Real-time broadcast to all wedding members
    const io = req.app.get('io');
    if (io) io.to(weddingId).emit('expenseAdded', populatedExpense);

    // Compute new total spent for budget exceed alarms
    const allExpenses = await Expense.find({ weddingId });
    const totalSpent = allExpenses.reduce((sum, item) => sum + item.amount, 0);
    const budgetUsageRatio = totalSpent / wedding.totalBudget;

    if (budgetUsageRatio >= 0.8) {
      // Find wedding owner to notify
      const User = require('../models/User');
      const owner = await User.findById(wedding.userId);
      if (owner) {
        const sendEmail = require('../utils/sendEmail');
        const isCritical = budgetUsageRatio >= 1.0;
        const alarmSubject = isCritical 
          ? `🚨 CRITICAL: Budget Exceeded for ${wedding.weddingName}`
          : `⚠️ WARNING: Wedding Budget at ${(budgetUsageRatio * 100).toFixed(0)}% for ${wedding.weddingName}`;
          
        await sendEmail({
          to: owner.email,
          subject: alarmSubject,
          html: `
            <div style="font-family: Arial, sans-serif; padding: 30px; max-width: 600px; border: 2px solid ${isCritical ? '#ef4444' : '#f59e0b'}; border-radius: 16px; background-color: #ffffff; color: #1a202c; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 40px;">${isCritical ? '🚨' : '⚠️'}</span>
                <h1 style="color: ${isCritical ? '#ef4444' : '#d97706'}; font-size: 24px; font-weight: 800; margin: 10px 0 0 0;">
                  ${isCritical ? 'Critical: Budget Exceeded!' : 'Budget Warning Alert!'}
                </h1>
              </div>
              <p style="font-size: 16px; line-height: 1.5;">Dear <strong>${owner.name}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.5; color: #4a5568;">
                This is an automated safety alert regarding your wedding: <strong style="color: #6d28d9;">${wedding.weddingName}</strong>.
              </p>
              <div style="background-color: ${isCritical ? '#fef2f2' : '#fef3c7'}; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid ${isCritical ? '#fecaca' : '#fde68a'};">
                <table style="width: 100%; font-size: 15px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #718096;">Total Allowed Budget:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: bold;">₹${wedding.totalBudget.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #718096;">Current Cumulative Spend:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: bold; color: ${isCritical ? '#ef4444' : '#b45309'};">₹${totalSpent.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #718096;">Latest Expense:</td>
                    <td style="padding: 6px 0; text-align: right; font-weight: bold;">${category} (₹${amount.toLocaleString()})</td>
                  </tr>
                  <tr style="border-top: 1px solid ${isCritical ? '#fca5a5' : '#fcd34d'};">
                    <td style="padding: 8px 0 0 0; font-weight: bold; color: #1a202c;">Remaining Balance:</td>
                    <td style="padding: 8px 0 0 0; text-align: right; font-weight: bold; color: ${wedding.totalBudget - totalSpent < 0 ? '#ef4444' : '#10b981'};">
                      ₹${(wedding.totalBudget - totalSpent).toLocaleString()}
                    </td>
                  </tr>
                </table>
              </div>
              <p style="font-size: 15px; line-height: 1.5; color: #4a5568; margin-bottom: 24px;">
                Please review your logged expenses, optimize upcoming vendor assignments, or expand the allocated budget in your settings to ensure smooth preparations.
              </p>
              <div style="text-align: center; margin-bottom: 20px;">
                <a href="http://localhost:5173" style="display: inline-block; padding: 12px 24px; color: #ffffff; background-color: #6d28d9; font-weight: bold; border-radius: 10px; text-decoration: none; font-size: 15px;">Manage Wedding Budget</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #edf2f7; margin-bottom: 20px;" />
              <p style="font-size: 11px; color: #a0aec0; text-align: center; margin: 0;">This is an automated safety alert from Wedding Expense Tracker SaaS.</p>
            </div>
          `
        });
      }
    }
    
    res.status(201).json(populatedExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExpenses = async (req, res) => {
  try {
    const { weddingId } = req.params;
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) return res.status(404).json({ message: 'Wedding not found' });
    
    let expensesQuery = { weddingId };

    const isOwner = wedding.userId.toString() === req.user._id.toString();
    const currentMember = wedding.members && wedding.members.find(m => m.user.toString() === req.user._id.toString());
    
    // Contributors can strictly only see expenses they added
    if (!isOwner && currentMember && currentMember.role === 'Contributor') {
      expensesQuery.addedBy = req.user._id;
    }

    const expenses = await Expense.find(expensesQuery)
                                  .populate('addedBy', 'name')
                                  .populate('vendorId')
                                  .sort({ expenseDate: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    
    const { amount, paymentStatus, paidAmount, vendorId } = req.body;
    let parsedPaidAmount = Number(paidAmount) || 0;
    if (paymentStatus === 'Paid') {
      parsedPaidAmount = Number(amount);
    } else if (paymentStatus === 'Pending') {
      parsedPaidAmount = 0;
    } else if (paymentStatus === 'Partial' && paidAmount === undefined) {
      // Keep existing paidAmount if not provided but it's partial
      parsedPaidAmount = expense.paidAmount;
    }
    const remainingAmount = Number(amount) - parsedPaidAmount;
    const deltaPaid = parsedPaidAmount - (expense.paidAmount || 0);

    Object.assign(expense, req.body, { paidAmount: parsedPaidAmount, remainingAmount });
    const updatedExpense = await expense.save();

    // If the expense has a vendor name, find and update the registered Vendor's advancePaid/remainingAmount
    if (expense.vendor && expense.vendor.trim()) {
      const allVendors = await Vendor.find({ weddingId: expense.weddingId });
      const vendorDoc = allVendors.find(v => v.vendorName.toLowerCase().trim() === expense.vendor.toLowerCase().trim());
      if (vendorDoc) {
        vendorDoc.advancePaid = (vendorDoc.advancePaid || 0) + deltaPaid;
        vendorDoc.remainingAmount = vendorDoc.totalAmount - vendorDoc.advancePaid;
        await vendorDoc.save();
      }
    }
    
    const populated = await Expense.findById(updatedExpense._id).populate('addedBy', 'name').populate('vendorId');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    
    await Expense.deleteOne({ _id: expense._id });
    
    // If the expense has a vendor and paid amount, update the registered Vendor's advancePaid/remainingAmount
    if (expense.vendor && expense.vendor.trim() && expense.paidAmount > 0) {
      const allVendors = await Vendor.find({ weddingId: expense.weddingId });
      const vendorDoc = allVendors.find(v => v.vendorName.toLowerCase().trim() === expense.vendor.toLowerCase().trim());
      if (vendorDoc) {
        vendorDoc.advancePaid = Math.max(0, (vendorDoc.advancePaid || 0) - expense.paidAmount);
        vendorDoc.remainingAmount = vendorDoc.totalAmount - vendorDoc.advancePaid;
        await vendorDoc.save();
      }
    }
    
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addExpense, getExpenses, updateExpense, deleteExpense };
