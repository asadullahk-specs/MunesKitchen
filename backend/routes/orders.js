const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const {
    createOrder,
    trackOrder,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getDashboardStats,
    deleteOrder
} = require('../controllers/orderController')

router.post('/', createOrder)
router.get('/track/:orderNumber', trackOrder)
router.get('/dashboard/stats', protect, getDashboardStats)
router.get('/', protect, getAllOrders)
router.get('/:id', protect, getOrderById)
router.put('/:id/status', protect, updateOrderStatus)
router.delete('/:id', protect, deleteOrder)

module.exports = router