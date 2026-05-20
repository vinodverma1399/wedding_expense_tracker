const express = require('express');
const router = express.Router();
const { createWedding, getWeddings, getWeddingById, deleteWedding, inviteMember, updateWedding, removeMember } = require('../controllers/weddingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createWedding);
router.get('/all', protect, getWeddings);
router.get('/:id', protect, getWeddingById);
router.delete('/delete/:id', protect, deleteWedding);
router.post('/invite/:id', protect, inviteMember);
router.put('/update/:id', protect, updateWedding);
router.post('/remove-member/:id', protect, removeMember);


module.exports = router;
