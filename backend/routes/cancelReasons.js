const express = require('express');
const router = express.Router();
const { getCancelReasons, createCancelReason, updateCancelReason, deleteCancelReason } = require('../controllers/cancelReasonController');
const { protect } = require('../middleware/auth');

router.get('/', getCancelReasons);
router.post('/', protect, createCancelReason);
router.put('/:id', protect, updateCancelReason);
router.delete('/:id', protect, deleteCancelReason);

module.exports = router;
