const express = require('express');
const router = express.Router();
const { getAll, create, remove, getPending, updateStatus } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/', getAll);
router.post('/', create);
router.get('/pending', protect, getPending);
router.put('/:id/status', protect, updateStatus);
router.delete('/:id', protect, remove);

module.exports = router;