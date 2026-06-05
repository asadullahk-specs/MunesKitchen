const { Offer } = require('../models');

// GET /offers — public (pass ?active=true for homepage)
exports.getAll = async (req, res) => {
    try {
        const query = {};
        if (req.query.active === 'true') query.is_active = true;
        const offers = await Offer.find(query).sort({ created_at: -1 });
        res.json({ success: true, data: offers.map(o => o.toJSON()) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /offers — admin only
exports.create = async (req, res) => {
    try {
        const { name, description, original_price, discounted_price, discount_percentage, image, is_active } = req.body;
        if (!name || !original_price || !discounted_price) {
            return res.status(400).json({ success: false, message: 'Name, original price and discounted price are required.' });
        }
        const offer = await Offer.create({
            name, description, original_price, discounted_price,
            discount_percentage: discount_percentage || 0,
            image: image || '',
            is_active: is_active === true || is_active === 'true'
        });
        res.status(201).json({ success: true, data: offer.toJSON() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /offers/:id — admin only
exports.update = async (req, res) => {
    try {
        const { name, description, original_price, discounted_price, discount_percentage, image, is_active } = req.body;
        const offer = await Offer.findByIdAndUpdate(
            req.params.id,
            { name, description, original_price, discounted_price, discount_percentage, image, is_active },
            { new: true, runValidators: true }
        );
        if (!offer) return res.status(404).json({ success: false, message: 'Offer not found.' });
        res.json({ success: true, data: offer.toJSON() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /offers/:id — admin only
exports.remove = async (req, res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Offer deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
