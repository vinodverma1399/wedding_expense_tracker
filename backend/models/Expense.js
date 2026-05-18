const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  weddingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  category: { 
    type: String, 
    enum: ['Venue', 'Catering', 'Decoration', 'Photography', 'Jewellery', 'Travel', 'DJ', 'Makeup', 'Clothes', 'Gifts', 'Hotel', 'Other'],
    required: true 
  },
  amount: { type: Number, required: true },
  vendor: { type: String },
  note: { type: String },
  paymentStatus: { type: String, enum: ['Paid', 'Pending', 'Partial'], required: true },
  paymentMethod: { type: String, enum: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'], required: true },
  expenseDate: { type: Date, required: true },
  billUrl: { type: String, default: '' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
