const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  weddingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  vendorName: { type: String, required: true },
  serviceType: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  advancePaid: { type: Number, required: true, default: 0 },
  remainingAmount: { type: Number, required: true },
  contactNumber: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
