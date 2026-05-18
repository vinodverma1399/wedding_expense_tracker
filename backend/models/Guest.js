const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  weddingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wedding', required: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  side: { type: String, enum: ['Bride', 'Groom', 'Both'], default: 'Both' },
  rsvpStatus: { type: String, enum: ['Pending', 'Confirmed', 'Declined'], default: 'Pending' },
  numberOfPlates: { type: Number, default: 1 },
  events: [{ 
    type: String, 
    enum: ['Haldi', 'Mehendi', 'Sangeet', 'Wedding', 'Reception', 'Engagement', 'Other'] 
  }],
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Guest', guestSchema);
