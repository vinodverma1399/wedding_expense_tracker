const Guest = require('../models/Guest');

const getGuests = async (req, res) => {
  try {
    const guests = await Guest.find({ weddingId: req.params.weddingId }).sort({ name: 1 });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addGuest = async (req, res) => {
  try {
    const guest = await Guest.create(req.body);
    res.status(201).json(guest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateGuest = async (req, res) => {
  try {
    const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!guest) return res.status(404).json({ message: 'Guest not found' });
    res.json(guest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteGuest = async (req, res) => {
  try {
    await Guest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Guest deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getGuests, addGuest, updateGuest, deleteGuest };
