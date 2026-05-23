const Contact = require('../models/Contact');
const { sequelize } = require('../config/database')

exports.getAll = async (req, res) => {
    try {
        const contacts = await Contact.findAll({ order: [['created_at', 'DESC']] });
        res.json({ success: true, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, phone, message } = req.body;
        if (!name || !phone || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        // This line crashes if Contact is not imported
        const contact = await Contact.create({ name, phone, message });

        res.status(201).json({ success: true, data: contact });
    } catch (error) {
        console.error("Database Error:", error); // This helps you see the crash in the terminal
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (!contact) return res.status(404).json({ success: false, message: 'Not found.' });
        await contact.update({ is_read: true });
        res.json({ success: true, data: contact });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const contact = await Contact.findByPk(req.params.id);
        if (!contact) return res.status(404).json({ success: false, message: 'Not found.' });
        await contact.destroy();
        res.json({ success: true, message: 'Contact deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};