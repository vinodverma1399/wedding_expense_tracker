const express = require('express');
const router = express.Router();
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:weddingId', protect, getEvents);
router.post('/create', protect, createEvent);
router.put('/update/:id', protect, updateEvent);
router.delete('/delete/:id', protect, deleteEvent);

module.exports = router;
