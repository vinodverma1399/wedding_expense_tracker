const mongoose = require('mongoose');

const weddingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weddingName: { type: String, required: true },
  brideName: { type: String, required: true },
  groomName: { type: String, required: true },
  weddingDate: { type: Date, required: true },
  city: { type: String, required: true },
  totalBudget: { type: Number, required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['Admin', 'Editor', 'Viewer', 'Contributor'], default: 'Editor' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Wedding', weddingSchema);
