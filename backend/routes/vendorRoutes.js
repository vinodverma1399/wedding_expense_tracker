const express = require('express');
const router = express.Router();
const { addVendor, getVendors, deleteVendor } = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addVendor);
router.get('/:weddingId', protect, getVendors);
router.delete('/delete/:id', protect, deleteVendor);

module.exports = router;
