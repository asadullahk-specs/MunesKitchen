const { Subject } = require('../models');

// Get all subjects
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find().sort({ created_at: 1 });
        res.json({
            success: true,
            subjects: subjects.map(s => s.toJSON())
        });
    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Create a subject
const createSubject = async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Subject name is required' });
    }
    try {
        const trimmedName = name.trim();
        const exists = await Subject.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Subject already exists' });
        }
        const newSubject = await Subject.create({ name: trimmedName });
        res.status(201).json({ success: true, message: 'Subject added', data: newSubject });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a subject
const updateSubject = async (req, res) => {
    const { name } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Subject name is required' });
    }
    try {
        const trimmedName = name.trim();
        const exists = await Subject.findOne({
            name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
            _id: { $ne: req.params.id }
        });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Subject already exists' });
        }
        const result = await Subject.findByIdAndUpdate(req.params.id, {
            name: trimmedName
        }, { new: true });
        if (!result) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        res.json({ success: true, message: 'Subject updated successfully', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a subject
const deleteSubject = async (req, res) => {
    try {
        const result = await Subject.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }
        res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { getSubjects, createSubject, updateSubject, deleteSubject };
