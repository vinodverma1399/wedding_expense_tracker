const express = require('express');
const router = express.Router();
const { addVendor, getVendors, updateVendor, deleteVendor, payVendor } = require('../controllers/vendorController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addVendor);
router.get('/:weddingId', protect, getVendors);
router.put('/update/:id', protect, updateVendor);
router.delete('/delete/:id', protect, deleteVendor);
router.post('/pay/:id', protect, payVendor);

module.exports = router;
