const express = require('express');
const router = express.Router();
const { getAll, create, update, remove } = require('../controllers/categoryController');
const { protect } = require('../middleware/auth');

router.get('/', getAll);
router.post('/', protect, create);
router.put('/:id', protect, update);
router.delete('/:id', protect, remove);

module.exports = router;

// const express = require('express')
// const router = express.Router()
// const { protect } = require('../middleware/auth')
// const { getAllCategories, createCategory, deleteCategory } = require('../controllers/categoryController')

// router.get('/', getAllCategories)
// router.post('/', protect, createCategory)
// router.delete('/:id', protect, deleteCategory)

// module.exports = router