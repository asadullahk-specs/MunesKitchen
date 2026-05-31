const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
// Add getExpenseCategories to the imported functions below:
const {
    getExpenses,
    createExpense,
    deleteExpense,
    getExpenseCategories,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory
} = require('../controllers/expenseController')

// Expense Category CRUD routes
router.get('/categories', protect, getExpenseCategories)
router.post('/categories', protect, createExpenseCategory)
router.put('/categories/:id', protect, updateExpenseCategory)
router.delete('/categories/:id', protect, deleteExpenseCategory)

router.get('/', protect, getExpenses)
router.post('/', protect, createExpense)
router.delete('/:id', protect, deleteExpense)

module.exports = router