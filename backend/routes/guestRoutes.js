const express = require('express');
const router = express.Router();
const { getGuests, addGuest, updateGuest, deleteGuest } = require('../controllers/guestController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:weddingId', protect, getGuests);
router.post('/add', protect, addGuest);
router.put('/update/:id', protect, updateGuest);
router.delete('/delete/:id', protect, deleteGuest);

module.exports = router;
