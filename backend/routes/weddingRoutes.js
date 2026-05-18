const express = require('express');
const router = express.Router();
const { createWedding, getWeddings, getWeddingById, deleteWedding, inviteMember } = require('../controllers/weddingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createWedding);
router.get('/all', protect, getWeddings);
router.get('/:id', protect, getWeddingById);
router.delete('/delete/:id', protect, deleteWedding);
router.post('/invite/:id', protect, inviteMember);

module.exports = router;
