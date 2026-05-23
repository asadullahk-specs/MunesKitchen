const express = require('express');
const router = express.Router();
const { getAll, getOne, create, update, remove } = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', protect, upload.single('image'), create);
router.put('/:id', protect, upload.single('image'), update);
router.delete('/:id', protect, remove);

module.exports = router;