const { Category, Product } = require('../models');

exports.getAll = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        const categoriesWithProductCount = await Promise.all(categories.map(async (cat) => {
            const count = await Product.countDocuments({ category_id: cat._id });
            const catObj = cat.toObject();
            catObj.products = { length: count };
            return catObj;
        }));
        res.json({ success: true, data: categoriesWithProductCount });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }
        const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const existing = await Category.findOne({ slug });
        if (existing) {
            return res.status(400).json({ success: false, message: 'A category with this name already exists' });
        }
        await Category.create({ name: name.trim(), slug });
        res.status(201).json({ success: true, message: 'Category created' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }
        const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await Category.findByIdAndUpdate(req.params.id, { name: name.trim(), slug, icon: null }, { new: true });
        res.json({ success: true, message: 'Category updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.remove = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Category deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};