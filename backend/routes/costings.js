const express = require('express');
const router = express.Router();
const { getProductCosting, upsertProductCosting } = require('../controllers/costingController');
const { protect } = require('../middleware/auth');

router.get('/:productId', protect, getProductCosting);
router.post('/:productId', protect, upsertProductCosting);

module.exports = router;
