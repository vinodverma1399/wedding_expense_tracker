const Vendor = require('../models/Vendor');
const Wedding = require('../models/Wedding');
const Expense = require('../models/Expense');

const addVendor = async (req, res) => {
  try {
    const { weddingId, vendorName, serviceType, totalAmount, advancePaid, contactNumber, occasionDate } = req.body;
    
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    const isOwner = wedding.userId.toString() === req.user._id.toString();
    const isMember = wedding.members && wedding.members.some(m => m.user.toString() === req.user._id.toString() && ['Admin', 'Editor', 'Contributor'].includes(m.role));

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Unauthorized to add vendors' });
    }

    const remainingAmount = totalAmount - (advancePaid || 0);

    const vendor = await Vendor.create({
      weddingId, vendorName, serviceType, totalAmount, advancePaid: advancePaid || 0, remainingAmount, contactNumber, occasionDate, addedBy: req.user._id
    });
    
    const populatedVendor = await Vendor.findById(vendor._id).populate('addedBy', 'name');
    res.status(201).json(populatedVendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVendors = async (req, res) => {
  try {
    const { weddingId } = req.params;
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) return res.status(404).json({ message: 'Wedding not found' });

    let query = { weddingId };
    const isOwner = wedding.userId.toString() === req.user._id.toString();
    const currentMember = wedding.members && wedding.members.find(m => m.user.toString() === req.user._id.toString());
    
    // Contributors can strictly only see vendors they added
    if (!isOwner && currentMember && currentMember.role === 'Contributor') {
      query.addedBy = req.user._id;
    }

    const vendors = await Vendor.find(query).populate('addedBy', 'name').sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVendor = async (req, res) => {
  try {
    const { vendorName, serviceType, totalAmount, advancePaid, contactNumber, occasionDate } = req.body;
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    const wedding = await Wedding.findById(vendor.weddingId);
    const isOwner = wedding.userId.toString() === req.user._id.toString();
    const currentMember = wedding.members && wedding.members.find(m => m.user.toString() === req.user._id.toString());
    
    if (!isOwner && (!currentMember || (currentMember.role === 'Contributor' && vendor.addedBy?.toString() !== req.user._id.toString()))) {
      return res.status(403).json({ message: 'Unauthorized to edit this vendor' });
    }

    const remainingAmount = totalAmount - (advancePaid || 0);
    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.params.id, 
      { vendorName, serviceType, totalAmount, advancePaid, remainingAmount, contactNumber, occasionDate }, 
      { new: true }
    ).populate('addedBy', 'name');
    res.json(updatedVendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    const wedding = await Wedding.findById(vendor.weddingId);
    const isOwner = wedding.userId.toString() === req.user._id.toString();
    const currentMember = wedding.members && wedding.members.find(m => m.user.toString() === req.user._id.toString());

    if (!isOwner && (!currentMember || (currentMember.role === 'Contributor' && vendor.addedBy?.toString() !== req.user._id.toString()))) {
      return res.status(403).json({ message: 'Unauthorized to delete this vendor' });
    }



    await Vendor.deleteOne({ _id: vendor._id });
    res.json({ message: 'Vendor removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const payVendor = async (req, res) => {
  try {
    const { payAmount, paymentMethod } = req.body;
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });

    const wedding = await Wedding.findById(vendor.weddingId);
    const isOwner = wedding.userId.toString() === req.user._id.toString();
    const currentMember = wedding.members && wedding.members.find(m => m.user.toString() === req.user._id.toString());

    if (!isOwner && (!currentMember || !['Admin', 'Editor', 'Contributor'].includes(currentMember.role))) {
      return res.status(403).json({ message: 'Unauthorized to pay this vendor' });
    }

    const amountNum = Number(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ message: 'Please enter a valid payment amount' });
    }

    // Increment advancePaid and recalculate remainingAmount
    vendor.advancePaid = (vendor.advancePaid || 0) + amountNum;
    vendor.remainingAmount = vendor.totalAmount - vendor.advancePaid;
    await vendor.save();

    // Automatically create a matching expense entry in the database
    await Expense.create({
      weddingId: vendor.weddingId,
      category: vendor.serviceType || 'Other',
      amount: amountNum,
      vendor: vendor.vendorName,
      paymentStatus: 'Paid',
      paidAmount: amountNum,
      paymentMethod: paymentMethod || 'UPI',
      expenseDate: new Date(),
      note: `Installment paid directly from Vendor Directory`,
      paidBy: req.user?.name || 'Self',
      addedBy: req.user?._id,
      paymentHistory: [{
        amountPaid: amountNum,
        paymentMethod: paymentMethod || 'UPI',
        paidAt: new Date()
      }]
    });

    const populatedVendor = await Vendor.findById(vendor._id).populate('addedBy', 'name');
    res.json(populatedVendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addVendor, getVendors, updateVendor, deleteVendor, payVendor };
