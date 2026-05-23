const DeliveryArea = require('../models/DeliveryArea');

// Get all delivery areas
const getDeliveryAreas = async (req, res) => {
    try {
        const areas = await DeliveryArea.findAll({
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            areas: areas // Return the raw records directly
        });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a delivery area
const createDeliveryArea = async (req, res) => {
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'Area name is required' });
    }
    try {
        const newArea = await DeliveryArea.create({ name });
        res.status(201).json({ success: true, message: 'Delivery area added', data: newArea });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a delivery area
const deleteDeliveryArea = async (req, res) => {
    try {
        const result = await DeliveryArea.destroy({
            where: { id: req.params.id }
        });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Area not found' });
        }
        res.json({ success: true, message: 'Delivery area deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDeliveryAreas, createDeliveryArea, deleteDeliveryArea };