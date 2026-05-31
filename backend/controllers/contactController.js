const { Contact } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ created_at: -1 });
        res.json({ success: true, data: contacts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Name is required.' });
        }
        if (!message || !message.trim()) {
            return res.status(400).json({ success: false, message: 'Message is required.' });
        }

        const contact = await Contact.create({
            name: name.trim(),
            email: email ? email.trim() : null,
            phone: phone ? phone.trim() : null,
            subject: subject ? subject.trim() : null,
            message: message.trim()
        });
        res.status(201).json({ success: true, data: contact });
    } catch (error) {
        console.error("Database Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        const is_read = req.body.is_read !== undefined ? req.body.is_read : true;
        const contact = await Contact.findByIdAndUpdate(req.params.id, { is_read }, { new: true });
        if (!contact) return res.status(404).json({ success: false, message: 'Not found.' });
        res.json({ success: true, data: contact });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) return res.status(404).json({ success: false, message: 'Not found.' });
        res.json({ success: true, message: 'Contact deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};