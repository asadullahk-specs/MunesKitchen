const express = require('express');
const router = express.Router();
const { getDeliveryAreas, createDeliveryArea, updateDeliveryArea, deleteDeliveryArea } = require('../controllers/deliveryController');
const { protect } = require('../middleware/auth');

router.get('/', getDeliveryAreas);
router.post('/', protect, createDeliveryArea);
router.put('/:id', protect, updateDeliveryArea);
router.delete('/:id', protect, deleteDeliveryArea);

module.exports = router;