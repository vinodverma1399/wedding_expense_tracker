const WeddingEvent = require('../models/WeddingEvent');

const getEvents = async (req, res) => {
  try {
    const events = await WeddingEvent.find({ weddingId: req.params.weddingId }).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { weddingId, name, date, budget, venue, notes } = req.body;
    const event = await WeddingEvent.create({ weddingId, name, date, budget, venue, notes });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await WeddingEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    Object.assign(event, req.body);
    const updated = await event.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    await WeddingEvent.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
