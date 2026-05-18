const express = require('express');
const router = express.Router();
const { addExpense, getExpenses, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', protect, addExpense);
router.get('/:weddingId', protect, getExpenses);
router.put('/update/:id', protect, updateExpense);
router.delete('/delete/:id', protect, deleteExpense);

module.exports = router;
