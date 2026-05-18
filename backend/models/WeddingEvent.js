const mongoose = require('mongoose');

const weddingEventSchema = new mongoose.Schema({
  weddingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  name: { 
    type: String, 
    enum: ['Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception', 'Engagement', 'Other'], 
    required: true 
  },
  date: { type: Date },
  budget: { type: Number, default: 0 },
  venue: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('WeddingEvent', weddingEventSchema);
