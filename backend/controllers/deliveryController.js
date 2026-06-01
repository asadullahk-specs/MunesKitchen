const { DeliveryArea } = require('../models');

// Get all delivery areas
const getDeliveryAreas = async (req, res) => {
    try {
        const areas = await DeliveryArea.find().sort({ name: 1 });
        // Call .toJSON() on each doc so the id virtual is included in the response
        res.json({
            success: true,
            areas: areas.map(a => a.toJSON())
        });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a delivery area
const createDeliveryArea = async (req, res) => {
    const { name, charge } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'Area name is required' });
    }
    try {
        const parsedCharge = parseFloat(charge);
        const safeCharge = isNaN(parsedCharge) ? 0 : parsedCharge;
        console.log(`Creating delivery area: ${name}, charge: ${safeCharge} (raw: ${charge})`);
        const newArea = await DeliveryArea.create({ name: name.trim(), charge: safeCharge });
        res.status(201).json({ success: true, message: 'Delivery area added', data: newArea });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a delivery area
const updateDeliveryArea = async (req, res) => {
    const { name, charge } = req.body;
    if (!name) {
        return res.status(400).json({ success: false, message: 'Area name is required' });
    }
    try {
        const parsedCharge = parseFloat(charge);
        const safeCharge = isNaN(parsedCharge) ? 0 : parsedCharge;
        console.log(`Updating delivery area ${req.params.id}: ${name}, charge: ${safeCharge} (raw: ${charge})`);
        const result = await DeliveryArea.findByIdAndUpdate(req.params.id, {
            name: name.trim(),
            charge: safeCharge
        }, { new: true });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Area not found' });
        }
        res.json({ success: true, message: 'Delivery area updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a delivery area
const deleteDeliveryArea = async (req, res) => {
    try {
        const result = await DeliveryArea.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Area not found' });
        }
        res.json({ success: true, message: 'Delivery area deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getDeliveryAreas, createDeliveryArea, updateDeliveryArea, deleteDeliveryArea };