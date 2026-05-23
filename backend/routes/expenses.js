const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
// Add getExpenseCategories to the imported functions below:
const { getExpenses, createExpense, deleteExpense, getExpenseCategories } = require('../controllers/expenseController')

// 1. Add this line right here for the categories endpoint!
router.get('/categories', protect, getExpenseCategories)

router.get('/', protect, getExpenses)
router.post('/', protect, createExpense)
router.delete('/:id', protect, deleteExpense)

module.exports = router