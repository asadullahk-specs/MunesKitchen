const { CancelReason } = require('../models');

// Get all cancel reasons
const getCancelReasons = async (req, res) => {
    try {
        const reasons = await CancelReason.find().sort({ created_at: 1 });
        res.json({
            success: true,
            reasons: reasons.map(r => r.toJSON())
        });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a cancel reason
const createCancelReason = async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Cancel reason is required' });
    }
    try {
        const trimmedName = name.trim();
        const exists = await CancelReason.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Cancel reason already exists' });
        }
        const newReason = await CancelReason.create({ name: trimmedName });
        res.status(201).json({ success: true, message: 'Cancel reason added', data: newReason });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a cancel reason
const updateCancelReason = async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Cancel reason is required' });
    }
    try {
        const trimmedName = name.trim();
        const exists = await CancelReason.findOne({
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
            _id: { $ne: req.params.id }
        });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Cancel reason already exists' });
        }
        const result = await CancelReason.findByIdAndUpdate(req.params.id, {
            name: trimmedName
        }, { new: true });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Cancel reason not found' });
        }
        res.json({ success: true, message: 'Cancel reason updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a cancel reason
const deleteCancelReason = async (req, res) => {
    try {
        const result = await CancelReason.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Cancel reason not found' });
        }
        res.json({ success: true, message: 'Cancel reason deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getCancelReasons, createCancelReason, updateCancelReason, deleteCancelReason };
