const Vendor = require('../models/Vendor');
const Wedding = require('../models/Wedding');

const addVendor = async (req, res) => {
  try {
    const { weddingId, vendorName, serviceType, totalAmount, advancePaid, contactNumber } = req.body;
    
    const wedding = await Wedding.findById(weddingId);
    if (!wedding) {
      return res.status(404).json({ message: 'Wedding not found' });
    }

    const isOwner = wedding.userId.toString() === req.user._id.toString();
    const isMember = wedding.members && wedding.members.some(m => m.user.toString() === req.user._id.toString() && ['Admin', 'Editor'].includes(m.role));

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Unauthorized to add vendors' });
    }

    const remainingAmount = totalAmount - (advancePaid || 0);

    const vendor = await Vendor.create({
      weddingId, vendorName, serviceType, totalAmount, advancePaid, remainingAmount, contactNumber
    });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVendors = async (req, res) => {
  try {
    const { weddingId } = req.params;
    const vendors = await Vendor.find({ weddingId });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    
    await Vendor.deleteOne({ _id: vendor._id });
    res.json({ message: 'Vendor removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addVendor, getVendors, deleteVendor };
