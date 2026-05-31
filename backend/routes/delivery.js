const express = require('express');
const router = express.Router();
const { getDeliveryAreas, createDeliveryArea, updateDeliveryArea, deleteDeliveryArea } = require('../controllers/deliveryController');
const { protect } = require('../middleware/auth');

router.get('/', getDeliveryAreas);
router.post('/', protect, createDeliveryArea);
router.put('/:id', protect, updateDeliveryArea);
router.delete('/:id', protect, deleteDeliveryArea);

module.exports = router;

// const express = require('express')
// const router = express.Router()

// router.get('/', async (req, res) => {
//     try {
//         const { sequelize } = require('../config/database')
//         const [areas] = await sequelize.query(
//             'SELECT id, name, charge AS delivery_charge FROM delivery_areas ORDER BY name ASC'
//         )
//         res.json({ success: true, areas })
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message })
//     }
// })

// router.post('/', async (req, res) => {
//     try {
//         const { sequelize } = require('../config/database')
//         const { name, charge } = req.body
//         if (!name) return res.status(400).json({ success: false, message: 'Name required' })
//         await sequelize.query(
//             'INSERT INTO delivery_areas (name, charge) VALUES (?, ?)',
//             { replacements: [name, charge || 0] }
//         )
//         res.status(201).json({ success: true, message: 'Area added' })
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message })
//     }
// })

// router.delete('/:id', async (req, res) => {
//     try {
//         const { sequelize } = require('../config/database')
//         await sequelize.query(
//             'DELETE FROM delivery_areas WHERE id = ?',
//             { replacements: [req.params.id] }
//         )
//         res.json({ success: true, message: 'Deleted' })
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message })
//     }
// })

// module.exports = router