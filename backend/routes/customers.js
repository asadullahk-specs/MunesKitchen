const express = require('express')
const router = express.Router()
const { protect } = require('../middleware/auth')
const { getAllCustomers } = require('../controllers/customerController')

router.get('/', protect, getAllCustomers)

module.exports = router